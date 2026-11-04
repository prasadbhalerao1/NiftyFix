import { readFileSync } from 'node:fs';
import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { unzipSync } from 'fflate';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { recordProblems } from './helpers';
import { makePdf, openPdfTool, type PdfFile } from './pdf-helpers';

async function choose(frame: FrameLocator, file: PdfFile): Promise<void> {
  await frame.getByTestId('file-input').setInputFiles(file);
  await expect(frame.getByTestId('chosen-file')).toContainText(file.name);
}

async function download(page: Page, frame: FrameLocator): Promise<{ name: string; bytes: Buffer }> {
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 60_000 });
  await expect(frame.getByTestId('validation-report').locator('[data-status="fail"]')).toHaveCount(
    0,
  );
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  return { name: file.suggestedFilename(), bytes: readFileSync(await file.path()) };
}

/** A page with big black text in a non-embedded standard font (needs pdf.js standard_fonts). */
async function textPdf(): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.addPage([300, 200]).drawText('NIFTY', { x: 20, y: 70, size: 72, font });
  return { name: 'text.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

/** Fraction of dark pixels in an image, decoded in the browser. */
async function darkFraction(page: Page, bytes: Buffer, mime: string): Promise<number> {
  return page.evaluate(
    async ({ data, mime }) => {
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)], { type: mime }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no context');
      ctx.drawImage(bitmap, 0, 0);
      const { data: px } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      let dark = 0;
      for (let i = 0; i < px.length; i += 4) if ((px[i] ?? 255) < 100) dark += 1;
      return dark / (bitmap.width * bitmap.height);
    },
    { data: [...bytes], mime },
  );
}

test.describe('PDF to JPG / PNG', () => {
  test('renders every page at the chosen DPI into a ZIP', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/pdf/pdf-to-image/', /Choose a PDF/);
    await choose(frame, await makePdf('deck.pdf', 3, 200));
    await frame.getByText('72 DPI', { exact: true }).click();
    const { name, bytes } = await download(page, frame);
    expect(name).toBe('deck-images.zip');
    const entries = unzipSync(new Uint8Array(bytes));
    expect(Object.keys(entries)).toEqual(['deck-page-1.jpg', 'deck-page-2.jpg', 'deck-page-3.jpg']);
    // At 72 DPI one point is one pixel: page i is (200 + i) × 400.
    Object.values(entries).forEach((data, i) => {
      expect(readImageHeader(data)).toEqual({ format: 'jpeg', width: 200 + i, height: 400 });
    });
    expect(problems).toEqual([]);
  });

  test('a single page downloads as one PNG with its text drawn', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/pdf-to-image/', /Choose a PDF/);
    await choose(frame, await textPdf());
    await frame.getByText('PNG', { exact: true }).click();
    const { name, bytes } = await download(page, frame);
    expect(name).toBe('text-page-1.png');
    // 150 DPI: 300 × 200 pt → 625 × 416 px.
    expect(readImageHeader(bytes)).toEqual({ format: 'png', width: 625, height: 416 });
    // The text must actually be drawn: a blank white page would pass every size check.
    const dark = await darkFraction(page, bytes, 'image/png');
    expect(dark).toBeGreaterThan(0.05);
    expect(dark).toBeLessThan(0.6);
  });

  test('converts only the chosen pages', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/pdf-to-image/', /Choose a PDF/);
    await choose(frame, await makePdf('deck.pdf', 5, 200));
    await frame.getByText('72 DPI', { exact: true }).click();
    await frame.getByText('Choose pages', { exact: true }).click();
    await frame.getByTestId('page-ranges').fill('2, 4');
    const { bytes } = await download(page, frame);
    expect(Object.keys(unzipSync(new Uint8Array(bytes)))).toEqual([
      'deck-page-2.jpg',
      'deck-page-4.jpg',
    ]);
  });

  test('explains a damaged PDF', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/pdf-to-image/', /Choose a PDF/);
    const good = await makePdf('broken.pdf', 2);
    await frame.getByTestId('file-input').setInputFiles({
      ...good,
      buffer: good.buffer.subarray(0, Math.floor(good.buffer.length / 3)),
    });
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toHaveAttribute(
      'data-error-code',
      'CORRUPT_INPUT',
    );
  });
});
