import { describe, expect, it } from 'vitest';
import { readJpegOrientation, setJpegOrientation } from '../src/exif';
import { orientPixels } from '../src/orient';

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

describe('setJpegOrientation', () => {
  it('rewrites an existing tag in place, in both byte orders', () => {
    for (const little of [true, false]) {
      const before = jpegWithOrientation(1, little);
      const after = setJpegOrientation(before, 6);
      expect(after.length).toBe(before.length);
      expect(readJpegOrientation(after)).toBe(6);
    }
  });

  it('adds a small EXIF block after JFIF when there is none, leaving the rest untouched', () => {
    const jfif = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46, 0xff, 0xd9);
    const after = setJpegOrientation(jfif, 8);
    expect(readJpegOrientation(after)).toBe(8);
    expect([...after.subarray(0, 8)]).toEqual([...jfif.subarray(0, 8)]);
    expect([...after.subarray(-2)]).toEqual([0xff, 0xd9]);
    expect(after.length).toBe(jfif.length + 36);
  });
});

describe('orientPixels', () => {
  // A 3 × 2 image whose pixels are numbered 1..6 (one byte each in R, others 0).
  const image = {
    width: 3,
    height: 2,
    data: Uint8ClampedArray.from({ length: 24 }, (_, i) => (i % 4 === 0 ? i / 4 + 1 : 0)),
  };
  const numbers = (pixels: { data: Uint8ClampedArray }) =>
    [...pixels.data].filter((_, i) => i % 4 === 0);

  it.each([
    [1, 3, [1, 2, 3, 4, 5, 6]],
    [2, 3, [3, 2, 1, 6, 5, 4]],
    [3, 3, [6, 5, 4, 3, 2, 1]],
    [4, 3, [4, 5, 6, 1, 2, 3]],
    [5, 2, [1, 4, 2, 5, 3, 6]],
    [6, 2, [4, 1, 5, 2, 6, 3]],
    [7, 2, [6, 3, 5, 2, 4, 1]],
    [8, 2, [3, 6, 2, 5, 1, 4]],
  ])('orientation %i', (orientation, width, expected) => {
    const out = orientPixels(image, orientation);
    expect(out.width).toBe(width);
    expect(numbers(out)).toEqual(expected);
  });
});
