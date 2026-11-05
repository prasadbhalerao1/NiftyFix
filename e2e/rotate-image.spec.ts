import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { chooseFile } from './helpers';
import { openPdfTool } from './pdf-helpers';

const PATH = '/image/rotate-image/';
const CHOOSE = /Choose an image/;

test.describe('Rotate and Flip Image', () => {
  test('a quarter turn swaps width and height', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await chooseFile(frame, 'images/landscape-webp-1000x700.webp');
    await expect(frame.getByTestId('rotate-preview')).toBeVisible();
    await expect(frame.getByTestId('turn')).toHaveText('Rotated 90° clockwise');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 45_000 });
    await expect(
      frame.getByTestId('validation-report').locator('[data-status="fail"]'),
    ).toHaveCount(0);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download').click(),
    ]);
    expect(download.suggestedFilename()).toBe('landscape-webp-1000x700-rotated.webp');
    expect(readImageHeader(readFileSync(await download.path()))).toEqual({
      format: 'webp',
      width: 700,
      height: 1000,
    });
  });

  test('back to no change asks for a rotation first', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByTestId('rotate-left').click();
    await expect(frame.getByTestId('turn')).toHaveText('Not rotated');
    await expect(frame.getByTestId('prepare')).toBeDisabled();
    await frame.getByTestId('flip-horizontal').check();
    await expect(frame.getByTestId('prepare')).toBeEnabled();
  });

  test('turns and mirrors the pixels in the expected direction', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    // A 40 × 20 PNG: left half red, right half green.
    const png = await page.evaluate(async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 20;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(0, 0, 20, 20);
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(20, 0, 20, 20);
      return canvas.toDataURL('image/png').split(',')[1]!;
    });
    await frame.getByTestId('file-input').setInputFiles({
      name: 'halves.png',
      mimeType: 'image/png',
      buffer: Buffer.from(png, 'base64'),
    });
    // Right a quarter turn puts the left (red) half on top; mirroring top to bottom puts it below.
    await frame.getByTestId('flip-vertical').check();
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 45_000 });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download').click(),
    ]);
    const bytes = readFileSync(await download.path()).toString('base64');
    const [top, bottom] = await page.evaluate(async (data) => {
      // (The site's CSP blocks fetching data: URLs, so decode the bytes directly.)
      const raw = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      const blob = new Blob([raw], { type: 'image/png' });
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const at = (y: number): number[] => [...ctx.getImageData(10, y, 1, 1).data.slice(0, 3)];
      return [at(5), at(35)];
    }, bytes);
    expect(top).toEqual([0, 255, 0]);
    expect(bottom).toEqual([255, 0, 0]);
  });
});
