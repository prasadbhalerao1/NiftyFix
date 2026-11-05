import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { chooseFile } from './helpers';
import { openPdfTool } from './pdf-helpers';

test.describe('Crop Image', () => {
  test('a square crop produces a square at the selected pixel size', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/crop-image/', /Choose an image/);
    await chooseFile(frame, 'images/large-4000x3000.jpg');
    await frame.getByTestId('shape').selectOption('1:1');
    await expect(frame.getByTestId('crop-size')).toHaveText('Selection: 3000 × 3000 px');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 45_000 });
    await expect(
      frame.getByTestId('validation-report').locator('[data-status="fail"]'),
    ).toHaveCount(0);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download').click(),
    ]);
    expect(download.suggestedFilename()).toBe('large-4000x3000-cropped.jpg');
    expect(readImageHeader(readFileSync(await download.path()))).toEqual({
      format: 'jpeg',
      width: 3000,
      height: 3000,
    });
  });

  test('the slider resizes the selection', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/crop-image/', /Choose an image/);
    await chooseFile(frame, 'images/transparent-800x800.png');
    await expect(frame.getByTestId('crop-size')).toHaveText('Selection: 720 × 720 px');
    await frame.getByRole('slider').first().fill('50');
    await expect(frame.getByTestId('crop-size')).not.toHaveText('Selection: 720 × 720 px');
  });
});
