import {
  decodePDFRawStream,
  PDFArray,
  PDFBool,
  type PDFDict,
  PDFName,
  PDFNumber,
  PDFRawStream,
  type PDFDocument,
  type PDFRef,
} from '@cantoo/pdf-lib';
import { isToolError } from '@niftyfix/tool-sdk';

/**
 * Re-encoding hooks supplied by the caller (canvas lives outside this engine).
 * Return null to keep the original image.
 */
export interface ImageTranscoder {
  /** Re-encode a JPEG (DCTDecode) image as JPEG, at most `maxSide` px on its longest side. */
  jpeg(bytes: Uint8Array, maxSide: number, quality: number): Promise<TranscodedImage | null>;
  /**
   * Encode raw 8-bit pixels (RGB or gray, row-major, no padding) as JPEG,
   * at most `maxSide` px on its longest side.
   */
  pixels(
    raw: Uint8Array,
    width: number,
    height: number,
    channels: 1 | 3,
    maxSide: number,
    quality: number,
  ): Promise<TranscodedImage | null>;
}

export interface TranscodedImage {
  bytes: Uint8Array;
  width: number;
  height: number;
  /** Output colour channels (JPEG from a gray source stays gray). */
  channels: 1 | 3;
}

export interface CompressSettings {
  quality: number;
  maxSide: number;
  /** Also turn large lossless (Flate) photos into JPEG. Off for screenshots-and-text safety. */
  convertLossless: boolean;
  /** Ignore images smaller than this many encoded bytes (not worth the quality cost). */
  minBytes: number;
}

export interface CompressReport {
  images: number;
  recompressed: number;
  skipped: number;
  savedBytes: number;
}

const name = (value: unknown): string | null =>
  value instanceof PDFName ? value.decodeText() : null;

/** The single filter of a stream, or null for none / a filter chain we do not handle. */
function singleFilter(dict: PDFDict): string | null | 'unsupported' {
  const filter = dict.lookup(PDFName.of('Filter'));
  if (filter === undefined) return null;
  if (filter instanceof PDFName) return filter.decodeText();
  if (filter instanceof PDFArray && filter.size() === 1)
    return name(filter.lookup(0)) ?? 'unsupported';
  return 'unsupported';
}

/** Colour channels for plain RGB/gray colour spaces; null for anything else (CMYK, indexed, Lab…). */
function plainChannels(dict: PDFDict): 1 | 3 | null {
  const space = dict.lookup(PDFName.of('ColorSpace'));
  const plain = name(space);
  if (plain === 'DeviceRGB') return 3;
  if (plain === 'DeviceGray') return 1;
  // ICCBased with N = 1 or 3 is a plain gray/RGB image with a profile.
  if (space instanceof PDFArray && name(space.lookup(0)) === 'ICCBased') {
    const profile = space.lookup(1);
    const n = profile instanceof PDFRawStream ? profile.dict.lookup(PDFName.of('N')) : undefined;
    if (n instanceof PDFNumber) return n.asNumber() === 1 ? 1 : n.asNumber() === 3 ? 3 : null;
  }
  return null;
}

/**
 * Recompress the document's raster images in place. Text and vector content
 * are untouched. An image is replaced only when the new version is smaller;
 * anything unusual (CMYK, masks, decode arrays, predictors, filter chains) is
 * left exactly as it was.
 */
export async function recompressImages(
  doc: PDFDocument,
  settings: CompressSettings,
  transcoder: ImageTranscoder,
  signal?: AbortSignal,
  onProgress?: (done: number, total: number) => void,
): Promise<CompressReport> {
  const images: [PDFRef, PDFRawStream][] = [];
  for (const [ref, object] of doc.context.enumerateIndirectObjects()) {
    if (
      object instanceof PDFRawStream &&
      name(object.dict.lookup(PDFName.of('Subtype'))) === 'Image'
    ) {
      images.push([ref, object]);
    }
  }
  const report: CompressReport = {
    images: images.length,
    recompressed: 0,
    skipped: 0,
    savedBytes: 0,
  };

  for (const [index, [ref, stream]] of images.entries()) {
    signal?.throwIfAborted();
    onProgress?.(index, images.length);
    const dict = stream.dict;
    const original = stream.contents.length;
    const skip = (): void => {
      report.skipped += 1;
    };
    if (original < settings.minBytes) {
      skip();
      continue;
    }
    const mask = dict.lookup(PDFName.of('ImageMask'));
    if (mask instanceof PDFBool && mask.asBoolean()) {
      skip();
      continue;
    }
    if (dict.lookup(PDFName.of('Decode')) !== undefined) {
      skip();
      continue;
    }
    const channels = plainChannels(dict);
    const bits = dict.lookup(PDFName.of('BitsPerComponent'));
    const width = dict.lookup(PDFName.of('Width'));
    const height = dict.lookup(PDFName.of('Height'));
    if (
      channels === null ||
      !(bits instanceof PDFNumber) ||
      bits.asNumber() !== 8 ||
      !(width instanceof PDFNumber) ||
      !(height instanceof PDFNumber)
    ) {
      skip();
      continue;
    }
    const filter = singleFilter(dict);
    let result: TranscodedImage | null = null;
    try {
      if (filter === 'DCTDecode') {
        result = await transcoder.jpeg(stream.contents, settings.maxSide, settings.quality);
      } else if (
        filter === 'FlateDecode' &&
        settings.convertLossless &&
        dict.lookup(PDFName.of('DecodeParms')) === undefined &&
        dict.lookup(PDFName.of('SMask')) === undefined
      ) {
        const raw = decodePDFRawStream(stream).decode();
        if (raw.length === width.asNumber() * height.asNumber() * channels) {
          result = await transcoder.pixels(
            raw,
            width.asNumber(),
            height.asNumber(),
            channels,
            settings.maxSide,
            settings.quality,
          );
        }
      }
    } catch (error) {
      // Environment and limit errors (e.g. WORKER_UNSUPPORTED, which makes the runtime
      // rerun the job on the main thread) must propagate. Anything else means this one
      // image could not be decoded: keep it as it was, never fatal.
      if (isToolError(error)) throw error;
      result = null;
    }
    if (!result || result.bytes.length >= original) {
      skip();
      continue;
    }
    // Keep every other entry (SMask, Interpolate, Intent, …); replace the encoding.
    const next = doc.context.stream(result.bytes, {});
    for (const [key, value] of dict.entries()) next.dict.set(key, value);
    next.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
    next.dict.delete(PDFName.of('DecodeParms'));
    next.dict.set(PDFName.of('Width'), PDFNumber.of(result.width));
    next.dict.set(PDFName.of('Height'), PDFNumber.of(result.height));
    next.dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8));
    next.dict.set(
      PDFName.of('ColorSpace'),
      PDFName.of(result.channels === 1 ? 'DeviceGray' : 'DeviceRGB'),
    );
    next.dict.set(PDFName.of('Length'), PDFNumber.of(result.bytes.length));
    doc.context.assign(ref, next);
    report.recompressed += 1;
    report.savedBytes += original - result.bytes.length;
  }
  onProgress?.(images.length, images.length);
  return report;
}
