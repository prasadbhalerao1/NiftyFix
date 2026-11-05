import { readFileSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { jpegDpi } from '../packages/engines/image/src/jfif';
import { chooseFile } from './helpers';
import { openPdfTool } from './pdf-helpers';

const CHOOSE = /Choose a photo/;

async function makeSheet(page: Page, frame: FrameLocator): Promise<Buffer> {
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

test.describe('ID and Photo Sheet Maker', () => {
  test('8 passport photos on a landscape 4 × 6 inch sheet at 300 DPI', async ({ page }) => {
    const frame = await openPdfTool(page, '/forms/photo-sheet-maker/', CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await expect(frame.getByTestId('copies')).toHaveValue('8');
    const bytes = await makeSheet(page, frame);
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 1800, height: 1200 });
    expect(jpegDpi(bytes)).toBe(300);
    await expect(frame.getByTestId('result')).toContainText('8 at 35 × 45 mm');
  });

  test('the A4 page fits 30 and accepts fewer copies', async ({ page }) => {
    const frame = await openPdfTool(page, '/forms/passport-photo-a4-sheet/', CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await expect(frame.getByTestId('copies')).toHaveValue('30');
    await frame.getByTestId('copies').fill('12');
    const bytes = await makeSheet(page, frame);
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 2480, height: 3508 });
    await expect(frame.getByTestId('result')).toContainText('12 at 35 × 45 mm');
  });

  test('too many copies is explained', async ({ page }) => {
    const frame = await openPdfTool(page, '/forms/photo-sheet-maker/', CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByTestId('copies').fill('9');
    await expect(frame.getByText('Enter 1 to 8.')).toBeVisible();
    await expect(frame.getByTestId('prepare')).toBeDisabled();
  });
});
