import { readFileSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { chooseFile } from './helpers';
import { openPdfTool } from './pdf-helpers';

const CHOOSE = /Choose an image/;

/** Run the tool, download the result, and read it in Node, independent of the tool's report. */
async function convert(page: Page, frame: FrameLocator): Promise<{ name: string; bytes: Buffer }> {
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

test.describe('Convert Image', () => {
  test('PNG to JPG fills transparency and says so', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/png-to-jpg/', CHOOSE);
    await chooseFile(frame, 'images/transparent-800x800.png');
    const { name, bytes } = await convert(page, frame);
    expect(name).toBe('transparent-800x800.jpg');
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 800, height: 800 });
    await expect(frame.getByTestId('result')).toContainText('filled with white');
  });

  test('WebP to PNG keeps the pixel size', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/webp-to-png/', CHOOSE);
    await chooseFile(frame, 'images/landscape-webp-1000x700.webp');
    const { name, bytes } = await convert(page, frame);
    expect(name).toBe('landscape-webp-1000x700.png');
    expect(readImageHeader(bytes)).toEqual({ format: 'png', width: 1000, height: 700 });
  });

  test('JPG to WebP from the main page', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/convert-image/', CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByText('WebP', { exact: true }).click();
    const { bytes } = await convert(page, frame);
    expect(readImageHeader(bytes)).toEqual({ format: 'webp', width: 1200, height: 1600 });
  });
});
