import {
  decodePDFRawStream,
  PDFArray,
  PDFBool,
  PDFDict,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFStream,
  PDFString,
  PDFHexString,
  type PDFContext,
  type PDFDocument,
  type PDFObject,
} from '@cantoo/pdf-lib';
import { colourSpace, DEVICE_SPACES, type ColourSpace } from './colour';
import { isGrayOnly, tone, type Rgb, type ToneSettings } from './tone';
import { contentBytes, Lexer, registerInline, type Value } from './content';
import { makeFunction } from './functions';

/**
 * Convert a whole PDF to gray (or black and white, or softer colour) the way
 * Ghostscript's pdfwrite does, keeping it a real PDF: text stays text and
 * drawings stay sharp. Every colour operator in every content stream (pages,
 * forms, patterns, annotation appearances, Type 3 glyphs, soft masks) is
 * rewritten in place, leaving all other bytes as they were; gradients get
 * gray functions; indexed images get gray palettes. Images that need their
 * pixels changed are returned for the caller, which has the decoders.
 */

export interface ImageWork {
  ref: PDFRef;
  width: number;
  height: number;
  /** Stored with lossy compression (JPEG, JPEG 2000): re-encoding as JPEG loses nothing new. */
  lossy: boolean;
}

export interface GrayscaleResult {
  images: ImageWork[];
  /** Content streams rewritten. */
  streams: number;
  /** Colours or gradients in a form this cannot read (left as they are). */
  skipped: number;
}

const N = (name: string): PDFName => PDFName.of(name);
const fmt = (v: number): string => String(Math.round(v * 10000) / 10000);

class Converter {
  readonly done = new Set<string>();
  readonly images = new Map<string, ImageWork>();
  streams = 0;
  skipped = 0;
  readonly grayOnly: boolean;

  constructor(
    readonly doc: PDFDocument,
    readonly settings: ToneSettings,
  ) {
    this.grayOnly = isGrayOnly(settings);
  }

  get context(): PDFContext {
    return this.doc.context;
  }

  lookup(value: unknown): unknown {
    return value instanceof PDFRef ? this.context.lookup(value) : value;
  }

  /** "v g" or "r g b rg" (upper case for stroking). */
  colourOperator(rgb: Rgb, stroke: boolean, threshold = this.settings.threshold): string {
    const result = tone(rgb, { ...this.settings, threshold });
    if ('gray' in result) return `${fmt(result.gray)} ${stroke ? 'G' : 'g'}`;
    return `${result.rgb.map(fmt).join(' ')} ${stroke ? 'RG' : 'rg'}`;
  }

  /** Text colour in the black modes: black, unless it is near white (white text on dark boxes). */
  textOperator(rgb: Rgb, stroke: boolean): string {
    const gray = tone(rgb, { ...this.settings, mode: 'gray', strength: 1 });
    const light = 'gray' in gray && gray.gray >= 0.8;
    return `${light ? 1 : 0} ${stroke ? 'G' : 'g'}`;
  }

  /** Gray (or toned RGB) components for a colour, for arrays such as annotation colours. */
  components(rgb: Rgb): number[] {
    const result = tone(rgb, this.settings);
    return 'gray' in result ? [result.gray] : result.rgb;
  }

  spaceFor(value: unknown, resources: PDFDict | undefined): ColourSpace | 'pattern' | null {
    if (value instanceof PDFName || (typeof value === 'object' && value && 'name' in value)) {
      const name = value instanceof PDFName ? value.decodeText() : (value as { name: string }).name;
      if (name === 'Pattern') return 'pattern';
      if (DEVICE_SPACES[name]) return DEVICE_SPACES[name] ?? null;
      const spaces = this.lookup(resources?.lookup(N('ColorSpace')));
      const entry = spaces instanceof PDFDict ? spaces.get(N(name)) : undefined;
      const resolved = this.lookup(entry);
      if (resolved instanceof PDFArray && this.lookup(resolved.get(0)) === N('Pattern')) {
        return 'pattern';
      }
      return entry ? colourSpace(entry, this.context) : null;
    }
    return colourSpace(value, this.context);
  }

  /** Replace a stream's data, keeping its dictionary (Flate-compressed). */
  replaceStream(ref: PDFRef, stream: PDFRawStream, bytes: Uint8Array): void {
    const dict = stream.dict.clone(this.context);
    for (const key of ['Filter', 'DecodeParms', 'Length', 'DL']) dict.delete(N(key));
    const entries = Object.fromEntries(dict.entries().map(([k, v]) => [k.decodeText(), v]));
    this.context.assign(ref, this.context.flateStream(bytes, entries));
  }

