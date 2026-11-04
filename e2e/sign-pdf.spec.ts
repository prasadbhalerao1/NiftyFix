import { PDFDict, PDFName, type PDFDocument } from '@cantoo/pdf-lib';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { fixture, recordProblems } from './helpers';
import { makePdf, openPdfTool, runAndDownload } from './pdf-helpers';

const PATH = '/pdf/sign-pdf/';
const CHOOSE = /Choose a PDF to sign/;

const images = (doc: PDFDocument, index: number): number => {
  const xobjects = doc.getPage(index).node.Resources()?.lookup(PDFName.of('XObject'));
  return xobjects instanceof PDFDict ? xobjects.keys().length : 0;
};

/** Draw a zig-zag signature on the pad with real pointer movements. */
async function draw(page: Page, frame: FrameLocator): Promise<void> {
  const pad = frame.getByTestId('signature-pad');
  // On phones the pad sits below the page preview; a person scrolls to it first.
  await pad.scrollIntoViewIfNeeded();
  const box = await pad.boundingBox();
  if (!box) throw new Error('no pad');
  await page.mouse.move(box.x + 30, box.y + 100);
  await page.mouse.down();
  for (let i = 1; i <= 8; i += 1) {
    await page.mouse.move(box.x + 30 + i * 30, box.y + (i % 2 ? 40 : 110), { steps: 4 });
  }
  await page.mouse.up();
}

test.describe('Sign PDF', () => {
  test('draws a signature and places it on the chosen page only', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('contract.pdf', 3));
    await expect(frame.getByTestId('page-indicator')).toContainText('Page 1 of 3');
    await draw(page, frame);
    await expect(frame.getByTestId('signature-box')).toBeVisible();
    // Go to page 2 and nudge the signature with the keyboard.
    await frame.getByRole('button', { name: 'Next page' }).click();
    await expect(frame.getByTestId('page-indicator')).toContainText('Page 2 of 3');
    await frame.getByTestId('signature-box').focus();
    await page.keyboard.press('ArrowUp');
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('contract-signed.pdf');
    expect([images(doc, 0), images(doc, 1), images(doc, 2)]).toEqual([0, 1, 0]);
    expect(problems).toEqual([]);
  });

  test('uploads a signature photo, cleans it, and signs every page', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('form.pdf', 2));
    await expect(frame.getByTestId('page-indicator')).toBeVisible();
    await frame.getByText('Upload a photo', { exact: true }).click();
    await frame
      .getByTestId('file-input')
      .last()
      .setInputFiles(fixture('signatures/white-black.jpg'));
    await expect(frame.getByAltText('Your cleaned signature')).toBeVisible();
    await frame.getByText('All 2 pages', { exact: true }).click();
    const { doc } = await runAndDownload(page, frame);
    expect([images(doc, 0), images(doc, 1)]).toEqual([1, 1]);
  });

  test('cannot sign before a signature exists', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('doc.pdf', 1));
    await expect(frame.getByTestId('prepare')).toBeDisabled();
    await expect(frame.getByText('Draw or upload your signature')).toBeVisible();
  });
});
