import { readFileSync } from 'node:fs';
import { PDFDocument } from '@cantoo/pdf-lib';
import { unzipSync } from 'fflate';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { readFixture, recordProblems } from './helpers';
import { makePdf, openPdfTool, type PdfFile } from './pdf-helpers';

const JPEG = readFixture('images/portrait-1200x1600.jpg');
const PNG = readFixture('images/transparent-800x800.png');
/** 2 × 1 pixels, an icon-sized image. */
const SPECK = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAAD0lEQVR4nGP4z8DwnwEIABf2A/2IoRWBAAAAAElFTkSuQmCC',
  'base64',
);

/**
 * Page 1: the photo and a speck. Page 2: the transparent PNG and the photo
 * embedded a second time (a separate copy with identical bytes). Page 3: text only.
 */
async function brochure(): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const first = doc.addPage([600, 800]);
  first.drawImage(await doc.embedJpg(JPEG), { x: 0, y: 0, width: 300, height: 400 });
  first.drawImage(await doc.embedPng(SPECK), { x: 400, y: 400, width: 20, height: 10 });
  const second = doc.addPage([600, 800]);
  second.drawImage(await doc.embedPng(PNG), { x: 0, y: 0, width: 200, height: 200 });
  second.drawImage(await doc.embedJpg(JPEG), { x: 300, y: 0, width: 150, height: 200 });
  doc.addPage([600, 800]);
  return {
    name: 'brochure.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await doc.save()),
  };
}

async function extract(page: Page, frame: FrameLocator, file: PdfFile): Promise<void> {
  await frame.getByTestId('file-input').setInputFiles(file);
  await expect(frame.getByTestId('chosen-file')).toContainText(file.name);
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
  await expect(frame.getByTestId('validation-report').locator('[data-status="fail"]')).toHaveCount(
    0,
  );
}

async function save(page: Page, button: ReturnType<FrameLocator['getByTestId']>) {
  const [file] = await Promise.all([page.waitForEvent('download'), button.click()]);
  return { name: file.suggestedFilename(), bytes: readFileSync(await file.path()) };
}

test.describe('Extract Images from PDF', () => {
  test('saves each image once at original quality, skipping icons', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/pdf/extract-pdf-images/', /Choose a PDF/);
    await extract(page, frame, await brochure());
    await expect(frame.getByTestId('result')).toContainText('Repeats skipped');
    const { name, bytes } = await save(page, frame.getByTestId('download'));
    expect(name).toBe('brochure-images.zip');
    const entries = unzipSync(new Uint8Array(bytes));
    expect(Object.keys(entries)).toEqual([
      'brochure-page-1-image-1.jpg',
      'brochure-page-2-image-1.png',
    ]);
    // The JPEG is the exact file that was put into the PDF.
    expect(Buffer.from(entries['brochure-page-1-image-1.jpg'] ?? [])).toEqual(JPEG);
    expect(readImageHeader(entries['brochure-page-2-image-1.png'] ?? new Uint8Array())).toEqual({
      format: 'png',
      width: 800,
      height: 800,
    });
    expect(problems).toEqual([]);
  });

  test('downloads only the images ticked in the gallery', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/extract-pdf-images/', /Choose a PDF/);
    await extract(page, frame, await brochure());
    const gallery = frame.getByTestId('image-gallery');
    await expect(gallery.locator('img')).toHaveCount(2);
    await gallery.getByRole('checkbox', { name: 'brochure-page-1-image-1.jpg' }).uncheck();
    const { name, bytes } = await save(page, frame.getByTestId('download-selected'));
    expect(name).toBe('brochure-page-2-image-1.png');
    expect(readImageHeader(bytes)?.format).toBe('png');
  });

  test('the photo page explains a PDF with no pictures in it', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/extract-photo-from-pdf/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('letter.pdf', 2));
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText(
      'No images were found on the chosen pages.',
    );
    await expect(frame.getByTestId('error-view')).toContainText('PDF to JPG');
  });
});
