import { readFileSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { jpegDpi } from '../packages/engines/image/src/jfif';
import { chooseFile } from './helpers';
import { openPdfTool } from './pdf-helpers';

const CHOOSE = /Choose a photo/;

async function make(page: Page, frame: FrameLocator): Promise<Buffer> {
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 45_000 });
  await expect(frame.getByTestId('validation-report').locator('[data-status="fail"]')).toHaveCount(
    0,
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  return readFileSync(await download.path());
}

test.describe('Passport and Visa Photo Maker', () => {
  test('Indian passport page makes a 3.5 × 4.5 cm photo at 600 DPI', async ({ page }) => {
    const frame = await openPdfTool(page, '/forms/indian-passport-photo/', CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await expect(frame.getByTestId('photo-spec')).toContainText('35 × 45 mm');
    await expect(frame.getByTestId('head-guide')).toBeVisible();
    const bytes = await make(page, frame);
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 827, height: 1063 });
    expect(jpegDpi(bytes)).toBe(600);
  });

  test('Indian visa page makes a square JPG inside 10 to 300 KB', async ({ page }) => {
    const frame = await openPdfTool(page, '/forms/indian-visa-photo/', CHOOSE);
    await chooseFile(frame, 'images/large-4000x3000.jpg');
    const bytes = await make(page, frame);
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 600, height: 600 });
    expect(bytes.length).toBeGreaterThanOrEqual(10_240);
    expect(bytes.length).toBeLessThanOrEqual(300_000);
  });

  test('switching to US makes a 2 × 2 inch photo and shows the head range', async ({ page }) => {
    const frame = await openPdfTool(page, '/forms/passport-photo-maker/', CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByTestId('photo-type').selectOption('us-passport-photo');
    await expect(frame.getByTestId('photo-spec')).toContainText('25 to 35 mm');
    const bytes = await make(page, frame);
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 1200, height: 1200 });
  });
});
