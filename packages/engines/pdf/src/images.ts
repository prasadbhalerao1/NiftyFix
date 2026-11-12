import {
  decodePDFRawStream,
  PDFArray,
  PDFBool,
  PDFDict,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFString,
  type PDFDocument,
} from '@cantoo/pdf-lib';

/**
 * Pull raster images out of a PDF without rendering pages. JPEGs come out as
 * their original bytes (no quality loss); lossless images come out as raw RGBA
 * for the caller to encode (canvas lives outside this engine). Anything we
 * cannot decode faithfully is counted, never guessed at.
 */
export type ExtractedImage =
  | { kind: 'jpeg'; page: number; bytes: Uint8Array; width: number; height: number }
  | { kind: 'rgba'; page: number; rgba: Uint8ClampedArray; width: number; height: number };

export interface ExtractReport {
  images: ExtractedImage[];
  /** Images in a format we do not convert (CMYK, JPEG 2000, JBIG2, fax, unusual bit depths). */
  unsupported: number;
  /** Images smaller than `minSide` on either side (icons, rules, spacers). */
  tiny: number;
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

/** Image XObjects used on the given pages (including inside form XObjects), first use only. */
function imagesByPage(
  doc: PDFDocument,
  pages: readonly number[],
): { page: number; ref: PDFRef; stream: PDFRawStream }[] {
  const seen = new Set<string>();
  const found: { page: number; ref: PDFRef; stream: PDFRawStream }[] = [];
  const walk = (resources: unknown, page: number, depth: number): void => {
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
      if (subtype === 'Image') found.push({ page, ref, stream: object });
      else if (subtype === 'Form')
        walk(object.dict.lookup(PDFName.of('Resources')), page, depth + 1);
    }
  };
  const all = doc.getPages();
  for (const index of pages) walk(all[index]?.node.Resources(), index, 0);
  return found;
}

export function extractImages(
  doc: PDFDocument,
  options: { minSide: number; pages: readonly number[] },
  signal?: AbortSignal,
): ExtractReport {
  const report: ExtractReport = { images: [], unsupported: 0, tiny: 0 };
  for (const { page, stream } of imagesByPage(doc, options.pages)) {
    signal?.throwIfAborted();
    const dict = stream.dict;
    const width = num(dict.lookup(PDFName.of('Width')));
    const height = num(dict.lookup(PDFName.of('Height')));
    const mask = dict.lookup(PDFName.of('ImageMask'));
    if (width === null || height === null || (mask instanceof PDFBool && mask.asBoolean())) {
      report.unsupported += 1;
      continue;
    }
    if (width < options.minSide || height < options.minSide) {
      report.tiny += 1;
      continue;
    }
    const filter = filterOf(dict);
    const colour = colourOf(dict.lookup(PDFName.of('ColorSpace')));
    const bits = num(dict.lookup(PDFName.of('BitsPerComponent')));
    const decodeArray = dict.lookup(PDFName.of('Decode')) !== undefined;
    try {
      const alpha = alphaOf(dict, width, height);
      if (alpha === null || decodeArray || colour === null || bits !== 8) {
        report.unsupported += 1;
        continue;
      }
      if (filter === 'DCTDecode' && 'channels' in colour && alpha === undefined) {
        report.images.push({ kind: 'jpeg', page, bytes: stream.contents, width, height });
      } else if (
        (filter === 'FlateDecode' || filter === null) &&
        dict.lookup(PDFName.of('DecodeParms')) === undefined
      ) {
        const rgba = flateToRgba(stream, colour, width, height, alpha);
        if (rgba) report.images.push({ kind: 'rgba', page, rgba, width, height });
        else report.unsupported += 1;
      } else {
        report.unsupported += 1;
      }
    } catch {
      // One image that will not decode is reported, never fatal.
      report.unsupported += 1;
    }
  }
  return report;
}
