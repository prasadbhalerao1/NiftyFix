import {
  decodePDFRawStream,
  drawObject,
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFObjectCopier,
  PDFRawStream,
  PDFRef,
  PDFString,
  popGraphicsState,
  pushGraphicsState,
} from '@cantoo/pdf-lib';
import { imagePlacements, type Matrix } from './content';

/**
 * Pull raster images out of a PDF without rendering pages. JPEGs come out as
 * their original bytes (no quality loss); simple lossless images come out as
 * raw RGBA. Everything else (CMYK, JPEG 2000, JBIG2, fax, masks, unusual bit
 * depths) is marked `decode`: `isolateImages` packs those into a small PDF
 * for pdf.js, which has full decoders, to turn into pixels.
 */
interface Common {
  /** 0-based page where the image is first drawn. */
  page: number;
  width: number;
  height: number;
  /** The image object, and its stable identity. */
  ref: PDFRef;
  key: string;
  /** Every place it is drawn on the chosen pages; empty if the page could not be read. */
  placements: { page: number; matrix: Matrix }[];
}

export type ExtractedImage = Common &
  (
    | { kind: 'jpeg'; bytes: Uint8Array }
    | { kind: 'rgba'; rgba: Uint8ClampedArray }
    | { kind: 'decode' }
  );

export interface ExtractReport {
  images: ExtractedImage[];
  /** Images smaller than `minSide` on either side (icons, rules, spacers). */
  tiny: number;
  /** Image objects without a usable size (damaged). */
  broken: number;
}

const name = (value: unknown): string | null =>
  value instanceof PDFName ? value.decodeText() : null;

const num = (value: unknown): number | null =>
  value instanceof PDFNumber ? value.asNumber() : null;

function filterOf(dict: PDFDict): string | null | 'chain' {
  const filter = dict.lookup(PDFName.of('Filter'));
  if (filter === undefined) return null;
  if (filter instanceof PDFName) return filter.decodeText();
  if (filter instanceof PDFArray && filter.size() === 1) return name(filter.lookup(0)) ?? 'chain';
  return 'chain';
}

type Colour = { channels: 1 | 3 } | { palette: Uint8Array; hival: number };

/** Gray, RGB or an RGB/gray palette; null for CMYK, Lab, separations and the like. */
function colourOf(space: unknown): Colour | null {
  const plain = name(space);
  if (plain === 'DeviceRGB' || plain === 'CalRGB') return { channels: 3 };
  if (plain === 'DeviceGray' || plain === 'CalGray') return { channels: 1 };
  if (!(space instanceof PDFArray)) return null;
  const family = name(space.lookup(0));
  if (family === 'ICCBased') {
    const profile = space.lookup(1);
    const n = profile instanceof PDFRawStream ? num(profile.dict.lookup(PDFName.of('N'))) : null;
    return n === 1 ? { channels: 1 } : n === 3 ? { channels: 3 } : null;
  }
  if (family === 'CalRGB') return { channels: 3 };
  if (family === 'CalGray') return { channels: 1 };
  if (family === 'Indexed') {
    const base = colourOf(space.lookup(1));
    const hival = num(space.lookup(2));
    const lookup = space.lookup(3);
    if (!base || !('channels' in base) || hival === null) return null;
    let table: Uint8Array | null = null;
    if (lookup instanceof PDFRawStream) table = decodePDFRawStream(lookup).decode();
    else if (lookup instanceof PDFHexString || lookup instanceof PDFString)
      table = lookup.asBytes();
    if (!table) return null;
    // Expand a gray palette to RGB so every palette entry is 3 bytes.
    const rgb = new Uint8Array((hival + 1) * 3);
    for (let i = 0; i <= hival; i += 1) {
      for (let c = 0; c < 3; c += 1) {
        rgb[i * 3 + c] = base.channels === 3 ? (table[i * 3 + c] ?? 0) : (table[i] ?? 0);
      }
    }
    return { palette: rgb, hival };
  }
  return null;
}

