import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  type PDFContext,
} from '@cantoo/pdf-lib';

/**
 * Evaluate PDF functions (spec 7.10): sampled (type 0), exponential (2),
 * stitching (3) and PostScript calculator (4). Spot colours and gradients
 * describe their colours with these, so converting them to gray means
 * running them. Inputs and outputs are clipped to Domain and Range.
 */
export type PdfFunction = (input: readonly number[]) => number[];

const numbers = (value: unknown, context: PDFContext): number[] | null => {
  const array = value instanceof PDFRef ? context.lookup(value) : value;
  if (!(array instanceof PDFArray)) return null;
  return array.asArray().map((item) => {
    const resolved = item instanceof PDFRef ? context.lookup(item) : item;
    return resolved instanceof PDFNumber ? resolved.asNumber() : NaN;
  });
};

const clip = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

const interpolate = (x: number, x0: number, x1: number, y0: number, y1: number): number =>
  x1 === x0 ? y0 : y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);

function clipAll(values: readonly number[], bounds: readonly number[] | null): number[] {
  if (!bounds) return [...values];
  return values.map((v, i) => clip(v, bounds[2 * i] ?? -Infinity, bounds[2 * i + 1] ?? Infinity));
}

function sampled(dict: PDFDict, data: Uint8Array, context: PDFContext): PdfFunction | null {
  const domain = numbers(dict.lookup(PDFName.of('Domain')), context);
  const range = numbers(dict.lookup(PDFName.of('Range')), context);
  const size = numbers(dict.lookup(PDFName.of('Size')), context);
  const bits = (dict.lookup(PDFName.of('BitsPerSample')) as PDFNumber | undefined)?.asNumber();
  if (!domain || !range || !size || !bits || ![1, 2, 4, 8, 12, 16, 24, 32].includes(bits))
    return null;
  const m = size.length;
  const n = range.length / 2;
  const encode =
    numbers(dict.lookup(PDFName.of('Encode')), context) ?? size.flatMap((s) => [0, s - 1]);
  const decode = numbers(dict.lookup(PDFName.of('Decode')), context) ?? range;
  const max = 2 ** bits - 1;
  const sample = (index: number): number => {
    let value = 0;
    const bit = index * bits;
    for (let i = 0; i < bits; i += 1) {
      const at = bit + i;
      value = value * 2 + (((data[at >> 3] ?? 0) >> (7 - (at & 7))) & 1);
    }
    return value;
  };
  return (input) => {
    const x = clipAll(input, domain);
    // Position of the input in the sample grid, per dimension.
    const e = x.map((xi, i) =>
      clip(
        interpolate(
          xi,
          domain[2 * i] ?? 0,
          domain[2 * i + 1] ?? 1,
          encode[2 * i] ?? 0,
          encode[2 * i + 1] ?? 0,
        ),
        0,
        (size[i] ?? 1) - 1,
      ),
    );
    const out = new Array<number>(n).fill(0);
    // Multilinear interpolation over the 2^m surrounding samples.
    for (let corner = 0; corner < 1 << m; corner += 1) {
      let weight = 1;
      let index = 0;
      let stride = 1;
      for (let i = 0; i < m; i += 1) {
        const low = Math.floor(e[i] ?? 0);
        const high = Math.min(low + 1, (size[i] ?? 1) - 1);
        const t = (e[i] ?? 0) - low;
        const upper = (corner >> i) & 1;
        weight *= upper ? t : 1 - t;
        index += (upper ? high : low) * stride;
        stride *= size[i] ?? 1;
      }
      if (weight === 0) continue;
      for (let j = 0; j < n; j += 1) out[j] = (out[j] ?? 0) + weight * sample(index * n + j);
    }
    return clipAll(
      out.map((s, j) => interpolate(s, 0, max, decode[2 * j] ?? 0, decode[2 * j + 1] ?? 1)),
      range,
    );
  };
}

function exponential(dict: PDFDict, context: PDFContext): PdfFunction | null {
  const domain = numbers(dict.lookup(PDFName.of('Domain')), context);
  const range = numbers(dict.lookup(PDFName.of('Range')), context);
  const c0 = numbers(dict.lookup(PDFName.of('C0')), context) ?? [0];
  const c1 = numbers(dict.lookup(PDFName.of('C1')), context) ?? [1];
  const exponent = (dict.lookup(PDFName.of('N')) as PDFNumber | undefined)?.asNumber();
  if (exponent === undefined) return null;
  return (input) => {
    const x = clipAll(input, domain)[0] ?? 0;
    const p = x ** exponent;
    return clipAll(
      c0.map((a, i) => a + p * ((c1[i] ?? 0) - a)),
      range,
    );
  };
}

