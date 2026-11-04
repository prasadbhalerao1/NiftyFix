import { describe, expect, it } from 'vitest';
import { readJpegOrientation } from '../src/exif';

/** Minimal JPEG: SOI, APP1 Exif with one IFD0 entry (Orientation), then EOI. */
function jpegWithOrientation(value: number, littleEndian: boolean): Uint8Array {
  const tiff = new Uint8Array(8 + 2 + 12 + 4);
  const view = new DataView(tiff.buffer);
  view.setUint16(0, littleEndian ? 0x4949 : 0x4d4d);
  view.setUint16(2, 42, littleEndian);
  view.setUint32(4, 8, littleEndian);
  view.setUint16(8, 1, littleEndian);
  view.setUint16(10, 0x0112, littleEndian);
  view.setUint16(12, 3, littleEndian);
  view.setUint32(14, 1, littleEndian);
  view.setUint16(18, value, littleEndian);
  const payload = [...new TextEncoder().encode('Exif'), 0, 0, ...tiff];
  const length = payload.length + 2;
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xe1,
    length >> 8,
    length & 0xff,
    ...payload,
    0xff,
    0xd9,
  ]);
}

describe('readJpegOrientation', () => {
  it('reads the tag in both byte orders', () => {
    for (const value of [1, 3, 6, 8]) {
      expect(readJpegOrientation(jpegWithOrientation(value, true))).toBe(value);
      expect(readJpegOrientation(jpegWithOrientation(value, false))).toBe(value);
    }
  });

  it('defaults to upright for missing, invalid or truncated data', () => {
    expect(readJpegOrientation(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]))).toBe(1);
    expect(readJpegOrientation(new Uint8Array([1, 2, 3]))).toBe(1);
    expect(readJpegOrientation(jpegWithOrientation(9, true))).toBe(1);
    expect(readJpegOrientation(jpegWithOrientation(6, true).subarray(0, 20))).toBe(1);
  });
});