  /** Rewrite colour operators in content bytes; returns the new bytes. */
  rewrite(bytes: Uint8Array, resources: PDFDict | undefined): Uint8Array {
    const black = this.settings.mode !== 'gray';
    const lexer = new Lexer(bytes);
    const parts: Uint8Array[] = [];
    let copied = 0;
    const replace = (from: number, to: number, text: string): void => {
      parts.push(bytes.subarray(copied, from), new TextEncoder().encode(text));
      copied = to;
    };
    interface State {
      fill: ColourSpace | 'pattern' | null;
      stroke: ColourSpace | 'pattern' | null;
      fillOut: string;
      strokeOut: string;
      fillRgb: Rgb;
      strokeRgb: Rgb;
    }
    let state: State = {
      fill: DEVICE_SPACES.DeviceGray ?? null,
      stroke: DEVICE_SPACES.DeviceGray ?? null,
      fillOut: '0 g',
      strokeOut: '0 G',
      fillRgb: [0, 0, 0],
      strokeRgb: [0, 0, 0],
    };
    const stack: State[] = [];
    let inText = false;
    let operands: { value: Value | string; start: number }[] = [];
    const strokeThreshold = (1 + this.settings.threshold) / 2;
    /** Set a colour: remember it, and write what the page should draw now. */
    const setColour = (stroke: boolean, rgb: Rgb, from: number, to: number): void => {
      const out = this.colourOperator(rgb, stroke, stroke ? strokeThreshold : undefined);
      if (stroke) {
        state.strokeOut = out;
        state.strokeRgb = rgb;
      } else {
        state.fillOut = out;
        state.fillRgb = rgb;
      }
      replace(from, to, inText && black ? this.textOperator(rgb, stroke) : out);
    };
    for (let token = lexer.next(); token !== undefined; token = lexer.next()) {
      const start = lexer.start;
      if (typeof token !== 'string') {
        operands.push({ value: token, start });
        continue;
      }
      const from = operands[0]?.start ?? start;
      const to = lexer.i;
      const nums = operands.map((o) => o.value).filter((v): v is number => typeof v === 'number');
      const stroke = token === token.toUpperCase() && token !== 'BI';
      switch (token) {
        case 'q':
          stack.push({ ...state });
          break;
        case 'Q':
          state = stack.pop() ?? state;
          break;
        case 'BT':
          inText = true;
          if (black) {
            replace(
              start,
              to,
              `BT ${this.textOperator(state.fillRgb, false)} ${this.textOperator(state.strokeRgb, true)}`,
            );
          }
          break;
        case 'ET':
          inText = false;
          if (black) replace(start, to, `ET ${state.fillOut} ${state.strokeOut}`);
          break;
        case 'g':
        case 'G':
          state[stroke ? 'stroke' : 'fill'] = DEVICE_SPACES.DeviceGray ?? null;
          setColour(stroke, [nums[0] ?? 0, nums[0] ?? 0, nums[0] ?? 0], from, to);
          break;
        case 'rg':
        case 'RG':
          state[stroke ? 'stroke' : 'fill'] = DEVICE_SPACES.DeviceRGB ?? null;
          setColour(stroke, [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0], from, to);
          break;
        case 'k':
        case 'K':
          state[stroke ? 'stroke' : 'fill'] = DEVICE_SPACES.DeviceCMYK ?? null;
          setColour(stroke, DEVICE_SPACES.DeviceCMYK?.toRgb(nums) ?? [0, 0, 0], from, to);
          break;
        case 'cs':
        case 'CS': {
          const space = this.spaceFor(operands[0]?.value, resources);
          state[stroke ? 'stroke' : 'fill'] = space;
          if (space === 'pattern') break;
          if (!space) {
            this.skipped += 1;
            break;
          }
          setColour(stroke, space.toRgb(space.initial), from, to);
          break;
        }
        case 'sc':
        case 'scn':
        case 'SC':
        case 'SCN': {
          const space = state[stroke ? 'stroke' : 'fill'];
          if (space === 'pattern') {
            // Uncoloured patterns carry a colour before the pattern name; its space becomes gray.
            const name = operands.at(-1)?.value;
            if (inText && black) {
              // Text drawn with a pattern is made solid black like other text.
              replace(from, to, this.textOperator([0, 0, 0], stroke));
            } else if (
              nums.length > 0 &&
              typeof name === 'object' &&
              name !== null &&
              'name' in name
            ) {
              const out = this.components(this.patternColour(operands.slice(0, -1)));
              replace(from, to, `${out.map(fmt).join(' ')} /${name.name} ${token}`);
            }
            break;
          }
          if (!space) break;
          setColour(stroke, space.toRgb(nums), from, to);
          break;
        }
        case 'BI': {
          const dict = new Map<string, Value>();
          for (let key = lexer.next(); key !== undefined && key !== 'ID'; key = lexer.next()) {
            const value = lexer.next();
            if (
              typeof key === 'object' &&
              key !== null &&
              'name' in key &&
              typeof value !== 'string'
            )
              dict.set(key.name, value ?? null);
          }
          const data = lexer.inlineData(dict);
          // An inline image becomes an image object, so it converts like any other.
          const { ref } = registerInline(this.doc, dict, data, resources);
          const name = this.addXObject(resources, ref);
          if (name) {
            this.noteImage(ref);
            replace(start, lexer.i, `/${name} Do`);
          }
          break;
        }
        default:
          break;
      }
      operands = [];
    }
    parts.push(bytes.subarray(copied));
    const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }

