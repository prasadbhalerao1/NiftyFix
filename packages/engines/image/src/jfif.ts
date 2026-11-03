/**
 * JPEG resolution (DPI) lives in the JFIF APP0 segment:
 *   FF E0 | length(2) | "JFIF\0" | version(2) | units(1) | Xdensity(2) | Ydensity(2) | thumb w,h(2)
 * units: 0 = aspect ratio only, 1 = dots per inch, 2 = dots per cm.
 * Setting it changes metadata only; pixels and quality are untouched.
 */

const JFIF_ID = [0x4a, 0x46, 0x49, 0x46, 0x00];

function isJfifApp0(b: Uint8Array, i: number): boolean {
  return b[i] === 0xff && b[i + 1] === 0xe0 && JFIF_ID.every((v, k) => b[i + 4 + k] === v);
}

function assertJpeg(b: Uint8Array): void {
  if (!(b[0] === 0xff && b[1] === 0xd8)) throw new TypeError('Not a JPEG file.');
}

export interface JpegDensity {
  unit: 'none' | 'dpi' | 'dpcm';
  x: number;
  y: number;
}

export function readJpegDensity(bytes: Uint8Array): JpegDensity | null {
  assertJpeg(bytes);
  if (!isJfifApp0(bytes, 2)) return null;
  const units = bytes[13];
  const x = ((bytes[14] ?? 0) << 8) | (bytes[15] ?? 0);
  const y = ((bytes[16] ?? 0) << 8) | (bytes[17] ?? 0);
  const unit = units === 1 ? 'dpi' : units === 2 ? 'dpcm' : 'none';
  return { unit, x, y };
}

/** Return a copy of the JPEG with its density set to `dpi` dots per inch. */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  assertJpeg(bytes);
  if (!Number.isInteger(dpi) || dpi < 1 || dpi > 65535) {
    throw new RangeError('DPI must be an integer between 1 and 65535.');
  }
  const hi = (dpi >> 8) & 0xff;
  const lo = dpi & 0xff;
  if (isJfifApp0(bytes, 2)) {
    const out = bytes.slice();
    out[13] = 1;
    out[14] = hi;
    out[15] = lo;
    out[16] = hi;
    out[17] = lo;
    return out;
  }
  // No JFIF segment (e.g. starts with EXIF APP1): insert a 16-byte APP0 after SOI.
  const app0 = Uint8Array.of(
    0xff,
    0xe0,
    0x00,
    0x10,
    ...JFIF_ID,
    0x01,
    0x02,
    1,
    hi,
    lo,
    hi,
    lo,
    0,
    0,
  );
  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}

/** Effective DPI if the file declares one, otherwise null. */
export function jpegDpi(bytes: Uint8Array): number | null {
  const density = readJpegDensity(bytes);
  if (density === null || density.x !== density.y) return null;
  if (density.unit === 'dpi') return density.x;
  if (density.unit === 'dpcm') return Math.round(density.x * 2.54);
  return null;
}
