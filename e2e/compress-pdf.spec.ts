import { readFileSync } from 'node:fs';
import { PDFDocument } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { fixture } from './helpers';
import { makePdf, openPdfTool, runAndDownload, type PdfFile } from './pdf-helpers';

const PATH = '/pdf/compress-pdf/';
const CHOOSE = /Choose a PDF/;

/** A 2-page "scan": the 12 MP JPEG photo on each page, as phone scans usually are. */
async function scannedPdf(): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const photo = await doc.embedJpg(readFileSync(fixture('images/large-4000x3000.jpg')));
  for (let i = 0; i < 2; i += 1) {
    doc.addPage([842, 595]).drawImage(photo, { x: 0, y: 0, width: 842, height: 595 });
  }
  return { name: 'scan.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

test.describe('Compress PDF', () => {
  test('Recommended shrinks a scanned PDF and keeps every page', async ({ page }) => {
    const input = await scannedPdf();
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(input);
    const { name, doc, bytes } = await runAndDownload(page, frame);
    expect(name).toBe('scan-compressed.pdf');
    expect(doc.getPageCount()).toBe(2);
    expect(bytes.length).toBeLessThan(input.buffer.length * 0.8);
  });

  test('meets a target size', async ({ page }) => {
    const input = await scannedPdf();
    const target = Math.floor(input.buffer.length / 4 / 1000); // in KB
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(input);
    await frame.getByText('Target size', { exact: true }).click();
    await frame.getByText('KB', { exact: true }).click();
    await frame.getByTestId('target-size').fill(String(target));
    const { doc, bytes } = await runAndDownload(page, frame);
    expect(bytes.length).toBeLessThanOrEqual(target * 1000);
    expect(doc.getPageCount()).toBe(2);
  });

  test('says honestly when a text-only PDF is already compact', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('notes.pdf', 3));
    await frame.getByTestId('prepare').click();
    const error = frame.getByTestId('error-view');
    await expect(error).toHaveAttribute('data-error-code', 'TARGET_UNREACHABLE');
    await expect(error).toContainText('already compact');
  });
});