  /** An uncoloured pattern's colour, read by its number of components (gray, RGB or CMYK). */
  patternColour(operands: readonly { value: Value | string }[]): Rgb {
    const comps = operands.map((o) => o.value).filter((v): v is number => typeof v === 'number');
    if (comps.length === 4) return DEVICE_SPACES.DeviceCMYK?.toRgb(comps) ?? [0, 0, 0];
    if (comps.length === 3) return [comps[0] ?? 0, comps[1] ?? 0, comps[2] ?? 0];
    return [comps[0] ?? 0, comps[0] ?? 0, comps[0] ?? 0];
  }

  addXObject(resources: PDFDict | undefined, ref: PDFRef): string | null {
    if (!resources) return null;
    let xobjects = this.lookup(resources.get(N('XObject')));
    if (!(xobjects instanceof PDFDict)) {
      xobjects = this.context.obj({});
      resources.set(N('XObject'), xobjects as PDFDict);
    }
    const dict = xobjects as PDFDict;
    let i = 1;
    while (dict.has(N(`NFInline${i}`))) i += 1;
    dict.set(N(`NFInline${i}`), ref);
    return `NFInline${i}`;
  }

  noteImage(ref: PDFRef): void {
    const stream = this.context.lookup(ref);
    if (!(stream instanceof PDFRawStream) || this.images.has(ref.toString())) return;
    const dict = stream.dict;
    if (this.lookup(dict.get(N('ImageMask'))) instanceof PDFBool) {
      if ((this.lookup(dict.get(N('ImageMask'))) as PDFBool).asBoolean()) return;
    }
    const width = (this.lookup(dict.get(N('Width'))) as PDFNumber | undefined)?.asNumber() ?? 0;
    const height = (this.lookup(dict.get(N('Height'))) as PDFNumber | undefined)?.asNumber() ?? 0;
    if (width < 1 || height < 1) return;
    const space = this.lookup(dict.get(N('ColorSpace')));
    const filters = [this.lookup(dict.get(N('Filter')))].flatMap((f) =>
      f instanceof PDFArray ? f.asArray().map((x) => this.lookup(x)) : [f],
    );
    const lossy = filters.some((f) => f === N('DCTDecode') || f === N('JPXDecode'));
    const plainGray =
      space === N('DeviceGray') ||
      space === N('CalGray') ||
      (space === undefined && filters.includes(N('JBIG2Decode'))) ||
      filters.includes(N('CCITTFaxDecode'));
    const untouched =
      this.settings.mode === 'gray' &&
      this.settings.brightness === 0 &&
      this.settings.contrast === 0 &&
      plainGray;
    if (untouched) return;
    // Indexed images change only their palette: exact, no pixel work.
    if (
      space instanceof PDFArray &&
      [N('Indexed'), N('I')].includes(this.lookup(space.get(0)) as PDFName)
    ) {
      if (this.indexedToGray(stream, space)) return;
    }
    this.images.set(ref.toString(), { ref, width, height, lossy });
  }

