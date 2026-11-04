import { describe, expect, it } from 'vitest';
import { readImageHeader } from '../src/header';

const ascii = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));
const be16 = (n: number): number[] => [(n >> 8) & 0xff, n & 0xff];
const be32 = (n: number): number[] => [
  (n >>> 24) & 0xff,
  (n >> 16) & 0xff,
  (n >> 8) & 0xff,
  n & 0xff,
];
const le16 = (n: number): number[] => [n & 0xff, (n >> 8) & 0xff];
const le24 = (n: number): number[] => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff];

function jpeg(width: number, height: number, withExif = false): Uint8Array {
  const exif = withExif ? [0xff, 0xe1, ...be16(8), ...ascii('Exif'), 0, 0] : [];
  return Uint8Array.from([
    0xff,
    0xd8,
    ...exif,
    0xff,
    0xdb,
    ...be16(4),
    0,
    0, // DQT stub
    0xff,
    0xc4,
    ...be16(4),
    0,
    0, // DHT must not be mistaken for SOF
    0xff,
    0xc2,
    ...be16(11),
    8,
    ...be16(height),
    ...be16(width),
    1,
    1,
    0x11,
    0,
    0xff,
    0xd9,
  ]);
}

describe('readImageHeader', () => {
  it('reads progressive JPEG dimensions past APP1 and DHT', () => {
    expect(readImageHeader(jpeg(4032, 3024, true))).toEqual({
      format: 'jpeg',
      width: 4032,
      height: 3024,
    });
  });

  it('reads PNG IHDR', () => {
    const png = Uint8Array.from([
      0x89,
      ...ascii('PNG'),
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      ...be32(13),
      ...ascii('IHDR'),
      ...be32(30000),
      ...be32(30000),
    ]);
    expect(readImageHeader(png)).toEqual({ format: 'png', width: 30000, height: 30000 });
  });

  it('reads WebP VP8X', () => {
    const webp = Uint8Array.from([
      ...ascii('RIFF'),
      0,
      0,
      0,
      0,
      ...ascii('WEBP'),
      ...ascii('VP8X'),
      10,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      ...le24(1919),
      ...le24(1079),
    ]);
    expect(readImageHeader(webp)).toEqual({ format: 'webp', width: 1920, height: 1080 });
  });

  it('reads GIF logical screen size', () => {
    const gif = Uint8Array.from([...ascii('GIF89a'), ...le16(320), ...le16(240)]);
    expect(readImageHeader(gif)).toEqual({ format: 'gif', width: 320, height: 240 });
  });

  it('reads AVIF dimensions from the largest ispe box (not a tile)', () => {
    const box = (type: string, payload: number[]): number[] => {
      const size = 8 + payload.length;
      return [
        size >>> 24,
        (size >>> 16) & 255,
        (size >>> 8) & 255,
        size & 255,
        ...ascii(type),
        ...payload,
      ];
    };
    const u32 = (n: number): number[] => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    const avif = Uint8Array.from([
      ...box('ftyp', [...ascii('avif'), 0, 0, 0, 0, ...ascii('mif1')]),
      ...box('ispe', [0, 0, 0, 0, ...u32(512), ...u32(512)]),
      ...box('ispe', [0, 0, 0, 0, ...u32(4000), ...u32(3000)]),
    ]);
    expect(readImageHeader(avif)).toEqual({ format: 'avif', width: 4000, height: 3000 });
    // An AVIF without any size information is unreadable, not 0 × 0.
    expect(readImageHeader(avif.subarray(0, 24))).toBeNull();
  });

  it('returns null for truncated or unknown data', () => {
    expect(readImageHeader(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toBeNull();
    expect(readImageHeader(Uint8Array.from(ascii('hello world, not an image')))).toBeNull();
    expect(readImageHeader(new Uint8Array(0))).toBeNull();
  });

  it('returns null for zero-size images', () => {
    expect(readImageHeader(jpeg(0, 100))).toBeNull();
  });
});