function stitching(dict: PDFDict, context: PDFContext, depth: number): PdfFunction | null {
  const domain = numbers(dict.lookup(PDFName.of('Domain')), context);
  const range = numbers(dict.lookup(PDFName.of('Range')), context);
  const bounds = numbers(dict.lookup(PDFName.of('Bounds')), context) ?? [];
  const encode = numbers(dict.lookup(PDFName.of('Encode')), context);
  const list = dict.lookup(PDFName.of('Functions'));
  if (!domain || !encode || !(list instanceof PDFArray)) return null;
  const parts = list.asArray().map((item) => makeFunction(item, context, depth + 1));
  if (parts.some((part) => part === null)) return null;
  return (input) => {
    const x = clipAll(input, domain)[0] ?? 0;
    let k = bounds.findIndex((bound) => x < bound);
    if (k === -1) k = bounds.length;
    const low = k === 0 ? (domain[0] ?? 0) : (bounds[k - 1] ?? 0);
    const high = k === bounds.length ? (domain[1] ?? 1) : (bounds[k] ?? 1);
    const t = interpolate(x, low, high, encode[2 * k] ?? 0, encode[2 * k + 1] ?? 1);
    return clipAll((parts[k] as PdfFunction)([t]), range);
  };
}

type Op = number | boolean | string | { block: Op[]; else?: Op[] };

function parseCalculator(text: string): Op[] | null {
  const tokens = text.match(/[{}]|[^\s{}]+/g) ?? [];
  let at = 0;
  const block = (): Op[] | null => {
    if (tokens[at] !== '{') return null;
    at += 1;
    const ops: Op[] = [];
    while (at < tokens.length && tokens[at] !== '}') {
      const token = tokens[at] as string;
      if (token === '{') {
        const first = block();
        if (!first) return null;
        if (tokens[at] === '{') {
          const second = block();
          if (!second || tokens[at] !== 'ifelse') return null;
          ops.push({ block: first, else: second });
        } else if (tokens[at] === 'if') ops.push({ block: first });
        else return null;
        at += 1;
        continue;
      }
      if (/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(token)) ops.push(Number(token));
      else if (token === 'true' || token === 'false') ops.push(token === 'true');
      else ops.push(token);
      at += 1;
    }
    at += 1;
    return ops;
  };
  return block();
}

const DEG = Math.PI / 180;

