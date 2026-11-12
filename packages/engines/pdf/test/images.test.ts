import {
  concatTransformationMatrix,
  drawObject,
  PDFDocument,
  PDFName,
  PDFRawStream,
  popGraphicsState,
  pushGraphicsState,
  type PDFPage,
  type PDFRef,
} from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { displayOrientation, extractImages, imagePlacements, isolateImages } from '../src';

/** The markers pdf-lib reads to embed a JPEG (start, frame header with size, end). */
function jpegHeader(width: number, height: number): Uint8Array {
  const size = [height, width].map((side) => side.toString(16).padStart(4, '0')).join('');
  const hex = `ffd8ffc0001108${size}03012200021101031101ffd9`;
  return Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16));
}

const IMAGE = { Type: 'XObject', Subtype: 'Image', BitsPerComponent: 8 };

/** A 3 × 2 RGB image whose first pixel is half transparent, stored with a soft mask. */
const RGB = Uint8Array.from({ length: 3 * 2 * 3 }, (_, i) => (i * 13) % 256);
const ALPHA = Uint8Array.of(128, 255, 255, 255, 255, 255);

function addRgbImage(doc: PDFDocument): PDFRef {
  const size = { ...IMAGE, Width: 3, Height: 2 };
  const mask = doc.context.register(
    doc.context.flateStream(ALPHA, { ...size, ColorSpace: 'DeviceGray' }),
  );
  return doc.context.register(
    doc.context.flateStream(RGB, { ...size, ColorSpace: 'DeviceRGB', SMask: mask }),
  );
}

/** Draw an image XObject at (x, y), w × h points. */
function draw(page: PDFPage, ref: PDFRef, [x, y, w, h]: number[]): void {
  const name = page.node.newXObject('Im', ref);
  page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(w ?? 1, 0, 0, h ?? 1, x ?? 0, y ?? 0),
    drawObject(name),
    popGraphicsState(),
  );
}

const saved = async (doc: PDFDocument): Promise<PDFDocument> => PDFDocument.load(await doc.save());

/** Page 1: a JPEG and a 1 × 1 speck. Page 2: the RGB image and the JPEG again. Page 3: nothing. */
async function sample(): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const jpeg = await doc.embedJpg(jpegHeader(1200, 1600));
  const speck = doc.context.register(
    doc.context.flateStream(Uint8Array.of(0), {
      ...IMAGE,
      Width: 1,
      Height: 1,
      ColorSpace: 'DeviceGray',
    }),
  );
  const rgb = addRgbImage(doc);
  const first = doc.addPage([600, 800]);
  first.drawImage(jpeg, { x: 0, y: 0, width: 300, height: 400 });
  draw(first, speck, [400, 400, 20, 10]);
  const second = doc.addPage([600, 800]);
  draw(second, rgb, [10, 20, 30, 40]);
  second.drawImage(jpeg, { x: 300, y: 0, width: 150, height: 200 });
  doc.addPage([600, 800]);
  // Reload so the images are read back from a saved file, as the tool does.
  return saved(doc);
}

const summary = (report: ReturnType<typeof extractImages>) =>
  report.images.map(({ kind, page, width, height }) => [kind, page, width, height]);

