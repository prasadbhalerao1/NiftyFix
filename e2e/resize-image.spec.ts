import { readFileSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { jpegDpi } from '../packages/engines/image/src/jfif';
import { readImageHeader } from '../packages/engines/image/src/header';
import { chooseFile } from './helpers';
import { openPdfTool } from './pdf-helpers';

const PATH = '/image/resize-image/';
const CHOOSE = /Choose an image/;

/** Run the tool, download the result, and read it in Node, independent of the tool's report. */
async function resize(page: Page, frame: FrameLocator): Promise<{ name: string; bytes: Buffer }> {
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 45_000 });
  await expect(frame.getByTestId('validation-report').locator('[data-status="fail"]')).toHaveCount(
    0,
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  return { name: download.suggestedFilename(), bytes: readFileSync(await download.path()) };
}

test.describe('Resize Image', () => {
  test('keeps proportions when only the width changes', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await chooseFile(frame, 'images/large-4000x3000.jpg');
    await expect(frame.getByTestId('source-size')).toContainText('4000 × 3000');
    await frame.getByTestId('width').fill('1200');
    await expect(frame.getByTestId('height')).toHaveValue('900');
    const { name, bytes } = await resize(page, frame);
    expect(name).toBe('large-4000x3000-1200x900.jpg');
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 1200, height: 900 });
  });

  test('crops to a new shape and keeps PNG transparency', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await chooseFile(frame, 'images/transparent-800x800.png');
    await frame.getByTestId('keep-proportions').uncheck();
    await frame.getByTestId('width').fill('400');
    await frame.getByTestId('height').fill('200');
    const { bytes } = await resize(page, frame);
    expect(readImageHeader(bytes)).toEqual({ format: 'png', width: 400, height: 200 });
  });

  test('the cm page converts at the DPI and writes it into the JPG', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/resize-image-in-cm/', CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByTestId('keep-proportions').uncheck();
    await frame.getByTestId('width').fill('3.5');
    await frame.getByTestId('height').fill('4.5');
    await frame.getByTestId('dpi').fill('300');
    await expect(frame.getByTestId('output-size')).toContainText('413 × 531');
    const { bytes } = await resize(page, frame);
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 413, height: 531 });
    expect(jpegDpi(bytes)).toBe(300);
  });

  test('scales by a percentage', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await chooseFile(frame, 'images/landscape-webp-1000x700.webp');
    await frame.getByTestId('unit').selectOption('percent');
    await frame.getByTestId('percent').fill('50');
    const { bytes } = await resize(page, frame);
    expect(readImageHeader(bytes)).toEqual({ format: 'webp', width: 500, height: 350 });
  });
});
