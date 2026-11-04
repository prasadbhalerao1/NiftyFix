import { sniffFormat, type FileFormatId } from '@niftyfix/tool-sdk';

export interface ImageHeader {
  format: FileFormatId;
  width: number;
  height: number;
}

const u16be = (b: Uint8Array, i: number): number => ((b[i] ?? 0) << 8) | (b[i + 1] ?? 0);
const u16le = (b: Uint8Array, i: number): number => (b[i] ?? 0) | ((b[i + 1] ?? 0) << 8);
const u24le = (b: Uint8Array, i: number): number => u16le(b, i) | ((b[i + 2] ?? 0) << 16);
const u32be = (b: Uint8Array, i: number): number => ((u16be(b, i) << 16) >>> 0) + u16be(b, i + 2);
const i32le = (b: Uint8Array, i: number): number => u16le(b, i) | (u16le(b, i + 2) << 16) | 0;

/** JPEG start-of-frame markers that carry dimensions (excludes DHT C4, JPG C8, DAC CC). */
const SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function jpegSize(b: Uint8Array): { width: number; height: number } | null {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1] ?? 0;
    if (marker === 0xff) {
      i += 1; // fill byte
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) return null; // EOI / start of scan before SOF
    const length = u16be(b, i + 2);
    if (length < 2) return null;
    if (SOF_MARKERS.has(marker)) {
      return { height: u16be(b, i + 5), width: u16be(b, i + 7) };
    }
    i += 2 + length;
  }
  return null;
}

function webpSize(b: Uint8Array): { width: number; height: number } | null {
  const chunk = String.fromCharCode(...b.subarray(12, 16));
  if (chunk === 'VP8X' && b.length >= 30) {
    return { width: u24le(b, 24) + 1, height: u24le(b, 27) + 1 };
  }
  if (chunk === 'VP8L' && b.length >= 25 && b[20] === 0x2f) {
    const bits = (b[21] ?? 0) | ((b[22] ?? 0) << 8) | ((b[23] ?? 0) << 16) | ((b[24] ?? 0) << 24);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8 ' && b.length >= 30 && b[23] === 0x9d && b[24] === 0x01 && b[25] === 0x2a) {
    return { width: u16le(b, 26) & 0x3fff, height: u16le(b, 28) & 0x3fff };
  }
  return null;
}

/**
 * AVIF (ISOBMFF/HEIF): dimensions live in 'ispe' (image spatial extent)
 * properties inside the 'meta' box near the start of the file. A file can
 * have several (grid tiles, thumbnails); the largest is the full image, and
 * taking it keeps the pixel-limit check conservative.
 */
function avifSize(bytes: Uint8Array): { width: number; height: number } | null {
  let best: { width: number; height: number } | null = null;
  for (let i = 4; i + 16 <= bytes.length; i += 1) {
    // 'ispe' box: size(4) 'ispe'(4) version+flags(4) width(4) height(4).
    if (
      bytes[i] !== 0x69 ||
      bytes[i + 1] !== 0x73 ||
      bytes[i + 2] !== 0x70 ||
      bytes[i + 3] !== 0x65
    ) {
      continue;
    }
    const width = u32be(bytes, i + 8);
    const height = u32be(bytes, i + 12);
    if (width > 0 && height > 0 && (!best || width * height > best.width * best.height)) {
      best = { width, height };
    }
  }
  return best;
}

/**
 * Read the format and pixel dimensions from the file header without decoding
 * pixels. Used to reject decompression bombs before allocating memory.
 * Returns null when the header is missing, truncated or unrecognised.
 */
export function readImageHeader(bytes: Uint8Array): ImageHeader | null {
  const format = sniffFormat(bytes);
  let size: { width: number; height: number } | null = null;
  switch (format) {
    case 'jpeg':
      size = jpegSize(bytes);
      break;
    case 'png':
      if (bytes.length >= 24 && String.fromCharCode(...bytes.subarray(12, 16)) === 'IHDR') {
        size = { width: u32be(bytes, 16), height: u32be(bytes, 20) };
      }
      break;
    case 'webp':
      size = webpSize(bytes);
      break;
    case 'gif':
      if (bytes.length >= 10) size = { width: u16le(bytes, 6), height: u16le(bytes, 8) };
      break;
    case 'bmp':
      if (bytes.length >= 26) {
        size = { width: Math.abs(i32le(bytes, 18)), height: Math.abs(i32le(bytes, 22)) };
      }
      break;
    case 'avif':
      size = avifSize(bytes);
      break;
    default:
      return null;
  }
  if (size === null || size.width <= 0 || size.height <= 0) return null;
  return { format, ...size };
}

/** Bytes to read from the start of a file to parse any supported header (JPEG EXIF can be large). */
export const HEADER_PROBE_BYTES = 256 * 1024;
