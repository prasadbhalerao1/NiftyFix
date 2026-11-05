import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readJpegOrientation } from '../src/exif';
import { readMetadata, stripMetadata } from '../src/metadata';
import { tiffWithGps } from './samples';

const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(join(import.meta.dirname, '../../../../fixtures', name)));

function segment(marker: number, body: Uint8Array): number[] {
  const length = body.length + 2;
  return [0xff, marker, length >> 8, length & 0xff, ...body];
}

/** SOI, JFIF, EXIF with GPS, a comment, then a pretend scan (SOS + data + EOI). */
function jpegWithGps(): Uint8Array {
  const exif = new Uint8Array([...new TextEncoder().encode('Exif\0\0'), ...tiffWithGps()]);
  const jfif = new TextEncoder().encode('JFIF\0\x01\x01\0\0\x01\0\x01\0\0');
  return Uint8Array.from([
    0xff,
    0xd8,
    ...segment(0xe0, jfif),
    ...segment(0xe1, exif),
    ...segment(0xfe, new TextEncoder().encode('hello')),
    0xff,
    0xda,
    0x00,
    0x02,
    1,
    2,
    3,
    4,
    0xff,
    0xd9,
  ]);
}

const tail = (bytes: Uint8Array): number[] => [...bytes.subarray(bytes.length - 10)];

describe('JPEG metadata', () => {
  it('reads camera, location and the kinds present', () => {
    const report = readMetadata(jpegWithGps(), 'jpeg');
    expect(report.kinds).toEqual(['EXIF', 'Comment']);
    expect(report.hasLocation).toBe(true);
    expect(report.items[0]).toEqual({ label: 'Location (GPS)', value: '12.50000, 77.25000' });
    expect(report.items).toContainEqual({ label: 'Camera maker', value: 'TestCam' });
  });

  it('removes EXIF and comments and copies the image data unchanged', () => {
    const input = jpegWithGps();
    const output = stripMetadata(input, 'jpeg');
    expect(readMetadata(output, 'jpeg')).toEqual({
      kinds: [],
      items: [],
      hasLocation: false,
      orientation: 1,
    });
    expect(tail(output)).toEqual(tail(input));
    // JFIF is kept.
    expect(String.fromCharCode(...output.subarray(6, 10))).toBe('JFIF');
  });

  it('keeps only the orientation of a sideways photo', () => {
    const input = fixture('images/exif-rotated-6.jpg');
    expect(readJpegOrientation(input)).toBe(6);
    const output = stripMetadata(input, 'jpeg');
    expect(readJpegOrientation(output)).toBe(6);
    expect(readMetadata(output, 'jpeg').items).toEqual([]);
    expect(output.length).toBeLessThanOrEqual(input.length);
    expect(tail(output)).toEqual(tail(input));
  });

  it('leaves a file that is not a JPEG alone', () => {
    const junk = new Uint8Array([1, 2, 3, 4, 5]);
    expect(stripMetadata(junk, 'jpeg')).toBe(junk);
  });
});

describe('PNG metadata', () => {
  it('removes text chunks and keeps the image chunks', () => {
    const png = fixture('images/transparent-800x800.png');
    // Insert a tEXt chunk after IHDR (8-byte signature + 25-byte IHDR).
    const text = new TextEncoder().encode('Author\0Someone');
    const chunk = new Uint8Array(12 + text.length);
    new DataView(chunk.buffer).setUint32(0, text.length);
    chunk.set(new TextEncoder().encode('tEXt'), 4);
    chunk.set(text, 8);
    const input = Uint8Array.from([...png.subarray(0, 33), ...chunk, ...png.subarray(33)]);
    expect(readMetadata(input, 'png').kinds).toEqual(['Text']);
    const output = stripMetadata(input, 'png');
    expect(readMetadata(output, 'png').kinds).toEqual([]);
    expect(output.length).toBe(input.length - chunk.length);
  });
});

describe('WebP metadata', () => {
  it('removes the EXIF chunk, clears its flag and fixes the RIFF size', () => {
    const tiff = tiffWithGps();
    const vp8x = new Uint8Array(10);
    vp8x[0] = 0x08;
    const chunk = (type: string, body: Uint8Array): number[] => {
      const size = body.length;
      return [
        ...new TextEncoder().encode(type),
        size & 0xff,
        (size >> 8) & 0xff,
        0,
        0,
        ...body,
        ...(size % 2 ? [0] : []),
      ];
    };
    const body = [
      ...new TextEncoder().encode('WEBP'),
      ...chunk('VP8X', vp8x),
      ...chunk('VP8L', new Uint8Array([1, 2, 3, 4])),
      ...chunk('EXIF', tiff),
    ];
    const size = body.length;
    const input = Uint8Array.from([
      ...new TextEncoder().encode('RIFF'),
      size & 0xff,
      (size >> 8) & 0xff,
      0,
      0,
      ...body,
    ]);
    expect(readMetadata(input, 'webp').hasLocation).toBe(true);
    const output = stripMetadata(input, 'webp');
    expect(readMetadata(output, 'webp').kinds).toEqual([]);
    expect(output[20]).toBe(0);
    expect(new DataView(output.buffer).getUint32(4, true)).toBe(output.length - 8);
  });
});
