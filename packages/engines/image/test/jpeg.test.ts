import { describe, expect, it } from 'vitest';
import { AC_VALUES, encodeGrayJpeg, readImageHeader } from '../src';

describe('encodeGrayJpeg', () => {
  it('uses the full standard AC table', () => {
    expect(AC_VALUES).toHaveLength(162);
  });

  it('writes a one-channel baseline JPEG of the right size', () => {
    const width = 19;
    const height = 11;
    const gray = Uint8Array.from({ length: width * height }, (_, i) => (i * 7) % 256);
    const jpeg = encodeGrayJpeg(gray, width, height, 0.9);
    expect(readImageHeader(jpeg)).toEqual({ format: 'jpeg', width, height });
    // Start of frame: 8-bit, one component.
    const sof = jpeg.findIndex((byte, i) => byte === 0xff && jpeg[i + 1] === 0xc0);
    expect(jpeg[sof + 9]).toBe(1);
    expect([...jpeg.subarray(-2)]).toEqual([0xff, 0xd9]);
  });

  it('makes smaller files at lower quality', () => {
    const gray = Uint8Array.from({ length: 64 * 64 }, (_, i) => (i * 37) % 256);
    expect(encodeGrayJpeg(gray, 64, 64, 0.5).length).toBeLessThan(
      encodeGrayJpeg(gray, 64, 64, 0.95).length,
    );
  });
});