  indexedToGray(stream: PDFRawStream, space: PDFArray): boolean {
    const converter = colourSpace(space, this.context);
    const hival = (this.lookup(space.get(2)) as PDFNumber | undefined)?.asNumber();
    if (!converter || hival === undefined) return false;
    const table: number[] = [];
    for (let i = 0; i <= hival; i += 1) table.push(...this.components(converter.toRgb([i])));
    const palette = Uint8Array.from(table, (v) => Math.round(v * 255));
    const base = this.grayOnly ? N('DeviceGray') : N('DeviceRGB');
    stream.dict.set(
      N('ColorSpace'),
      this.context.obj([
        N('Indexed'),
        base,
        hival,
        PDFHexString.of(Array.from(palette, (b) => b.toString(16).padStart(2, '0')).join('')),
      ]),
    );
    return true;
  }

  /** A gray (or toned RGB) sampled function standing in for a shading's colour function. */
  sampledFunction(inputs: number, domain: number[], colourAt: (input: number[]) => Rgb): PDFRef {
    const steps = inputs === 1 ? 256 : 33;
    const outputs = this.grayOnly ? 1 : 3;
    const samples: number[] = [];
    const point = (i: number, d: number): number =>
      (domain[2 * d] ?? 0) + ((domain[2 * d + 1] ?? 1) - (domain[2 * d] ?? 0)) * (i / (steps - 1));
    const total = steps ** inputs;
    for (let index = 0; index < total; index += 1) {
      const input =
        inputs === 1
          ? [point(index, 0)]
          : [point(index % steps, 0), point(Math.floor(index / steps), 1)];
      const rgb = colourAt(input);
      for (const v of this.components(rgb)) samples.push(Math.round(v * 255));
    }
    return this.context.register(
      this.context.flateStream(Uint8Array.from(samples), {
        FunctionType: 0,
        Domain: domain.slice(0, inputs * 2),
        Range: Array.from({ length: outputs }, () => [0, 1]).flat(),
        Size: new Array<number>(inputs).fill(steps),
        BitsPerSample: 8,
      }),
    );
  }

  convertShading(value: unknown): void {
    const ref = value instanceof PDFRef ? value : null;
    if (ref && this.done.has(ref.toString())) return;
    if (ref) this.done.add(ref.toString());
    const object = this.lookup(value);
    const dict =
      object instanceof PDFRawStream ? object.dict : object instanceof PDFDict ? object : null;
    if (!dict) return;
    const space = colourSpace(dict.get(N('ColorSpace')), this.context);
    if (!space) {
      this.skipped += 1;
      return;
    }
    const type =
      (this.lookup(dict.get(N('ShadingType'))) as PDFNumber | undefined)?.asNumber() ?? 0;
    const target = this.grayOnly ? N('DeviceGray') : N('DeviceRGB');
    const background = this.lookup(dict.get(N('Background')));
    if (background instanceof PDFArray) {
      const comps = background.asArray().map((n) => (n instanceof PDFNumber ? n.asNumber() : 0));
      dict.set(N('Background'), this.context.obj(this.components(space.toRgb(comps))));
    }
    const fn = dict.get(N('Function'));
    if (fn !== undefined) {
      const f = makeFunction(fn, this.context);
      if (!f) {
        this.skipped += 1;
        return;
      }
      const inputs = type === 1 ? 2 : 1;
      const domainValue = this.lookup(dict.get(N('Domain')));
      const domain =
        domainValue instanceof PDFArray
          ? domainValue.asArray().map((n) => (n instanceof PDFNumber ? n.asNumber() : 0))
          : inputs === 2
            ? [0, 1, 0, 1]
            : [0, 1];
      // Mesh shadings with a function carry a parametric t per vertex: keep the t, gray the function.
      const parametric = type >= 4 ? this.meshDomain(dict) : domain;
      dict.set(
        N('Function'),
        this.sampledFunction(inputs, parametric, (input) => space.toRgb(f(input))),
      );
      dict.set(N('ColorSpace'), target);
      return;
    }
    if (type >= 4) {
      // Mesh colours are packed per vertex: keep the data and give them a space that maps them to gray.
      dict.set(N('ColorSpace'), this.tintSpace(space));
      return;
    }
    this.skipped += 1;
  }

  meshDomain(dict: PDFDict): number[] {
    const decode = this.lookup(dict.get(N('Decode')));
    const values =
      decode instanceof PDFArray
        ? decode.asArray().map((n) => (n instanceof PDFNumber ? n.asNumber() : 0))
        : [];
    return values.slice(4, 6).length === 2 ? values.slice(4, 6) : [0, 1];
  }

