import { degrees, PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { cropPage, fitPageToPaper, PAPER_SIZES } from '../src';

async function page(width: number, height: number, rotation = 0) {
  const doc = await PDFDocument.create();
  const p = doc.addPage([width, height]);
  p.setRotation(degrees(rotation));
  return p;
}
const box = (b: { x: number; y: number; width: number; height: number }) =>
  [b.x, b.y, b.width, b.height].map((n) => Math.round(n * 100) / 100);

describe('cropPage', () => {
  it('trims displayed margins on an upright page', async () => {
    const p = await page(600, 800);
    expect(cropPage(p, { top: 10, right: 20, bottom: 30, left: 40 })).toBe(true);
    expect(box(p.getCropBox())).toEqual([40, 30, 540, 760]);
  });

  it('maps displayed edges to stored edges on rotated pages', async () => {
    // Displayed top must be trimmed whatever the stored rotation.
    const p90 = await page(600, 800, 90);
    cropPage(p90, { top: 50, right: 0, bottom: 0, left: 0 });
    expect(box(p90.getCropBox())).toEqual([50, 0, 550, 800]); // stored left edge
    const p180 = await page(600, 800, 180);
    cropPage(p180, { top: 50, right: 0, bottom: 0, left: 0 });
    expect(box(p180.getCropBox())).toEqual([0, 50, 600, 750]); // stored bottom edge
    const p270 = await page(600, 800, 270);
    cropPage(p270, { top: 50, right: 0, bottom: 0, left: 0 });
    expect(box(p270.getCropBox())).toEqual([0, 0, 550, 800]); // stored right edge
  });

  it('refuses a crop that leaves almost nothing, leaving the page unchanged', async () => {
    const p = await page(600, 800);
    expect(cropPage(p, { top: 0, right: 300, bottom: 0, left: 290 })).toBe(false);
    expect(box(p.getCropBox())).toEqual([0, 0, 600, 800]);
  });
});

describe('fitPageToPaper', () => {
  it('scales a Letter page onto A4 portrait, centred, without distortion', async () => {
    const p = await page(612, 792);
    fitPageToPaper(p, PAPER_SIZES.a4);
    const media = p.getMediaBox();
    expect([media.width, media.height].map(Math.round)).toEqual([595, 842]);
    // Content scaled uniformly by min(595.28/612, 841.89/792) and centred.
    const scale = 595.28 / 612;
    expect(media.x).toBeCloseTo(0, 3);
    expect(media.y).toBeCloseTo(-(841.89 - 792 * scale) / 2, 3);
  });

  it('keeps a landscape page landscape', async () => {
    const p = await page(1000, 500);
    fitPageToPaper(p, PAPER_SIZES.a4);
    const media = p.getMediaBox();
    expect(Math.round(media.width)).toBe(842);
    expect(Math.round(media.height)).toBe(595);
  });

  it('respects a stored rotation (portrait as displayed stays portrait)', async () => {
    // Stored landscape, rotated 90° ⇒ displayed portrait ⇒ stored box must stay landscape.
    const p = await page(800, 600, 90);
    fitPageToPaper(p, PAPER_SIZES.a4);
    const media = p.getMediaBox();
    expect(Math.round(media.width)).toBe(842);
    expect(Math.round(media.height)).toBe(595);
  });
});
