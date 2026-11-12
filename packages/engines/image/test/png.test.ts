import { unzlibSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { encodePng, readImageHeader } from '../src';

/** Minimal PNG reader for 8-bit gray/RGB/RGBA: enough to check the encoder independently. */
function decode(png: Uint8Array): { channels: number; data: Uint8Array } {
  const view = new DataView(png.buffer, png.byteOffset);
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat: Uint8Array[] = [];
  while (offset < png.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8));
    const body = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      channels = ({ 0: 1, 2: 3, 6: 4 } as Record<number, number>)[body[9] ?? -1] ?? 0;
    }
    if (type === 'IDAT') idat.push(body);
    offset += 12 + length;
  }
  const joined = new Uint8Array(idat.reduce((sum, part) => sum + part.length, 0));
  idat.reduce((at, part) => (joined.set(part, at), at + part.length), 0);
  const filtered = unzlibSync(joined);
  const stride = width * channels;
  const data = new Uint8Array(stride * height);
  for (let y = 0; y < height; y += 1) {
    const filter = filtered[y * (stride + 1)];
    for (let i = 0; i < stride; i += 1) {
      const x = filtered[y * (stride + 1) + 1 + i] ?? 0;
      const a = i >= channels ? (data[y * stride + i - channels] ?? 0) : 0;
      const b = y > 0 ? (data[(y - 1) * stride + i] ?? 0) : 0;
      const c = y > 0 && i >= channels ? (data[(y - 1) * stride + i - channels] ?? 0) : 0;
      const p = a + b - c;
      const paeth =
        Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c)
          ? a
          : Math.abs(p - b) <= Math.abs(p - c)
            ? b
            : c;
      const predicted = [0, a, b, (a + b) >> 1, paeth][filter ?? 0] ?? 0;
      data[y * stride + i] = (x + predicted) & 0xff;
    }
  }
  return { channels, data };
}

const pixels = (width: number, height: number, pixel: (i: number) => number[]) => ({
  width,
  height,
  data: Uint8ClampedArray.from({ length: width * height * 4 }, (_, i) => pixel(i >> 2)[i % 4] ?? 0),
});

describe('encodePng', () => {
  it('round-trips transparent colour pixels exactly as RGBA', () => {
    const image = pixels(7, 5, (p) => [
      (p * 37) % 256,
      (p * 11) % 256,
      (p * 5) % 256,
      (p * 50) % 256,
    ]);
    const png = encodePng(image);
    expect(readImageHeader(png)).toEqual({ format: 'png', width: 7, height: 5 });
    const { channels, data } = decode(png);
    expect(channels).toBe(4);
    expect([...data]).toEqual([...image.data]);
  });

  it('writes opaque images as RGB and opaque gray ones as gray', () => {
    const colour = pixels(4, 3, (p) => [p * 20, 255 - p, p, 255]);
    const rgb = decode(encodePng(colour));
    expect(rgb.channels).toBe(3);
    expect([...rgb.data]).toEqual([...colour.data].filter((_, i) => i % 4 !== 3));

    const grayImage = pixels(3, 3, (p) => [p * 25, p * 25, p * 25, 255]);
    const gray = decode(encodePng(grayImage));
    expect(gray.channels).toBe(1);
    expect([...gray.data]).toEqual([0, 25, 50, 75, 100, 125, 150, 175, 200]);
  });
});
