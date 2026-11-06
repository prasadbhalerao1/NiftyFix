import { inflateSync } from 'node:zlib';
import { degrees, PDFDocument, PDFRawStream, StandardFonts } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { openPdfTool, runAndDownload, type PdfFile } from './pdf-helpers';
import { recordProblems } from './helpers';

const CHOOSE = /Choose a PDF/;

/** A4 portrait pages labelled 1..n; `rotated` pages carry /Rotate 90. */
async function a4Pdf(pages: number, rotated: readonly number[] = []): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i += 1) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(`Page ${i + 1}`, { x: 50, y: 780, size: 28, font });
    if (rotated.includes(i)) page.setRotation(degrees(90));
  }
  return { name: 'notes.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

/** Decoded content stream of a sheet, to see how each page was placed. */
function sheetContent(doc: PDFDocument, index: number): string {
  const contents = doc.getPage(index).node.Contents();
  const streams = contents && 'asArray' in contents ? contents.asArray() : [contents];
  return streams
    .map((ref) => doc.context.lookup(ref as never))
    .filter((stream): stream is PDFRawStream => stream instanceof PDFRawStream)
    .map((stream) => {
      const raw = Buffer.from(stream.contents);
      try {
        return inflateSync(raw).toString('latin1');
      } catch {
        return raw.toString('latin1');
      }
    })
    .join('\n');
}

test.describe('Pages per Sheet and Booklet', () => {
  test('2 per sheet puts portrait pages side by side on landscape A4', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/pdf/pages-per-sheet/', CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await a4Pdf(5));
    await expect(frame.getByTestId('sheet-diagram')).toBeVisible();
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('notes-2-per-sheet.pdf');
    expect(doc.getPageCount()).toBe(3);
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(842);
    expect(Math.round(height)).toBe(595);
    expect(problems).toEqual([]);
  });

  test('4 per sheet shows a rotated page upright', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/pages-per-sheet/', CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await a4Pdf(4, [1]));
    await frame.getByText('4', { exact: true }).click();
    const { doc } = await runAndDownload(page, frame);
    expect(doc.getPageCount()).toBe(1);
    // The /Rotate 90 page is turned a quarter clockwise (matrix ~0 -1 1 ~0); the others are not.
    const turns = sheetContent(doc, 0).match(/ -1 1 [0-9.e-]+ 0 0 cm/g) ?? [];
    expect(turns).toHaveLength(1);
  });

  test('booklet page pads 5 pages to 8 and makes 4 sides', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/pdf-booklet/', CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await a4Pdf(5));
    const { doc } = await runAndDownload(page, frame);
    expect(doc.getPageCount()).toBe(4);
    await expect(frame.getByText(/3 blank pages were added/)).toBeVisible();
  });
});