  /** A DeviceN space with private colourant names whose alternate is gray (or RGB), sampled from the original. */
  tintSpace(space: ColourSpace): PDFObject {
    const n = space.components;
    const steps = n <= 2 ? 33 : n === 3 ? 17 : 9;
    const outputs = this.grayOnly ? 1 : 3;
    const samples: number[] = [];
    const total = steps ** n;
    for (let index = 0; index < total; index += 1) {
      const comps: number[] = [];
      let rest = index;
      for (let d = 0; d < n; d += 1) {
        comps.push((rest % steps) / (steps - 1));
        rest = Math.floor(rest / steps);
      }
      for (const v of this.components(space.toRgb(comps))) samples.push(Math.round(v * 255));
    }
    const fn = this.context.register(
      this.context.flateStream(Uint8Array.from(samples), {
        FunctionType: 0,
        Domain: Array.from({ length: n }, () => [0, 1]).flat(),
        Range: Array.from({ length: outputs }, () => [0, 1]).flat(),
        Size: new Array<number>(n).fill(steps),
        BitsPerSample: 8,
      }),
    );
    const names = Array.from({ length: n }, (_, i) => N(`NFTone${i + 1}`));
    return this.context.obj([
      N('DeviceN'),
      names,
      this.grayOnly ? N('DeviceGray') : N('DeviceRGB'),
      fn,
    ]);
  }

  /** A form, pattern or glyph stream: rewrite its content and everything its resources hold. */
  convertStream(value: unknown, parentResources: PDFDict | undefined): void {
    if (!(value instanceof PDFRef) || this.done.has(value.toString())) return;
    this.done.add(value.toString());
    const stream = this.context.lookup(value);
    if (!(stream instanceof PDFRawStream)) return;
    const own = this.lookup(stream.dict.get(N('Resources')));
    const resources = own instanceof PDFDict ? own : parentResources;
    this.convertGroup(stream.dict);
    this.convertResources(resources);
    let bytes: Uint8Array;
    try {
      bytes = decodePDFRawStream(stream).decode();
    } catch {
      this.skipped += 1;
      return;
    }
    this.replaceStream(value, stream, this.rewrite(bytes, resources));
    this.streams += 1;
  }

  /** Transparency groups blend in a colour space of their own. */
  convertGroup(dict: PDFDict): void {
    const group = this.lookup(dict.get(N('Group')));
    if (group instanceof PDFDict && group.has(N('CS'))) {
      group.set(N('CS'), this.grayOnly ? N('DeviceGray') : N('DeviceRGB'));
    }
  }

  convertResources(resources: PDFDict | undefined): void {
    if (!resources) return;
    const key = resources.toString();
    if (this.done.has(`res:${key}`)) return;
    this.done.add(`res:${key}`);
    const each = (name: string, visit: (value: PDFObject) => void): void => {
      const dict = this.lookup(resources.get(N(name)));
      if (dict instanceof PDFDict) for (const [, value] of dict.entries()) visit(value);
    };
    each('ColorSpace', (value) => {
      // [/Pattern base]: uncoloured patterns paint in the base space, which becomes gray.
      const space = this.lookup(value);
      if (
        space instanceof PDFArray &&
        this.lookup(space.get(0)) === N('Pattern') &&
        space.size() > 1
      ) {
        space.set(1, this.grayOnly ? N('DeviceGray') : N('DeviceRGB'));
      }
    });
    each('Pattern', (value) => {
      const pattern = this.lookup(value);
      const dict =
        pattern instanceof PDFRawStream
          ? pattern.dict
          : pattern instanceof PDFDict
            ? pattern
            : null;
      if (!dict) return;
      const type = (this.lookup(dict.get(N('PatternType'))) as PDFNumber | undefined)?.asNumber();
      if (type === 1) this.convertStream(value, resources);
      else if (type === 2) {
        this.convertShading(dict.get(N('Shading')));
        this.convertExtGState(this.lookup(dict.get(N('ExtGState'))));
      }
    });
    each('Shading', (value) => this.convertShading(value));
    each('ExtGState', (value) => this.convertExtGState(this.lookup(value)));
    each('XObject', (value) => {
      const object = this.lookup(value);
      if (!(object instanceof PDFRawStream) || !(value instanceof PDFRef)) return;
      const subtype = this.lookup(object.dict.get(N('Subtype')));
      if (subtype === N('Form')) this.convertStream(value, resources);
      else if (subtype === N('Image')) this.noteImage(value);
    });
    each('Font', (value) => {
      const font = this.lookup(value);
      if (!(font instanceof PDFDict) || this.lookup(font.get(N('Subtype'))) !== N('Type3')) return;
      const own = this.lookup(font.get(N('Resources')));
      const procs = this.lookup(font.get(N('CharProcs')));
      if (procs instanceof PDFDict) {
        for (const [, proc] of procs.entries()) {
          this.convertStream(proc, own instanceof PDFDict ? own : resources);
        }
      }
    });
  }