/** An 8-bit gray soft mask of the same size, as alpha; undefined if absent or unusable. */
function alphaOf(dict: PDFDict, width: number, height: number): Uint8Array | null | undefined {
  const mask = dict.lookup(PDFName.of('SMask'));
  if (mask === undefined) return undefined;
  if (
    !(mask instanceof PDFRawStream) ||
    num(mask.dict.lookup(PDFName.of('Width'))) !== width ||
    num(mask.dict.lookup(PDFName.of('Height'))) !== height ||
    num(mask.dict.lookup(PDFName.of('BitsPerComponent'))) !== 8 ||
    filterOf(mask.dict) !== 'FlateDecode' ||
    mask.dict.lookup(PDFName.of('DecodeParms')) !== undefined
  ) {
    return null;
  }
  const alpha = decodePDFRawStream(mask).decode();
  return alpha.length === width * height ? alpha : null;
}

/** Decode an 8-bit Flate image (plain or palette) to RGBA; null if it does not add up. */
function flateToRgba(
  stream: PDFRawStream,
  colour: Colour,
  width: number,
  height: number,
  alpha: Uint8Array | undefined,
): Uint8ClampedArray | null {
  const raw = decodePDFRawStream(stream).decode();
  const pixels = width * height;
  const rgba = new Uint8ClampedArray(pixels * 4);
  if ('palette' in colour) {
    if (raw.length !== pixels) return null;
    for (let i = 0; i < pixels; i += 1) {
      const entry = Math.min(raw[i] ?? 0, colour.hival) * 3;
      rgba[i * 4] = colour.palette[entry] ?? 0;
      rgba[i * 4 + 1] = colour.palette[entry + 1] ?? 0;
      rgba[i * 4 + 2] = colour.palette[entry + 2] ?? 0;
      rgba[i * 4 + 3] = alpha ? (alpha[i] ?? 255) : 255;
    }
    return rgba;
  }
  if (raw.length !== pixels * colour.channels) return null;
  for (let i = 0; i < pixels; i += 1) {
    const r = colour.channels === 3 ? (raw[i * 3] ?? 0) : (raw[i] ?? 0);
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = colour.channels === 3 ? (raw[i * 3 + 1] ?? 0) : r;
    rgba[i * 4 + 2] = colour.channels === 3 ? (raw[i * 3 + 2] ?? 0) : r;
    rgba[i * 4 + 3] = alpha ? (alpha[i] ?? 255) : 255;
  }
  return rgba;
}

interface Found {
  page: number;
  ref: PDFRef;
  stream: PDFRawStream;
  placements: Common['placements'];
}

/** Image XObjects in a page's resources (including inside form XObjects). */
function listedImages(doc: PDFDocument, page: number): { ref: PDFRef; stream: PDFRawStream }[] {
  const seen = new Set<string>();
  const found: { ref: PDFRef; stream: PDFRawStream }[] = [];
  const walk = (resources: unknown, depth: number): void => {
    if (!(resources instanceof PDFDict) || depth > 8) return;
    const xobjects = resources.lookup(PDFName.of('XObject'));
    if (!(xobjects instanceof PDFDict)) return;
    for (const key of xobjects.keys()) {
      const ref = xobjects.get(key);
      if (!(ref instanceof PDFRef) || seen.has(ref.toString())) continue;
      seen.add(ref.toString());
      const object = doc.context.lookup(ref);
      if (!(object instanceof PDFRawStream)) continue;
      const subtype = name(object.dict.lookup(PDFName.of('Subtype')));
      if (subtype === 'Image') found.push({ ref, stream: object });
      else if (subtype === 'Form') walk(object.dict.lookup(PDFName.of('Resources')), depth + 1);
    }
  };
  walk(doc.getPage(page).node.Resources(), 0);
  return found;
}

