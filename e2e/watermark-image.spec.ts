import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { chooseFile } from './helpers';
import { openPdfTool } from './pdf-helpers';

test.describe('Watermark Image', () => {
  for (const position of ['bottom-right', 'tile'] as const) {
    test(`adds a ${position} watermark at the same size`, async ({ page }) => {
      const frame = await openPdfTool(page, '/image/watermark-image/', /Choose an image/);
      await chooseFile(frame, 'images/portrait-1200x1600.jpg');
      await frame.getByTestId('watermark-text').fill('For verification only');
      await frame.getByTestId('position').selectOption(position);
      await frame.getByTestId('prepare').click();
      await expect(frame.getByTestId('result')).toBeVisible({ timeout: 45_000 });
      await expect(
        frame.getByTestId('validation-report').locator('[data-status="fail"]'),
      ).toHaveCount(0);
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        frame.getByTestId('download').click(),
      ]);
      expect(download.suggestedFilename()).toBe('portrait-1200x1600-watermarked.jpg');
      const bytes = readFileSync(await download.path());
      expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 1200, height: 1600 });
    });
  }

  test('empty text is explained and blocks the button', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/watermark-image/', /Choose an image/);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByTestId('watermark-text').fill('');
    await expect(frame.getByText('Enter the watermark text.')).toBeVisible();
    await expect(frame.getByTestId('prepare')).toBeDisabled();
  });
});