  convertExtGState(state: unknown): void {
    if (!(state instanceof PDFDict)) return;
    const mask = this.lookup(state.get(N('SMask')));
    if (mask instanceof PDFDict) {
      const group = mask.get(N('G'));
      const groupStream = this.lookup(group);
      if (groupStream instanceof PDFRawStream) {
        const own = this.lookup(groupStream.dict.get(N('Resources')));
        this.convertStream(group, own instanceof PDFDict ? own : undefined);
      }
      // A luminosity mask's backdrop is a colour in the group's space; after conversion that space is gray.
      const backdrop = this.lookup(mask.get(N('BC')));
      if (backdrop instanceof PDFArray && backdrop.size() > 1) {
        const comps = backdrop.asArray().map((n) => (n instanceof PDFNumber ? n.asNumber() : 0));
        const rgb: Rgb =
          comps.length === 4
            ? (DEVICE_SPACES.DeviceCMYK?.toRgb(comps) ?? [0, 0, 0])
            : [comps[0] ?? 0, comps[1] ?? 0, comps[2] ?? 0];
        mask.set(N('BC'), this.context.obj(this.components(rgb)));
      }
    }
  }

  colourArray(dict: PDFDict, key: string): void {
    const array = this.lookup(dict.get(N(key)));
    if (!(array instanceof PDFArray) || array.size() < 3) return;
    const comps = array.asArray().map((n) => (n instanceof PDFNumber ? n.asNumber() : 0));
    const rgb: Rgb =
      comps.length === 4
        ? (DEVICE_SPACES.DeviceCMYK?.toRgb(comps) ?? [0, 0, 0])
        : [comps[0] ?? 0, comps[1] ?? 0, comps[2] ?? 0];
    dict.set(N(key), this.context.obj(this.components(rgb)));
  }

  /** Default appearance strings ("/Helv 12 Tf 1 0 0 rg") used to draw form field text. */
  convertDa(dict: PDFDict): void {
    const da = this.lookup(dict.get(N('DA')));
    if (!(da instanceof PDFString || da instanceof PDFHexString)) return;
    const bytes = this.rewrite(new TextEncoder().encode(da.decodeText()), undefined);
    dict.set(N('DA'), PDFString.of(new TextDecoder().decode(bytes)));
  }

  convertAnnotations(annots: unknown, resources: PDFDict | undefined): void {
    const list = this.lookup(annots);
    if (!(list instanceof PDFArray)) return;
    for (const item of list.asArray()) {
      const annot = this.lookup(item);
      if (!(annot instanceof PDFDict)) continue;
      this.colourArray(annot, 'C');
      this.colourArray(annot, 'IC');
      this.convertDa(annot);
      const mk = this.lookup(annot.get(N('MK')));
      if (mk instanceof PDFDict) {
        this.colourArray(mk, 'BC');
        this.colourArray(mk, 'BG');
      }
      const ap = this.lookup(annot.get(N('AP')));
      if (!(ap instanceof PDFDict)) continue;
      for (const [, appearance] of ap.entries()) {
        const resolved = this.lookup(appearance);
        if (resolved instanceof PDFDict && !(resolved instanceof PDFStream)) {
          for (const [, state] of resolved.entries()) this.convertStream(state, resources);
        } else this.convertStream(appearance, resources);
      }
    }
  }

  convertPage(index: number): void {
    const page = this.doc.getPage(index);
    const resources = page.node.Resources();
    this.convertGroup(page.node);
    this.convertResources(resources);
    const bytes = contentBytes(page.node.Contents(), this.doc);
    const rewritten = this.rewrite(bytes, resources);
    page.node.set(N('Contents'), this.context.register(this.context.flateStream(rewritten)));
    this.streams += 1;
    this.convertAnnotations(page.node.get(N('Annots')), resources);
  }

