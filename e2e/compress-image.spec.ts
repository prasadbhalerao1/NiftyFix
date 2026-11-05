import { readFileSync, statSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { chooseFile, fixture } from './helpers';
import { openPdfTool } from './pdf-helpers';

const PATH = '/image/compress-image/';
const CHOOSE = /Choose an image/;

/** Run the tool, download the result, and measure it in Node, independent of the tool's report. */
async function compress(page: Page, frame: FrameLocator): Promise<{ name: string; bytes: Buffer }> {
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

test.describe('Compress Image', () => {
  test('Recommended makes a large photo smaller at the same dimensions', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await chooseFile(frame, 'images/large-4000x3000.jpg');
    const { name, bytes } = await compress(page, frame);
    expect(name).toBe('large-4000x3000-compressed.jpg');
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 4000, height: 3000 });
    expect(bytes.length).toBeLessThan(statSync(fixture('images/large-4000x3000.jpg')).size);
  });

  test('the 50 KB page meets the limit, reducing pixels when it must', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/compress-image-to-50kb/', CHOOSE);
    await chooseFile(frame, 'images/large-4000x3000.jpg');
    await expect(frame.getByTestId('target-size')).toHaveValue('50');
    const { bytes } = await compress(page, frame);
    expect(bytes.length).toBeLessThanOrEqual(50_000);
    const header = readImageHeader(bytes);
    expect(header?.format).toBe('jpeg');
    // The aspect ratio is kept when the image is scaled down.
    expect(Math.abs((header?.width ?? 0) / (header?.height ?? 1) - 4 / 3)).toBeLessThan(0.01);
    await expect(frame.getByTestId('result')).toContainText('made smaller');
  });

  test('keeps transparency by saving a transparent PNG as WebP', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await chooseFile(frame, 'images/transparent-800x800.png');
    const { name, bytes } = await compress(page, frame);
    expect(name).toBe('transparent-800x800-compressed.webp');
    expect(readImageHeader(bytes)).toEqual({ format: 'webp', width: 800, height: 800 });
  });

  test('applies the EXIF rotation, so the photo stays upright', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await chooseFile(frame, 'images/exif-rotated-6.jpg');
    const source = readImageHeader(readFileSync(fixture('images/exif-rotated-6.jpg')));
    const { bytes } = await compress(page, frame);
    // Orientation 6 is a quarter turn: stored width and height swap.
    expect(readImageHeader(bytes)).toEqual({
      format: 'jpeg',
      width: source?.height,
      height: source?.width,
    });
  });

  test('rejects a file that is not an image', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await chooseFile(frame, 'malicious/pdf-disguised.jpg');
    await expect(frame.getByTestId('error-view')).toBeVisible();
  });
});
