import { describe, expect, it } from 'vitest';
import { jpegDpi, readJpegDensity, setJpegDpi } from '../src/jfif';

const JFIF = [
  0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01,
  0x00, 0x00,
];
const BODY = [0xff, 0xdb, 0x00, 0x04, 0x00, 0x00, 0xff, 0xd9];

describe('JPEG density', () => {
  it('updates an existing JFIF segment in place', () => {
    const input = Uint8Array.from([0xff, 0xd8, ...JFIF, ...BODY]);
    expect(readJpegDensity(input)).toEqual({ unit: 'none', x: 1, y: 1 });
    const output = setJpegDpi(input, 300);
    expect(output.length).toBe(input.length);
    expect(jpegDpi(output)).toBe(300);
    expect(input[13]).toBe(0); // original untouched
  });

  it('inserts JFIF when the file starts with EXIF', () => {
    const exif = [0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
    const input = Uint8Array.from([0xff, 0xd8, ...exif, ...BODY]);
    expect(readJpegDensity(input)).toBeNull();
    const output = setJpegDpi(input, 200);
    expect(output.length).toBe(input.length + 18);
    expect(jpegDpi(output)).toBe(200);
    expect([...output.subarray(20, 30)]).toEqual(exif);
  });

  it('converts dots-per-cm', () => {
    const dpcm = [...JFIF];
    dpcm[11] = 2;
    dpcm[13] = 118;
    dpcm[15] = 118;
    expect(jpegDpi(Uint8Array.from([0xff, 0xd8, ...dpcm, ...BODY]))).toBe(300);
  });

  it('rejects non-JPEG input and invalid DPI', () => {
    expect(() => setJpegDpi(Uint8Array.from([0x89, 0x50]), 300)).toThrow(TypeError);
    expect(() => setJpegDpi(Uint8Array.from([0xff, 0xd8, ...JFIF]), 0)).toThrow(RangeError);
  });
});