  convertForm(): void {
    const acroForm = this.lookup(this.doc.catalog.get(N('AcroForm')));
    if (!(acroForm instanceof PDFDict)) return;
    this.convertDa(acroForm);
    const fields = this.lookup(acroForm.get(N('Fields')));
    const visit = (value: unknown, depth: number): void => {
      const field = this.lookup(value);
      if (!(field instanceof PDFDict) || depth > 16) return;
      this.convertDa(field);
      const kids = this.lookup(field.get(N('Kids')));
      if (kids instanceof PDFArray) kids.asArray().forEach((kid) => visit(kid, depth + 1));
    };
    if (fields instanceof PDFArray) fields.asArray().forEach((field) => visit(field, 0));
    const dr = this.lookup(acroForm.get(N('DR')));
    if (dr instanceof PDFDict) this.convertResources(dr);
  }
}

/** Convert every page, form, pattern, gradient, annotation and palette; returns the images left to convert. */
export function grayscaleDocument(
  doc: PDFDocument,
  settings: ToneSettings,
  signal?: AbortSignal,
): GrayscaleResult {
  const converter = new Converter(doc, settings);
  for (let index = 0; index < doc.getPageCount(); index += 1) {
    signal?.throwIfAborted();
    converter.convertPage(index);
  }
  converter.convertForm();
  // Then everything else the file holds, reachable or not, so no colour is left anywhere.
  const masks = new Set<string>();
  for (const [, object] of doc.context.enumerateIndirectObjects()) {
    const dict =
      object instanceof PDFRawStream ? object.dict : object instanceof PDFDict ? object : null;
    if (!dict) continue;
    const subtype = doc.context.lookup(dict.get(N('Subtype')) as PDFObject);
    if (subtype === N('Image')) {
      for (const key of ['SMask', 'Mask']) {
        const mask = dict.get(N(key));
        if (mask instanceof PDFRef) masks.add(mask.toString());
      }
    }
  }
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    signal?.throwIfAborted();
    const dict =
      object instanceof PDFRawStream ? object.dict : object instanceof PDFDict ? object : null;
    if (!dict || masks.has(ref.toString())) continue;
    const subtype = doc.context.lookup(dict.get(N('Subtype')) as PDFObject);
    if (subtype === N('Image')) converter.noteImage(ref);
    else if (dict.has(N('ShadingType'))) converter.convertShading(ref);
    else if (subtype === N('Form') || dict.has(N('PatternType'))) {
      if (dict.has(N('PatternType')) && !(object instanceof PDFRawStream)) {
        converter.convertShading(dict.get(N('Shading')));
      } else converter.convertStream(ref, undefined);
    }
  }
  return {
    images: [...converter.images.values()].filter((work) => !masks.has(work.ref.toString())),
    streams: converter.streams,
    skipped: converter.skipped,
  };
}

/**
 * Put converted pixels in place of an image, keeping its soft mask. `alpha`
 * (when the decoder applied a colour-key mask) becomes a new soft mask.
 */
export function replaceImage(
  doc: PDFDocument,
  ref: PDFRef,
  image: {
    data: Uint8Array;
    filter: 'DCTDecode' | 'FlateDecode';
    space: 'DeviceGray' | 'DeviceRGB';
    bits: 1 | 8;
    width: number;
    height: number;
    alpha?: Uint8Array;
  },
): void {
  const old = doc.context.lookup(ref);
  if (!(old instanceof PDFRawStream)) return;
  const keep: Record<string, PDFObject> = {};
  for (const key of ['Interpolate', 'Intent', 'OC', 'Metadata', 'StructParent', 'Name']) {
    const value = old.dict.get(N(key));
    if (value !== undefined) keep[key] = value;
  }
  let smask = old.dict.get(N('SMask'));
  const smaskStream = smask instanceof PDFRef ? doc.context.lookup(smask) : undefined;
  // Pixels come back un-premultiplied, so a matte colour no longer applies.
  if (smaskStream instanceof PDFRawStream) smaskStream.dict.delete(N('Matte'));
  const mask = old.dict.get(N('Mask'));
  if (image.alpha && smask === undefined) {
    smask = doc.context.register(
      doc.context.flateStream(image.alpha, {
        Type: 'XObject',
        Subtype: 'Image',
        Width: image.width,
        Height: image.height,
        ColorSpace: 'DeviceGray',
        BitsPerComponent: 8,
      }),
    );
  }
  const dict = {
    ...keep,
    Type: 'XObject',
    Subtype: 'Image',
    Width: image.width,
    Height: image.height,
    ColorSpace: image.space,
    BitsPerComponent: image.bits,
    ...(smask !== undefined ? { SMask: smask } : {}),
    // A stencil mask (stream) still applies; a colour-key array was folded into the soft mask.
    ...(mask instanceof PDFRef ? { Mask: mask } : {}),
  };
  const stream =
    image.filter === 'FlateDecode'
      ? doc.context.flateStream(image.data, dict as never)
      : doc.context.stream(image.data, { ...dict, Filter: 'DCTDecode' } as never);
  doc.context.assign(ref, stream);
}

