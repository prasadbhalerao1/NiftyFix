import {
  decodePDFRawStream,
  PDFArray,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  type PDFDocument,
} from '@cantoo/pdf-lib';

/**
 * Where images are drawn: a small reader of page content streams that tracks
 * only the transformation matrix (q, Q, cm) and image drawing (Do, inline
 * BI…ID…EI), following form XObjects. Everything else is skipped, so text,
 * paths and colours cost nothing.
 */

/** [a b c d e f]: maps the image's unit square to page space (points). */
export type Matrix = readonly [number, number, number, number, number, number];

export interface ImagePlacement {
  /** The image XObject. Inline images are registered as XObjects of `doc` so they flow the same way. */
  ref: PDFRef;
  stream: PDFRawStream;
  matrix: Matrix;
}

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** m × n in PDF's row-vector convention: apply m first, then n. */
export function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[1] * n[2],
    m[0] * n[1] + m[1] * n[3],
    m[2] * n[0] + m[3] * n[2],
    m[2] * n[1] + m[3] * n[3],
    m[4] * n[0] + m[5] * n[2] + n[4],
    m[4] * n[1] + m[5] * n[3] + n[5],
  ];
}

export type Value =
  number | boolean | null | { name: string } | { text: true } | Value[] | DictValue;
export interface DictValue {
  dict: Map<string, Value>;
}

const WHITESPACE = new Set([0, 9, 10, 12, 13, 32]);
const DELIMITERS = new Set([...'()<>[]{}/%'].map((c) => c.charCodeAt(0)));
const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/;

/** Reads a content stream token by token; `start` is where the last token began. */
export class Lexer {
  i = 0;
  start = 0;
  constructor(readonly b: Uint8Array) {}

  /** The next value, or an operator as a string; undefined at the end. */
  next(): Value | string | undefined {
    this.skipSpace();
    const begin = this.i;
    const token = this.read();
    this.start = begin;
    return token;
  }

  private skipSpace(): void {
    const { b } = this;
    while (this.i < b.length) {
      const c = b[this.i] ?? 0;
      if (WHITESPACE.has(c)) this.i += 1;
      else if (c === 0x25)
        while (this.i < b.length && b[this.i] !== 10 && b[this.i] !== 13) this.i += 1;
      else return;
    }
  }

  private word(): string {
    const start = this.i;
    while (this.i < this.b.length) {
      const c = this.b[this.i] ?? 0;
      if (WHITESPACE.has(c) || DELIMITERS.has(c)) break;
      this.i += 1;
    }
    return String.fromCharCode(...this.b.subarray(start, this.i));
  }

  private read(): Value | string | undefined {
    const { b } = this;
    if (this.i >= b.length) return undefined;
    const c = b[this.i];
    if (c === 0x28) {
      // ( literal string ), with nesting and backslash escapes.
      let depth = 0;
      for (; this.i < b.length; this.i += 1) {
        const d = b[this.i];
        if (d === 0x5c) this.i += 1;
        else if (d === 0x28) depth += 1;
        else if (d === 0x29 && --depth === 0) break;
      }
      this.i += 1;
      return { text: true };
    }
    if (c === 0x3c && b[this.i + 1] === 0x3c) {
      this.i += 2;
      const dict = new Map<string, Value>();
      for (;;) {
        const key = this.next();
        if (key === '>>' || key === undefined) return { dict };
        const value = this.next();
        if (typeof key === 'object' && key !== null && 'name' in key && typeof value !== 'string')
          dict.set(key.name, value ?? null);
      }
    }
    if (c === 0x3e && b[this.i + 1] === 0x3e) {
      this.i += 2;
      return '>>';
    }
    if (c === 0x3c) {
      while (this.i < b.length && b[this.i] !== 0x3e) this.i += 1;
      this.i += 1;
      return { text: true };
    }
    if (c === 0x5b) {
      this.i += 1;
      const items: Value[] = [];
      for (;;) {
        const item = this.next();
        if (item === ']' || item === undefined) return items;
        if (typeof item !== 'string') items.push(item);
      }
    }
    if (c === 0x5d || c === 0x7b || c === 0x7d || c === 0x3e || c === 0x29) {
      this.i += 1;
      return String.fromCharCode(c);
    }
    if (c === 0x2f) {
      this.i += 1;
      return { name: this.word() };
    }
    const word = this.word();
    if (word === '') {
      this.i += 1;
      return '';
    }
    if (NUMBER.test(word)) return Number(word);
    if (word === 'true' || word === 'false') return word === 'true';
    if (word === 'null') return null;
    return word;
  }