describe('extractImages', () => {
  it('keeps JPEG bytes as stored, decodes RGB with its soft mask and skips tiny images', async () => {
    const report = extractImages(await sample(), { minSide: 2, pages: [0, 1, 2] });
    expect(report.tiny).toBe(1);
    expect(summary(report)).toEqual([
      ['jpeg', 0, 1200, 1600],
      ['rgba', 1, 3, 2],
    ]);
    const [jpeg, rgb] = report.images;
    if (jpeg?.kind !== 'jpeg' || rgb?.kind !== 'rgba') throw new Error('unexpected kinds');
    expect(jpeg.bytes).toEqual(jpegHeader(1200, 1600));
    expect([...rgb.rgba.slice(0, 8)]).toEqual([0, 13, 26, 128, 39, 52, 65, 255]);
    // Where each is drawn: the JPEG twice, on both pages.
    expect(jpeg.placements).toEqual([
      { page: 0, matrix: [300, 0, 0, 400, 0, 0] },
      { page: 1, matrix: [150, 0, 0, 200, 300, 0] },
    ]);
    expect(rgb.placements).toEqual([{ page: 1, matrix: [30, 0, 0, 40, 10, 20] }]);
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

  it('sends formats it does not decode itself to the full decoder', async () => {
    const doc = await PDFDocument.create();
    const cmyk = doc.context.register(
      doc.context.flateStream(new Uint8Array(4 * 4 * 4), {
        ...IMAGE,
        Width: 4,
        Height: 4,
        ColorSpace: 'DeviceCMYK',
      }),
    );
    draw(doc.addPage(), cmyk, [0, 0, 4, 4]);
    const report = extractImages(await saved(doc), { minSide: 0, pages: [0] });
    expect(summary(report)).toEqual([['decode', 0, 4, 4]]);
  });
});

describe('imagePlacements', () => {
  it('finds inline images and images inside forms, with their full transformation', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([600, 800]);
    const rgb = addRgbImage(doc);
    // A form scaled by 2 that draws the image at 10 × 10 points.
    const form = doc.context.register(
      doc.context.stream('q 10 0 0 10 0 0 cm /Pic Do Q', {
        Type: 'XObject',
        Subtype: 'Form',
        BBox: [0, 0, 100, 100],
        Matrix: [2, 0, 0, 2, 0, 0],
        Resources: { XObject: { Pic: rgb } },
      }),
    );
    const formName = page.node.newXObject('Fm', form);
    page.pushOperators(
      pushGraphicsState(),
      concatTransformationMatrix(1, 0, 0, 1, 100, 200),
      drawObject(formName),
      popGraphicsState(),
    );
    // An inline 2 × 1 RGB image; the text before it has brackets and "Do" that must be skipped.
    const content = doc.context.stream(
      'BT (a\\) Do ) [(x)] TJ ET q 20 0 0 10 5 6 cm BI /W 2 /H 1 /CS /RGB /BPC 8 ID \xff\x00\x00\x00\xff\x00 EI Q',
    );
    page.node.addContentStream(doc.context.register(content));
    const placements = imagePlacements(await saved(doc), 0);
    expect(placements.map(({ matrix }) => matrix)).toEqual([
      [20, 0, 0, 20, 100, 200],
      [20, 0, 0, 10, 5, 6],
    ]);
    const inline = placements[1]?.stream;
    expect(inline?.dict.lookup(PDFName.of('ColorSpace'))).toBe(PDFName.of('DeviceRGB'));
    expect([...(inline?.contents ?? [])]).toEqual([255, 0, 0, 0, 255, 0]);
  });
});

describe('isolateImages', () => {
  it('copies each image onto its own page, turning stencil masks into gray images', async () => {
    const doc = await PDFDocument.create();
    const stencil = doc.context.register(
      doc.context.flateStream(Uint8Array.of(0b10100000), {
        Type: 'XObject',
        Subtype: 'Image',
        Width: 3,
        Height: 1,
        ImageMask: true,
      }),
    );
    const rgb = addRgbImage(doc);
    const out = await PDFDocument.load(await isolateImages(doc, [stencil, rgb]));
    expect(out.getPageCount()).toBe(2);
    const [mask, colour] = [0, 1].map((page) => imagePlacements(out, page)[0]?.stream);
    expect(mask?.dict.lookup(PDFName.of('ImageMask'))).toBeUndefined();
    expect(mask?.dict.lookup(PDFName.of('ColorSpace'))).toBe(PDFName.of('DeviceGray'));
    expect(colour?.dict.lookup(PDFName.of('SMask'))).toBeInstanceOf(PDFRawStream);
  });
});

describe('displayOrientation', () => {
  it.each([
    [[100, 0, 0, 50, 0, 0], 0, 1],
    [[100, 0, 0, -50, 0, 50], 0, 4],
    [[-100, 0, 0, -50, 100, 50], 0, 3],
    [[0, 100, -50, 0, 50, 0], 0, 8],
    [[0, -100, 50, 0, 0, 100], 0, 6],
    [[100, 0, 0, 50, 0, 0], 90, 6],
    [[100, 0, 0, 50, 0, 0], 270, 8],
    [[70, 70, -35, 35, 0, 0], 0, null],
  ] as const)('%j on a page rotated %i', (matrix, rotation, expected) => {
    expect(displayOrientation(matrix, rotation)).toBe(expected);
  });
});
