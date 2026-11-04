import { readFileSync } from 'node:fs';
import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { expect, type FrameLocator, type Page } from '@playwright/test';

/**
 * PDF fixtures built in Node, and independent inspection of downloaded PDFs.
 * Page i of a fixture is (base + i) points wide, so tests can tell exactly
 * which source page ended up where.
 */
export interface PdfFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

export async function makePdf(name: string, pages: number, base = 200): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i += 1) {
    doc
      .addPage([base + i, 400])
      .drawText(`${name} page ${i + 1}`, { x: 20, y: 200, size: 12, font });
  }
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

export async function makeLockedPdf(name: string): Promise<PdfFile> {
  const doc = await PDFDocument.load((await makePdf(name, 1)).buffer);
  doc.encrypt({ userPassword: 'secret', ownerPassword: 'owner' });
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

export const notAPdf = (name: string): PdfFile => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from('This is plain text pretending to be a PDF.'),
});

export async function openPdfTool(page: Page, path: string, button: RegExp): Promise<FrameLocator> {
  await page.goto(path);
  const frame = page.frameLocator('iframe[data-tool-frame]');
  await expect(frame.getByRole('button', { name: button })).toBeVisible();
  return frame;
}

/** Run the tool, download the result, and parse it in Node — independent of the tool's report. */
export async function runAndDownload(
  page: Page,
  frame: FrameLocator,
): Promise<{ name: string; doc: PDFDocument; bytes: Buffer }> {
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
  const report = frame.getByTestId('validation-report');
  await expect(report.locator('[data-status="fail"]')).toHaveCount(0);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  const bytes = readFileSync(await download.path());
  expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  return { name: download.suggestedFilename(), doc: await PDFDocument.load(bytes), bytes };
}

export const pageWidths = (doc: PDFDocument): number[] =>
  doc.getPages().map((page) => Math.round(page.getWidth()));