  /** Inline image data after ID: up to the EI that ends it. */
  inlineData(dict: Map<string, Value>): Uint8Array {
    const { b } = this;
    // One whitespace byte separates ID from the data.
    const start = this.i + 1;
    const filters = [dict.get('F') ?? dict.get('Filter')].flat();
    const isJpeg = filters.some(
      (f) => typeof f === 'object' && f !== null && 'name' in f && /^(DCT|DCTDecode)$/.test(f.name),
    );
    // JPEG data may contain " EI " by chance; its end-of-image marker comes first.
    let end = start;
    if (isJpeg) {
      while (end + 1 < b.length && !(b[end] === 0xff && b[end + 1] === 0xd9)) end += 1;
    }
    for (; end + 1 < b.length; end += 1) {
      if (
        b[end] === 0x45 &&
        b[end + 1] === 0x49 &&
        WHITESPACE.has(b[end - 1] ?? 32) &&
        (end + 2 >= b.length || WHITESPACE.has(b[end + 2] ?? 32))
      ) {
        break;
      }
    }
    this.i = end + 2;
    // Drop the whitespace before EI.
    return b.slice(start, Math.max(start, end - 1));
  }
}

const INLINE_KEYS: Record<string, string> = {
  BPC: 'BitsPerComponent',
  CS: 'ColorSpace',
  D: 'Decode',
  DP: 'DecodeParms',
  F: 'Filter',
  H: 'Height',
  IM: 'ImageMask',
  I: 'Interpolate',
  W: 'Width',
  L: 'Length',
};
const INLINE_NAMES: Record<string, string> = {
  G: 'DeviceGray',
  RGB: 'DeviceRGB',
  CMYK: 'DeviceCMYK',
  I: 'Indexed',
  AHx: 'ASCIIHexDecode',
  A85: 'ASCII85Decode',
  LZW: 'LZWDecode',
  Fl: 'FlateDecode',
  RL: 'RunLengthDecode',
  CCF: 'CCITTFaxDecode',
  DCT: 'DCTDecode',
};

/** Turn an inline image into an image XObject in `doc` (long key and value names, named colour spaces resolved). */
export function registerInline(
  doc: PDFDocument,
  dict: Map<string, Value>,
  data: Uint8Array,
  resources: PDFDict | undefined,
): { ref: PDFRef; stream: PDFRawStream } {
  const convert = (value: Value, key: string): unknown => {
    if (Array.isArray(value)) return value.map((item) => convert(item, key));
    if (value !== null && typeof value === 'object' && 'name' in value) {
      const long = INLINE_NAMES[value.name] ?? value.name;
      if (key === 'ColorSpace' && !/^(Device|Indexed$|Pattern$)/.test(long)) {
        // A named colour space from the page resources.
        const spaces = resources?.lookup(PDFName.of('ColorSpace'));
        const found = spaces instanceof PDFDict ? spaces.get(PDFName.of(long)) : undefined;
        if (found) return found;
      }
      return PDFName.of(long);
    }
    if (value !== null && typeof value === 'object' && 'dict' in value) {
      return Object.fromEntries(
        [...value.dict].map(([k, v]) => [INLINE_KEYS[k] ?? k, convert(v, INLINE_KEYS[k] ?? k)]),
      );
    }
    if (value !== null && typeof value === 'object') return null;
    return value;
  };
  const entries: Record<string, unknown> = { Type: 'XObject', Subtype: 'Image' };
  for (const [key, value] of dict) {
    const long = INLINE_KEYS[key] ?? key;
    if (long !== 'Length') entries[long] = convert(value, long);
  }
  const stream = PDFRawStream.of(doc.context.obj(entries as never) as unknown as PDFDict, data);
  return { ref: doc.context.register(stream), stream };
}

export function contentBytes(contents: unknown, doc: PDFDocument): Uint8Array {
  const resolve = (value: unknown): unknown =>
    value instanceof PDFRef ? doc.context.lookup(value) : value;
  const item = resolve(contents);
  const streams = item instanceof PDFArray ? item.asArray().map(resolve) : [item];
  const parts = streams
    .filter((stream): stream is PDFRawStream => stream instanceof PDFRawStream)
    .map((stream) => decodePDFRawStream(stream).decode());
  // Streams of one page are concatenated with a separator, as viewers do.
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length + 1, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    out[offset + part.length] = 10;
    offset += part.length + 1;
  }
  return out;
}

const matrixOf = (value: unknown): Matrix | null => {
  if (!(value instanceof PDFArray) || value.size() !== 6) return null;
  const numbers = value
    .asArray()
    .map((item) => (item instanceof PDFNumber ? item.asNumber() : NaN));
  return numbers.every(Number.isFinite) ? (numbers as unknown as Matrix) : null;
};

