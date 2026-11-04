import { expect, test } from '@playwright/test';
import { recordProblems } from './helpers';
import {
  makeLockedPdf,
  makePdf,
  notAPdf,
  openPdfTool,
  pageWidths,
  runAndDownload,
} from './pdf-helpers';

const PATH = '/pdf/merge-pdf/';
const CHOOSE = /Choose PDF files/;

test.describe('Merge PDF', () => {
  test('merges files in the chosen order, verified independently', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame
      .getByTestId('file-input')
      .setInputFiles([await makePdf('a.pdf', 2, 200), await makePdf('b.pdf', 3, 300)]);
    await expect(frame.getByTestId('queued-file')).toHaveCount(2);
    // Add a third file later, then move it to the front.
    await frame.getByTestId('file-input').setInputFiles([await makePdf('c.pdf', 1, 500)]);
    await expect(frame.getByTestId('queued-file')).toHaveCount(3);
    await frame.getByRole('button', { name: 'Move c.pdf up' }).click();
    await frame.getByRole('button', { name: 'Move c.pdf up' }).click();
    await expect(frame.getByTestId('queued-file').first()).toContainText('c.pdf');

    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('c-merged.pdf');
    expect(pageWidths(doc)).toEqual([500, 200, 201, 300, 301, 302]);
    expect(problems).toEqual([]);
  });

  test('uses a custom file name and supports removing a file', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame
      .getByTestId('file-input')
      .setInputFiles([
        await makePdf('a.pdf', 1, 200),
        await makePdf('b.pdf', 1, 300),
        await makePdf('c.pdf', 1, 400),
      ]);
    await frame.getByRole('button', { name: 'Remove b.pdf' }).click();
    await frame.getByTestId('file-name').fill('application pack');
    const { name, doc } = await runAndDownload(page, frame);
    // WebKit on Linux replaces spaces in download names with underscores; the name we set has a space.
    expect(name.replaceAll('_', ' ')).toBe('application pack.pdf');
    expect(pageWidths(doc)).toEqual([200, 400]);
  });

  test('needs at least two files', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles([await makePdf('only.pdf', 1)]);
    await expect(frame.getByTestId('prepare')).toBeDisabled();
    await expect(frame.getByText('Add at least 2 PDFs.')).toBeVisible();
  });

  test('rejects fake and damaged PDFs by name, keeping the good ones', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame
      .getByTestId('file-input')
      .setInputFiles([await makePdf('good.pdf', 1), notAPdf('fake.pdf')]);
    await expect(frame.getByTestId('queued-file')).toHaveCount(1);
    await expect(frame.getByTestId('rejected-files')).toContainText('fake.pdf');
  });

  test('explains a password-protected file instead of failing silently', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame
      .getByTestId('file-input')
      .setInputFiles([await makePdf('open.pdf', 1), await makeLockedPdf('locked.pdf')]);
    await frame.getByTestId('prepare').click();
    const error = frame.getByTestId('error-view');
    await expect(error).toHaveAttribute('data-error-code', 'PASSWORD_PROTECTED');
    await expect(error).toContainText('"locked.pdf" is protected with a password');
  });
});