const GRAY_NAMES = new Set(['DeviceGray', 'CalGray', 'G', 'Pattern']);

/** True for spaces that can only produce gray: gray, gray palettes, and DeviceN or ICC with a gray result. */
function isGraySpace(value: unknown, context: PDFContext, resources?: PDFDict): boolean {
  const space = value instanceof PDFRef ? context.lookup(value) : value;
  if (space === undefined) return true;
  if (space instanceof PDFName) {
    const name = space.decodeText();
    if (GRAY_NAMES.has(name)) return true;
    const spaces = resources?.lookup(N('ColorSpace'));
    const entry = spaces instanceof PDFDict ? spaces.get(N(name)) : undefined;
    return entry !== undefined && isGraySpace(entry, context);
  }
  if (!(space instanceof PDFArray)) return false;
  const family = context.lookup(space.get(0) as PDFObject);
  const kind = family instanceof PDFName ? family.decodeText() : '';
  if (kind === 'Indexed' || kind === 'I' || kind === 'DeviceN' || kind === 'Separation') {
    return isGraySpace(space.get(kind === 'Indexed' || kind === 'I' ? 1 : 2), context);
  }
  if (kind === 'Pattern') return space.size() < 2 || isGraySpace(space.get(1), context);
  return colourSpace(space, context)?.components === 1;
}

/**
 * How many colour instructions, images and gradients are still in colour: an
 * independent check of a converted file, reading every object it holds.
 */
export function colourLeft(doc: PDFDocument): number {
  const { context } = doc;
  let count = 0;
  const scan = (bytes: Uint8Array, resources: PDFDict | undefined): void => {
    const lexer = new Lexer(bytes);
    let operands: (Value | string)[] = [];
    for (let token = lexer.next(); token !== undefined; token = lexer.next()) {
      if (typeof token !== 'string') {
        operands.push(token);
        continue;
      }
      if (['rg', 'RG', 'k', 'K'].includes(token)) count += 1;
      else if (token === 'cs' || token === 'CS') {
        const name = operands[0];
        if (typeof name === 'object' && name !== null && 'name' in name) {
          if (!isGraySpace(N(name.name), context, resources)) count += 1;
        }
      } else if (token === 'BI') {
        const dict = new Map<string, Value>();
        for (let key = lexer.next(); key !== undefined && key !== 'ID'; key = lexer.next()) {
          const value = lexer.next();
          if (typeof key === 'object' && key !== null && 'name' in key && typeof value !== 'string')
            dict.set(key.name, value ?? null);
        }
        lexer.inlineData(dict);
        const cs = dict.get('CS') ?? dict.get('ColorSpace');
        const mask = dict.get('IM') ?? dict.get('ImageMask');
        if (mask !== true && typeof cs === 'object' && cs !== null && 'name' in cs) {
          if (!['G', 'DeviceGray', 'CalGray'].includes(cs.name)) count += 1;
        }
      }
      operands = [];
    }
  };
  for (const page of doc.getPages()) {
    scan(contentBytes(page.node.Contents(), doc), page.node.Resources());
  }
  for (const [, object] of context.enumerateIndirectObjects()) {
    const dict =
      object instanceof PDFRawStream ? object.dict : object instanceof PDFDict ? object : null;
    if (!dict) continue;
    const subtype = context.lookup(dict.get(N('Subtype')) as PDFObject);
    if (subtype === N('Image')) {
      const mask = context.lookup(dict.get(N('ImageMask')) as PDFObject);
      if (
        !(mask instanceof PDFBool && mask.asBoolean()) &&
        !isGraySpace(dict.get(N('ColorSpace')), context)
      ) {
        count += 1;
      }
    } else if (dict.has(N('ShadingType'))) {
      if (!isGraySpace(dict.get(N('ColorSpace')), context)) count += 1;
    } else if (
      object instanceof PDFRawStream &&
      (subtype === N('Form') || dict.has(N('PatternType')))
    ) {
      const own = context.lookup(dict.get(N('Resources')) as PDFObject);
      try {
        scan(decodePDFRawStream(object).decode(), own instanceof PDFDict ? own : undefined);
      } catch {
        // An unreadable stream draws nothing.
      }
    }
  }
  return count;
}
