import {
  decodePDFRawStream,
  PDFDocument,
  PDFName,
  PDFRawStream,
  type PDFRef,
} from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  colourLeft,
  contentBytes,
  grayscaleDocument,
  replaceImage,
  type ToneSettings,
} from '../src';

const GRAY: ToneSettings = {
  method: 'luminance',
  brightness: 0,
  contrast: 0,
  mode: 'gray',
  threshold: 0.5,
  strength: 1,
};

/** A page using every kind of colour a PDF can hold. */
async function colourful(): Promise<PDFDocument> {
  const doc = await PDFDocument.create();
  const { context } = doc;
  const page = doc.addPage([400, 400]);
  const spot = context.obj([
    PDFName.of('Separation'),
    PDFName.of('PANTONE 300'),
    PDFName.of('DeviceCMYK'),
    context.obj({ FunctionType: 2, Domain: [0, 1], C0: [0, 0, 0, 0], C1: [1, 0, 0, 0], N: 1 }),
  ]);
  const icc = context.obj([PDFName.of('ICCBased'), context.register(context.stream('', { N: 3 }))]);
  const shading = context.obj({
    ShadingType: 2,
    ColorSpace: 'DeviceRGB',
    Coords: [0, 0, 100, 0],
    Function: context.obj({ FunctionType: 2, Domain: [0, 1], C0: [1, 0, 0], C1: [0, 0, 1], N: 1 }),
  });
  const form = context.register(
    context.stream('0 0 1 rg 0 0 10 10 re f', {
      Type: 'XObject',
      Subtype: 'Form',
      BBox: [0, 0, 10, 10],
    }),
  );
  const indexed = context.register(
    context.flateStream(Uint8Array.of(0, 1), {
      Type: 'XObject',
      Subtype: 'Image',
      Width: 2,
      Height: 1,
      BitsPerComponent: 8,
      ColorSpace: [
        PDFName.of('Indexed'),
        PDFName.of('DeviceRGB'),
        1,
        context.stream(Uint8Array.of(255, 0, 0, 0, 255, 0)),
      ],
    }),
  );
  const photo = context.register(
    context.flateStream(Uint8Array.of(255, 0, 0, 0, 0, 255), {
      Type: 'XObject',
      Subtype: 'Image',
      Width: 2,
      Height: 1,
      BitsPerComponent: 8,
      ColorSpace: 'DeviceRGB',
    }),
  );
  page.node.set(
    PDFName.of('Resources'),
    context.obj({
      ColorSpace: { Spot: spot, Icc: icc },
      Shading: { Sh: shading },
      XObject: { Fm: form, Ix: indexed, Ph: photo },
    }),
  );
  const content = [
    '1 0 0 rg 0 1 0 RG 0 0 50 50 re B',
    '0 1 1 0 k',
    '/Spot cs 0.5 sc',
    '/Icc CS 0 0 1 SC',
    'BT /F1 12 Tf 1 0 0 rg (Hello) Tj ET',
    '/Sh sh /Fm Do /Ix Do /Ph Do',
    'BI /W 1 /H 1 /CS /RGB /BPC 8 ID ÿ\u0000\u0000 EI',
  ].join('\n');
  page.node.set(PDFName.of('Contents'), context.register(context.stream(content)));
  const appearance = context.register(
    context.stream('1 0 0 RG 0 0 5 5 re S', {
      Type: 'XObject',
      Subtype: 'Form',
      BBox: [0, 0, 5, 5],
    }),
  );
  page.node.set(
    PDFName.of('Annots'),
    context.obj([
      context.obj({
        Type: 'Annot',
        Subtype: 'Square',
        Rect: [0, 0, 5, 5],
        C: [1, 0, 0],
        AP: { N: appearance },
      }),
    ]),
  );
  return PDFDocument.load(await doc.save());
}

const pageText = (doc: PDFDocument): string =>
  new TextDecoder('latin1').decode(contentBytes(doc.getPage(0).node.Contents(), doc));

/** Stand in for the caller's image work: any gray pixels will do for these checks. */
function grayImages(
  doc: PDFDocument,
  images: { ref: PDFRef; width: number; height: number }[],
): void {
  for (const { ref, width, height } of images) {
    replaceImage(doc, ref, {
      data: new Uint8Array(width * height),
      filter: 'FlateDecode',
      space: 'DeviceGray',
      bits: 8,
      width,
      height,
    });
  }
}

describe('grayscaleDocument', () => {
  it('turns every colour to gray and leaves none behind', async () => {
    const doc = await colourful();
    expect(colourLeft(doc)).toBeGreaterThan(5);
    const result = grayscaleDocument(doc, GRAY);
    expect(result.skipped).toBe(0);
    // The RGB photo and the inline image need pixel work; the palette image was done here.
    expect(result.images.map((image) => [image.width, image.height])).toEqual([
      [2, 1],
      [1, 1],
    ]);
    grayImages(doc, result.images);
    const saved = await PDFDocument.load(await doc.save());
    expect(colourLeft(saved)).toBe(0);
    const text = pageText(saved);
    // Red is 0.299 gray (luminance); green 0.587; the spot ink and ICC blue convert too.
    expect(text).toContain('0.299 g 0.587 G 0 0 50 50 re B');
    expect(text).toContain('/NFInline1 Do');
    expect(text).not.toMatch(/ (rg|RG|k|K|cs|CS|sc|SC)\b/);
  });

  it('makes text black and everything else black or white in the black-and-white mode', async () => {
    const doc = await colourful();
    const result = grayscaleDocument(doc, { ...GRAY, mode: 'bw' });
    grayImages(doc, result.images);
    const text = pageText(doc);
    // Red fill and green stroke are dark: black. The light spot tint becomes white.
    expect(text).toContain('0 g 0 G 0 0 50 50 re B');
    expect(text).toContain('1 g 1 g');
    // Text is black; it starts white only because the colour set before it is near white.
    expect(text).toContain('BT 1 g 0 G /F1 12 Tf 0 g (Hello) Tj ET 0 g 0 G');
  });

  it('keeps some colour at lower strength', async () => {
    const doc = await colourful();
    grayscaleDocument(doc, { ...GRAY, strength: 0.5 });
    expect(pageText(doc)).toContain('0.6495 0.1495 0.1495 rg');
  });

  it('gives gradients a gray function and palettes gray entries', async () => {
    const doc = await colourful();
    grayscaleDocument(doc, GRAY);
    const resources = doc.getPage(0).node.Resources();
    const shading = resources?.lookup(PDFName.of('Shading'));
    const sh = (
      shading as unknown as { lookup(n: PDFName): { lookup(n: PDFName): unknown } }
    ).lookup(PDFName.of('Sh'));
    expect(sh.lookup(PDFName.of('ColorSpace'))).toBe(PDFName.of('DeviceGray'));
    const fn = sh.lookup(PDFName.of('Function'));
    expect(fn).toBeInstanceOf(PDFRawStream);
    const samples = decodePDFRawStream(fn as PDFRawStream).decode();
    // From red (0.299) to blue (0.114).
    expect(samples[0]).toBe(76);
    expect(samples[255]).toBe(29);
  });
});