function runCalculator(ops: readonly Op[], stack: (number | boolean)[]): void {
  const num = (): number => Number(stack.pop() ?? 0);
  const pop = (): number | boolean => stack.pop() ?? 0;
  for (const op of ops) {
    if (typeof op === 'number' || typeof op === 'boolean') {
      stack.push(op);
      continue;
    }
    if (typeof op === 'object') {
      const condition = pop();
      if (condition === true) runCalculator(op.block, stack);
      else if (op.else) runCalculator(op.else, stack);
      continue;
    }
    switch (op) {
      case 'abs':
        stack.push(Math.abs(num()));
        break;
      case 'add': {
        const b = num();
        stack.push(num() + b);
        break;
      }
      case 'sub': {
        const b = num();
        stack.push(num() - b);
        break;
      }
      case 'mul': {
        const b = num();
        stack.push(num() * b);
        break;
      }
      case 'div': {
        const b = num();
        const a = num();
        stack.push(b === 0 ? 0 : a / b);
        break;
      }
      case 'idiv': {
        const b = num();
        const a = num();
        stack.push(b === 0 ? 0 : Math.trunc(a / b));
        break;
      }
      case 'mod': {
        const b = num();
        const a = num();
        stack.push(b === 0 ? 0 : a % b);
        break;
      }
      case 'neg':
        stack.push(-num());
        break;
      case 'ceiling':
        stack.push(Math.ceil(num()));
        break;
      case 'floor':
        stack.push(Math.floor(num()));
        break;
      case 'round':
        stack.push(Math.round(num()));
        break;
      case 'truncate':
      case 'cvi':
        stack.push(Math.trunc(num()));
        break;
      case 'cvr':
        stack.push(num());
        break;
      case 'sqrt':
        stack.push(Math.sqrt(Math.max(0, num())));
        break;
      case 'sin':
        stack.push(Math.sin(num() * DEG));
        break;
      case 'cos':
        stack.push(Math.cos(num() * DEG));
        break;
      case 'atan': {
        const den = num();
        const angle = Math.atan2(num(), den) / DEG;
        stack.push(angle < 0 ? angle + 360 : angle);
        break;
      }
      case 'exp': {
        const e = num();
        stack.push(num() ** e);
        break;
      }
      case 'ln':
        stack.push(Math.log(num()));
        break;
      case 'log':
        stack.push(Math.log10(num()));
        break;
      case 'eq': {
        const b = pop();
        stack.push(pop() === b);
        break;
      }
      case 'ne': {
        const b = pop();
        stack.push(pop() !== b);
        break;
      }
      case 'gt': {
        const b = num();
        stack.push(num() > b);
        break;
      }
      case 'ge': {
        const b = num();
        stack.push(num() >= b);
        break;
      }
      case 'lt': {
        const b = num();
        stack.push(num() < b);
        break;
      }
      case 'le': {
        const b = num();
        stack.push(num() <= b);
        break;
      }
      case 'and': {
        const b = pop();
        const a = pop();
        stack.push(typeof a === 'boolean' ? a && b === true : Number(a) & Number(b));
        break;
      }
      case 'or': {
        const b = pop();
        const a = pop();
        stack.push(typeof a === 'boolean' ? a || b === true : Number(a) | Number(b));
        break;
      }
      case 'xor': {
        const b = pop();
        const a = pop();
        stack.push(typeof a === 'boolean' ? a !== (b === true) : Number(a) ^ Number(b));
        break;
      }
      case 'not': {
        const a = pop();
        stack.push(typeof a === 'boolean' ? !a : ~Number(a));
        break;
      }
      case 'bitshift': {
        const s = num();
        const a = num();
        stack.push(s >= 0 ? a << s : a >> -s);
        break;
      }
      case 'true':
        stack.push(true);
        break;
      case 'false':
        stack.push(false);
        break;
      case 'pop':
        stack.pop();
        break;
      case 'dup':
        stack.push(stack.at(-1) ?? 0);
        break;
      case 'exch': {
        const b = pop();
        const a = pop();
        stack.push(b, a);
        break;
      }
      case 'copy': {
        const count = num();
        stack.push(...stack.slice(stack.length - count));
        break;
      }
      case 'index': {
        const i = num();
        stack.push(stack[stack.length - 1 - i] ?? 0);
        break;
      }
      case 'roll': {
        const j = num();
        const count = num();
        if (count > 0 && count <= stack.length) {
          const items = stack.splice(stack.length - count, count);
          const shift = ((j % count) + count) % count;
          stack.push(...items.slice(count - shift), ...items.slice(0, count - shift));
        }
        break;
      }
      default:
        throw new Error(`Unknown calculator operator ${op}`);
    }
  }
}

function calculator(dict: PDFDict, data: Uint8Array, context: PDFContext): PdfFunction | null {
  const domain = numbers(dict.lookup(PDFName.of('Domain')), context);
  const range = numbers(dict.lookup(PDFName.of('Range')), context);
  const ops = parseCalculator(new TextDecoder('latin1').decode(data));
  if (!domain || !range || !ops) return null;
  const n = range.length / 2;
  return (input) => {
    const stack: (number | boolean)[] = clipAll(input, domain);
    runCalculator(ops, stack);
    return clipAll(stack.slice(-n).map(Number), range);
  };
}

/** A PDF function object (or an array of 1-output functions, as shadings allow); null if unusable. */
export function makeFunction(value: unknown, context: PDFContext, depth = 0): PdfFunction | null {
  if (depth > 8) return null;
  const object = value instanceof PDFRef ? context.lookup(value) : value;
  if (object instanceof PDFArray) {
    const parts = object.asArray().map((item) => makeFunction(item, context, depth + 1));
    if (parts.some((part) => part === null)) return null;
    return (input) => parts.flatMap((part) => (part as PdfFunction)(input).slice(0, 1));
  }
  const dict = object instanceof PDFRawStream ? object.dict : object;
  if (!(dict instanceof PDFDict)) return null;
  const type = (dict.lookup(PDFName.of('FunctionType')) as PDFNumber | undefined)?.asNumber();
  try {
    if (type === 2) return exponential(dict, context);
    if (type === 3) return stitching(dict, context, depth);
    if (object instanceof PDFRawStream) {
      const data = decodePDFRawStream(object).decode();
      if (type === 0) return sampled(dict, data, context);
      if (type === 4) return calculator(dict, data, context);
    }
  } catch {
    return null;
  }
  return null;
}
