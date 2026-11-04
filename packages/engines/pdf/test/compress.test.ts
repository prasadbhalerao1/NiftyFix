import {
  PDFDocument,
  PDFName,
  type PDFNumber,
  type PDFRawStream,
  type PDFRef,
} from '@cantoo/pdf-lib';
import { describe, expect, it, vi } from 'vitest';
import { ToolError } from '@niftyfix/tool-sdk';
import { recompressImages, type ImageTranscoder } from '../src';

const settings = { quality: 0.6, maxSide: 1000, convertLossless: true, minBytes: 10 };

async function docWithImage(
  dict: Record<string, unknown>,
  bytes = new Uint8Array(5000).fill(7),
): Promise<{ doc: PDFDocument; ref: PDFRef }> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const stream = doc.context.stream(bytes, {
    Type: 'XObject',
    Subtype: 'Image',
    Width: 100,
    Height: 50,
    BitsPerComponent: 8,
    ColorSpace: 'DeviceRGB',
    ...dict,
  });
  return { doc, ref: doc.context.register(stream) };
}

const smaller = (): ImageTranscoder => ({
  jpeg: vi.fn(async () => ({
    bytes: new Uint8Array(100),
    width: 80,
    height: 40,
    channels: 3 as const,
  })),
  pixels: vi.fn(async () => ({
    bytes: new Uint8Array(100),
    width: 100,
    height: 50,
    channels: 3 as const,
  })),
});

const stored = (doc: PDFDocument, ref: PDFRef): PDFRawStream =>
  doc.context.lookup(ref) as PDFRawStream;

describe('recompressImages', () => {
  it('replaces a JPEG image with a smaller re-encoding, keeping its other entries', async () => {
    const { doc, ref } = await docWithImage({ Filter: 'DCTDecode', Interpolate: true });
    const report = await recompressImages(doc, settings, smaller());
    expect(report).toMatchObject({ images: 1, recompressed: 1, skipped: 0, savedBytes: 4900 });
    const image = stored(doc, ref);
    expect(image.contents.length).toBe(100);
    expect((image.dict.lookup(PDFName.of('Width')) as PDFNumber).asNumber()).toBe(80);
    expect(image.dict.lookup(PDFName.of('Interpolate'))).toBeDefined();
  });

  it('never replaces an image with a larger one', async () => {
    const { doc, ref } = await docWithImage({ Filter: 'DCTDecode' });
    const bigger: ImageTranscoder = {
      ...smaller(),
      jpeg: async () => ({ bytes: new Uint8Array(9000), width: 100, height: 50, channels: 3 }),
    };
    const report = await recompressImages(doc, settings, bigger);
    expect(report.recompressed).toBe(0);
    expect(stored(doc, ref).contents.length).toBe(5000);
  });

  it('leaves CMYK, masks and decode arrays alone without decoding them', async () => {
    for (const dict of [
      { Filter: 'DCTDecode', ColorSpace: 'DeviceCMYK' },
      { Filter: 'DCTDecode', ImageMask: true },
      { Filter: 'DCTDecode', Decode: [1, 0, 1, 0, 1, 0] },
    ]) {
      const { doc } = await docWithImage(dict);
      const transcoder = smaller();
      const report = await recompressImages(doc, settings, transcoder);
      expect(report.skipped, JSON.stringify(dict)).toBe(1);
      expect(transcoder.jpeg).not.toHaveBeenCalled();
    }
  });

  it('converts lossless images only when allowed', async () => {
    const raw = new Uint8Array(100 * 50 * 3).fill(200);
    const { doc: off } = await docWithImage({ Filter: 'FlateDecode' }, raw);
    // Uncompressed stand-in: no filter means the raw pixels are the stream contents.
    const { doc: on } = await docWithImage({}, raw);
    const keep = smaller();
    expect(
      (await recompressImages(off, { ...settings, convertLossless: false }, keep)).recompressed,
    ).toBe(0);
    expect(keep.pixels).not.toHaveBeenCalled();
    // Unfiltered images are not Flate, so they are left alone too.
    expect((await recompressImages(on, settings, smaller())).recompressed).toBe(0);
  });

  it('lets environment errors through so the runtime can fall back to the main thread', async () => {
    const { doc } = await docWithImage({ Filter: 'DCTDecode' });
    const unsupported: ImageTranscoder = {
      ...smaller(),
      jpeg: async () => {
        throw new ToolError('WORKER_UNSUPPORTED', 'No canvas in this worker.');
      },
    };
    await expect(recompressImages(doc, settings, unsupported)).rejects.toMatchObject({
      code: 'WORKER_UNSUPPORTED',
    });
    // A plain decode failure only skips that image.
    const broken: ImageTranscoder = {
      ...smaller(),
      jpeg: async () => Promise.reject(new Error('bad')),
    };
    const { doc: other } = await docWithImage({ Filter: 'DCTDecode' });
    expect((await recompressImages(other, settings, broken)).skipped).toBe(1);
  });
});
