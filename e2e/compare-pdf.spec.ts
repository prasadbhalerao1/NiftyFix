import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';
import type { PdfFile } from './pdf-helpers';

async function agreement(name: string, rent: string): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([400, 300]).drawText('Rental agreement', { x: 40, y: 250, size: 18, font });
  const page = doc.addPage([400, 300]);
  page.drawText(`Rent is ${rent} per month.`, { x: 40, y: 200, size: 14, font });
  page.drawText('Deposit is two months.', { x: 40, y: 170, size: 14, font });
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

test.describe('Compare PDFs', () => {
  test('highlights the changed words and shows which page looks different', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/pdf/compare-pdf/');
    const frame = toolFrame(page);
    await frame
      .getByTestId('file-input')
      .first()
      .setInputFiles(await agreement('v1.pdf', '15000'));
    await frame
      .getByTestId('file-input')
      .first()
      .setInputFiles(await agreement('v2.pdf', '18000'));
    await expect(frame.getByTestId('text-summary')).toContainText('1 words added · 1 removed', {
      timeout: 30_000,
    });
    const diff = frame.getByTestId('text-diff');
    await expect(diff.locator('[data-change]')).toHaveText(['Removed: 15000 ', 'Added: 18000 ']);
    await frame.getByText('Visual changes', { exact: true }).click();
    await expect(frame.getByTestId('visual-page')).toContainText('Page 1 of 2 · no change', {
      timeout: 30_000,
    });
    await frame.getByText('Check every page').click();
    await expect(frame.getByTestId('changed-pages')).toHaveText('Page 2', { timeout: 30_000 });
    expect(problems).toEqual([]);
  });

  test('says when the text is identical', async ({ page }) => {
    await page.goto('/pdf/compare-pdf/');
    const frame = toolFrame(page);
    await frame
      .getByTestId('file-input')
      .first()
      .setInputFiles(await agreement('a.pdf', '15000'));
    await frame
      .getByTestId('file-input')
      .first()
      .setInputFiles(await agreement('b.pdf', '15000'));
    await expect(frame.getByText('The text of both PDFs is identical.')).toBeVisible({
      timeout: 30_000,
    });
  });
});
