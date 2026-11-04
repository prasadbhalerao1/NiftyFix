import { readFileSync } from 'node:fs';
import { PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { openPdfTool, runAndDownload, type PdfFile } from './pdf-helpers';

const PATH = '/pdf/pdf-metadata/';

async function withMetadata(): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  doc.addPage([300, 300]);
  doc.setTitle('Draft report');
  doc.setAuthor('Ravi Kumar');
  doc.setSubject('Quarterly numbers');
  doc.catalog.set(
    PDFName.of('Metadata'),
    doc.context.register(doc.context.stream('<x:xmpmeta>Ravi Kumar</x:xmpmeta>')),
  );
  return { name: 'report.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

test.describe('PDF Metadata Editor', () => {
  test('shows the current details and saves edits', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await withMetadata());
    await expect(frame.getByTestId('meta-title')).toHaveValue('Draft report');
    await expect(frame.getByTestId('meta-author')).toHaveValue('Ravi Kumar');
    await frame.getByTestId('meta-title').fill('Final report');
    await frame.getByTestId('meta-author').fill('');
    const { doc } = await runAndDownload(page, frame);
    expect(doc.getTitle()).toBe('Final report');
    expect(doc.getAuthor() ?? '').toBe('');
    expect(doc.getSubject()).toBe('Quarterly numbers');
  });

  test('removes all metadata, leaving no trace of it in the file', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await withMetadata());
    await expect(frame.getByTestId('metadata-loaded')).toBeVisible();
    await frame.getByTestId('remove-all').click();
    await expect(frame.getByTestId('remove-notice')).toBeVisible();
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await expect(
      frame.getByTestId('validation-report').locator('[data-status="fail"]'),
    ).toHaveCount(0);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download').click(),
    ]);
    const bytes = readFileSync(await download.path());
    // Not just hidden from the fields: the name is nowhere in the file's bytes.
    expect(bytes.includes('Ravi Kumar')).toBe(false);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getTitle() ?? '').toBe('');
    expect(doc.catalog.get(PDFName.of('Metadata'))).toBeUndefined();
  });
});
