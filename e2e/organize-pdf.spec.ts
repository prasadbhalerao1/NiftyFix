import { expect, test } from '@playwright/test';
import { recordProblems } from './helpers';
import { makeLockedPdf, makePdf, openPdfTool, pageWidths, runAndDownload } from './pdf-helpers';

const PATH = '/pdf/organize-pdf/';
const CHOOSE = /Choose a PDF/;

test.describe('Organize PDF', () => {
  test('reorders, rotates and removes pages exactly as arranged', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('bundle.pdf', 4, 200));
    const cards = frame.getByTestId('page-card');
    await expect(cards).toHaveCount(4);
    // Thumbnails are really drawn (canvas sized by pdf.js, not the 300 × 150 default).
    await expect
      .poll(() =>
        cards
          .first()
          .locator('canvas')
          .evaluate((c: HTMLCanvasElement) => c.width),
      )
      .toBeGreaterThan(100);

    // Page 3 to the front, rotate page 4 right, remove page 2.
    await frame.getByRole('button', { name: 'Move Page 3 earlier' }).click();
    await frame.getByRole('button', { name: 'Move Page 3 earlier' }).click();
    await frame.getByRole('button', { name: 'Rotate Page 4 right' }).click();
    await frame.getByRole('button', { name: 'Remove Page 2' }).click();
    await expect(frame.getByTestId('page-summary')).toContainText('3 of 4 pages kept');
    await expect(cards.first()).toHaveAttribute('data-page', '3');

    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('bundle-organized.pdf');
    expect(pageWidths(doc)).toEqual([202, 200, 203]);
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([0, 0, 90]);
    expect(problems).toEqual([]);
  });

  test('a removed page can be restored, and reset undoes everything', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('doc.pdf', 2));
    await expect(frame.getByTestId('page-card')).toHaveCount(2);
    await frame.getByRole('button', { name: 'Remove Page 1' }).click();
    await frame.getByRole('button', { name: 'Remove Page 2' }).click();
    await expect(frame.getByTestId('prepare')).toBeDisabled();
    await expect(frame.getByText('Keep at least one page.')).toBeVisible();
    await frame.getByRole('button', { name: 'Restore Page 1' }).click();
    await expect(frame.getByTestId('prepare')).toBeEnabled();
    await frame.getByRole('button', { name: 'Reset' }).click();
    await expect(frame.getByTestId('page-summary')).toContainText('2 of 2 pages kept');
  });

  test('explains a password-protected PDF', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makeLockedPdf('locked.pdf'));
    await expect(frame.getByTestId('error-view')).toHaveAttribute(
      'data-error-code',
      'PASSWORD_PROTECTED',
    );
  });
});
