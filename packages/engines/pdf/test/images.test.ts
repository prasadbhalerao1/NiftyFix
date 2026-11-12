import { PDFDocument, type PDFPage, type PDFRef } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { extractImages } from '../src';

/** The markers pdf-lib reads to embed a JPEG (start, frame header with size, end). */
function jpegHeader(width: number, height: number): Uint8Array {
  const size = [height, width].map((side) => side.toString(16).padStart(4, '0')).join('');
  const hex = `ffd8ffc0001108${size}03012200021101031101ffd9`;
  return Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16));
}

/** A 3 × 2 RGB image whose first pixel is half transparent, stored with a soft mask. */
const RGB = Uint8Array.from({ length: 3 * 2 * 3 }, (_, i) => (i * 13) % 256);
const ALPHA = Uint8Array.of(128, 255, 255, 255, 255, 255);

function addRgbImage(doc: PDFDocument): PDFRef {
  const common = { Type: 'XObject', Subtype: 'Image', Width: 3, Height: 2, BitsPerComponent: 8 };
  const mask = doc.context.register(
    doc.context.flateStream(ALPHA, { ...common, ColorSpace: 'DeviceGray' }),
  );
  return doc.context.register(
    doc.context.flateStream(RGB, { ...common, ColorSpace: 'DeviceRGB', SMask: mask }),
  );
}

const use = (page: PDFPage, ref: PDFRef): void => {
  page.node.newXObject('Im', ref);
};

/** Page 1: a JPEG and a 1 × 1 speck. Page 2: the RGB image and the JPEG again. Page 3: nothing. */
async function sample(): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const jpeg = await doc.embedJpg(jpegHeader(1200, 1600));
  const speck = doc.context.register(
    doc.context.flateStream(Uint8Array.of(0), {
      Type: 'XObject',
      Subtype: 'Image',
      Width: 1,
      Height: 1,
      BitsPerComponent: 8,
      ColorSpace: 'DeviceGray',
    }),
  );
  const rgb = addRgbImage(doc);
  const first = doc.addPage([600, 800]);
  first.drawImage(jpeg, { x: 0, y: 0, width: 300, height: 400 });
  use(first, speck);
  const second = doc.addPage([600, 800]);
  use(second, rgb);
  second.drawImage(jpeg, { x: 300, y: 0, width: 150, height: 200 });
  doc.addPage([600, 800]);
  // Reload so the images are read back from a saved file, as the tool does.
  return PDFDocument.load(await doc.save());
}

const summary = (report: ReturnType<typeof extractImages>) =>
  report.images.map(({ kind, page, width, height }) => [kind, page, width, height]);

describe('extractImages', () => {
  it('keeps JPEG bytes as stored, decodes RGB with its soft mask and skips tiny images', async () => {
    const report = extractImages(await sample(), { minSide: 2, pages: [0, 1, 2] });
    expect(report.tiny).toBe(1);
    expect(report.unsupported).toBe(0);
    expect(summary(report)).toEqual([
      ['jpeg', 0, 1200, 1600],
      ['rgba', 1, 3, 2],
    ]);
    const [jpeg, rgb] = report.images;
    if (jpeg?.kind !== 'jpeg' || rgb?.kind !== 'rgba') throw new Error('unexpected kinds');
    expect(jpeg.bytes).toEqual(jpegHeader(1200, 1600));
    expect([...rgb.rgba.slice(0, 8)]).toEqual([0, 13, 26, 128, 39, 52, 65, 255]);
  });

  it('reads only the chosen pages, crediting a shared image to the first chosen page', async () => {
    const doc = await sample();
    expect(summary(extractImages(doc, { minSide: 2, pages: [1] }))).toEqual([
      ['rgba', 1, 3, 2],
      ['jpeg', 1, 1200, 1600],
    ]);
    expect(extractImages(doc, { minSide: 2, pages: [2] }).images).toEqual([]);
  });

  it('keeps tiny images when the minimum side is 0', async () => {
    const report = extractImages(await sample(), { minSide: 0, pages: [0] });
    expect(report.tiny).toBe(0);
    expect(summary(report)).toEqual([
      ['jpeg', 0, 1200, 1600],
      ['rgba', 0, 1, 1],
    ]);
  });

  it('counts images it cannot convert faithfully instead of guessing', async () => {
    const doc = await PDFDocument.create();
    const cmyk = doc.context.register(
      doc.context.flateStream(new Uint8Array(4 * 4 * 4), {
        Type: 'XObject',
        Subtype: 'Image',
        Width: 4,
        Height: 4,
        BitsPerComponent: 8,
        ColorSpace: 'DeviceCMYK',
      }),
    );
    use(doc.addPage(), cmyk);
    const report = extractImages(await PDFDocument.load(await doc.save()), {
      minSide: 0,
      pages: [0],
    });
    expect(report).toEqual({ images: [], unsupported: 1, tiny: 0 });
  });
});