/** Every image drawn on a page (0-based), in drawing order, with where it lands. */
export function imagePlacements(doc: PDFDocument, pageIndex: number): ImagePlacement[] {
  const page = doc.getPage(pageIndex);
  const found: ImagePlacement[] = [];
  const walk = (
    bytes: Uint8Array,
    resources: PDFDict | undefined,
    base: Matrix,
    depth: number,
  ): void => {
    if (depth > 8) return;
    const lexer = new Lexer(bytes);
    const stack: Matrix[] = [];
    let ctm = base;
    let operands: (Value | string)[] = [];
    for (let token = lexer.next(); token !== undefined; token = lexer.next()) {
      if (typeof token !== 'string') {
        operands.push(token);
        continue;
      }
      if (token === 'q') stack.push(ctm);
      else if (token === 'Q') ctm = stack.pop() ?? ctm;
      else if (token === 'cm') {
        const m = operands.slice(-6);
        if (m.length === 6 && m.every((n) => typeof n === 'number'))
          ctm = multiply(m as unknown as Matrix, ctm);
      } else if (token === 'Do') {
        const name = operands.at(-1);
        const xobjects = resources?.lookup(PDFName.of('XObject'));
        const ref =
          xobjects instanceof PDFDict && typeof name === 'object' && name !== null && 'name' in name
            ? xobjects.get(PDFName.of(name.name))
            : undefined;
        const object = ref instanceof PDFRef ? doc.context.lookup(ref) : undefined;
        if (ref instanceof PDFRef && object instanceof PDFRawStream) {
          const subtype = object.dict.lookup(PDFName.of('Subtype'));
          if (subtype === PDFName.of('Image')) found.push({ ref, stream: object, matrix: ctm });
          else if (subtype === PDFName.of('Form')) {
            const own = object.dict.lookup(PDFName.of('Resources'));
            const matrix = matrixOf(object.dict.lookup(PDFName.of('Matrix'))) ?? IDENTITY;
            walk(
              decodePDFRawStream(object).decode(),
              own instanceof PDFDict ? own : resources,
              multiply(matrix, ctm),
              depth + 1,
            );
          }
        }
      } else if (token === 'BI') {
        const dict = new Map<string, Value>();
        for (let key = lexer.next(); key !== undefined && key !== 'ID'; key = lexer.next()) {
          const value = lexer.next();
          if (typeof key === 'object' && key !== null && 'name' in key && typeof value !== 'string')
            dict.set(key.name, value ?? null);
        }
        const data = lexer.inlineData(dict);
        found.push({ ...registerInline(doc, dict, data, resources), matrix: ctm });
      }
      operands = [];
    }
  };
  const resources = page.node.Resources();
  walk(contentBytes(page.node.Contents(), doc), resources, IDENTITY, 0);
  return found;
}

type Direction = 'right' | 'left' | 'down' | 'up';
const ORIENTATIONS: Record<string, number> = {
  'right down': 1,
  'left down': 2,
  'left up': 3,
  'right up': 4,
  'down right': 5,
  'down left': 6,
  'up left': 7,
  'up right': 8,
};

/** A screen vector (y down) as one of four directions; null if it is not along an axis. */
function direction(x: number, y: number): Direction | null {
  const size = Math.max(Math.abs(x), Math.abs(y));
  if (size === 0) return null;
  if (Math.abs(y) <= size * 1e-6) return x > 0 ? 'right' : 'left';
  if (Math.abs(x) <= size * 1e-6) return y > 0 ? 'down' : 'up';
  return null;
}

/**
 * The EXIF orientation (1 to 8) that shows a stored image as it appears on
 * the page, given where it is drawn and the page's rotation (degrees
 * clockwise). Null for skewed or arbitrarily rotated drawings.
 */
export function displayOrientation(matrix: Matrix, pageRotation: number): number | null {
  const [a, b, c, d] = matrix;
  // Image rows run top to bottom, so stored x and y become these screen vectors.
  let across: [number, number] = [a, -b];
  let down: [number, number] = [-c, d];
  const turns = (((Math.round(pageRotation / 90) % 4) + 4) % 4) as number;
  for (let i = 0; i < turns; i += 1) {
    across = [-across[1], across[0]];
    down = [-down[1], down[0]];
  }
  const u = direction(...across);
  const v = direction(...down);
  return u && v ? (ORIENTATIONS[`${u} ${v}`] ?? null) : null;
}