/** Images drawn on the given pages, in drawing order, each once with all its placements. */
function imagesOnPages(doc: PDFDocument, pages: readonly number[]): Found[] {
  const found = new Map<string, Found>();
  for (const page of pages) {
    let drawn: { ref: PDFRef; stream: PDFRawStream; matrix: Matrix | null }[];
    try {
      drawn = imagePlacements(doc, page);
    } catch {
      // Unreadable drawing instructions: fall back to the images the page lists.
      drawn = listedImages(doc, page).map((image) => ({ ...image, matrix: null }));
    }
    for (const { ref, stream, matrix } of drawn) {
      const key = ref.toString();
      const entry = found.get(key) ?? { page, ref, stream, placements: [] };
      if (matrix) entry.placements.push({ page, matrix });
      found.set(key, entry);
    }
  }
  return [...found.values()];
}

export function extractImages(
  doc: PDFDocument,
  options: { minSide: number; pages: readonly number[] },
  signal?: AbortSignal,
): ExtractReport {
  const report: ExtractReport = { images: [], tiny: 0, broken: 0 };
  for (const { page, ref, stream, placements } of imagesOnPages(doc, options.pages)) {
    signal?.throwIfAborted();
    const dict = stream.dict;
    const width = num(dict.lookup(PDFName.of('Width')));
    const height = num(dict.lookup(PDFName.of('Height')));
    if (width === null || height === null || width < 1 || height < 1) {
      report.broken += 1;
      continue;
    }
    if (width < options.minSide || height < options.minSide) {
      report.tiny += 1;
      continue;
    }
    const common = { page, width, height, ref, key: ref.toString(), placements };
    const decode = (): void => {
      report.images.push({ ...common, kind: 'decode' });
    };
    const mask = dict.lookup(PDFName.of('ImageMask'));
    const filter = filterOf(dict);
    const colour = colourOf(dict.lookup(PDFName.of('ColorSpace')));
    const bits = num(dict.lookup(PDFName.of('BitsPerComponent')));
    const decodeArray = dict.lookup(PDFName.of('Decode')) !== undefined;
    try {
      const alpha = alphaOf(dict, width, height);
      if (
        (mask instanceof PDFBool && mask.asBoolean()) ||
        alpha === null ||
        decodeArray ||
        colour === null ||
        bits !== 8
      ) {
        decode();
      } else if (filter === 'DCTDecode' && 'channels' in colour && alpha === undefined) {
        report.images.push({ ...common, kind: 'jpeg', bytes: stream.contents });
      } else if (
        (filter === 'FlateDecode' || filter === null) &&
        dict.lookup(PDFName.of('DecodeParms')) === undefined
      ) {
        const rgba = flateToRgba(stream, colour, width, height, alpha);
        if (rgba) report.images.push({ ...common, kind: 'rgba', rgba });
        else decode();
      } else {
        decode();
      }
    } catch {
      // The quick decoder gave up; the full decoder may still manage.
      decode();
    }
  }
  return report;
}

/**
 * A PDF with one page per image, drawing only that image, for pdf.js to
 * decode (page i holds refs[i]). Stencil masks become 1-bit gray images, so
 * they come out as black ink on white instead of an invisible shape.
 */
export async function isolateImages(
  doc: PDFDocument,
  refs: readonly PDFRef[],
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const copier = PDFObjectCopier.for(doc.context, out.context);
  for (const ref of refs) {
    const source = doc.context.lookup(ref);
    if (!(source instanceof PDFRawStream)) throw new Error('Not an image stream');
    const copy = copier.copy(source);
    const mask = copy.dict.lookup(PDFName.of('ImageMask'));
    if (mask instanceof PDFBool && mask.asBoolean()) {
      copy.dict.delete(PDFName.of('ImageMask'));
      copy.dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceGray'));
      copy.dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(1));
    }
    const page = out.addPage([1, 1]);
    const image = page.node.newXObject('Im', out.context.register(copy));
    page.pushOperators(pushGraphicsState(), drawObject(image), popGraphicsState());
  }
  return out.save({ useObjectStreams: false });
}
