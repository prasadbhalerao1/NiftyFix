import {
  decodePDFRawStream,
  degrees,
  PDFArray,
  PDFDocument,
  type PDFRawStream,
} from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { placeImage } from '../src';

const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAAD0lEQVR4nGP4z8DwnwEIABf2A/2IoRWBAAAAAElFTkSuQmCC',
  ),
  (c) => c.charCodeAt(0),
);

/** The `a b c d e f cm` matrix used to draw the image on a page. */
async function imageMatrix(rotation: number): Promise<number[]> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  page.setRotation(degrees(rotation));
  const image = await doc.embedPng(PNG);
  // Top-left quarter of the page as displayed, 20 % wide and 10 % high.
  placeImage(page, image, { x: 0.1, y: 0.05, width: 0.2, height: 0.1 });
  // Read the drawing instructions from the saved file, as a viewer would.
  const saved = await PDFDocument.load(await doc.save({ useObjectStreams: false }));
  const contents = saved.getPage(0).node.Contents();
  // A page's content may be several streams; a viewer reads them all in order.
  const streams =
    contents instanceof PDFArray
      ? Array.from({ length: contents.size() }, (_, i) => contents.lookup(i))
      : [contents];
  const text = streams
    .map((stream) => new TextDecoder().decode(decodePDFRawStream(stream as PDFRawStream).decode()))
    .join('\n');
  const draw = text.slice(0, text.indexOf(' Do'));
  if (draw.length === text.length || !draw) throw new Error(`no image draw in: ${text}`);
  // Concatenate every `cm` before the draw, as a viewer does: CTM' = M × CTM.
  let ctm = [1, 0, 0, 1, 0, 0];
  for (const match of draw.matchAll(/(\S+) (\S+) (\S+) (\S+) (\S+) (\S+) cm/g)) {
    const [a, b, c, d, e, f] = match.slice(1).map(Number) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
    const [A, B, C, D, E, F] = ctm as [number, number, number, number, number, number];
    ctm = [
      a * A + b * C,
      a * B + b * D,
      c * A + d * C,
      c * B + d * D,
      e * A + f * C + E,
      e * B + f * D + F,
    ];
  }
  return ctm.map((n) => Math.round(n * 10) / 10 + 0);
}

describe('placeImage', () => {
  it('upright page: bottom-left corner and size in page points', async () => {
    // Displayed 600 × 800: x = 60, top 40 ⇒ bottom = 800 − (0.05 + 0.1) × 800 = 680; 120 × 80.
    expect(await imageMatrix(0)).toEqual([120, 0, 0, 80, 60, 680]);
  });

  it('page stored rotated 90°: image is rotated with the page and lands top-left as displayed', async () => {
    // Displayed 800 × 600. Image 160 × 60, rotated 90° (cos 0, sin 1).
    const [a, b, c, d, e, f] = await imageMatrix(90);
    expect([a, b, c, d]).toEqual([0, 160, -60, 0]);
    // Displayed bottom-left (80, 510) maps to stored (600 − 510, 80).
    expect([e, f]).toEqual([90, 80]);
  });
});
