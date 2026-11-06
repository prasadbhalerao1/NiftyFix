import { readFileSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { chooseFile, recordProblems } from './helpers';
import { openPdfTool } from './pdf-helpers';

const CHOOSE = /Choose an image/;

async function saveAndRead(
  page: Page,
  frame: FrameLocator,
): Promise<{ name: string; header: ReturnType<typeof readImageHeader> }> {
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 45_000 });
  await expect(frame.getByTestId('validation-report').locator('[data-status="fail"]')).toHaveCount(
    0,
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  return {
    name: download.suggestedFilename(),
    header: readImageHeader(readFileSync(await download.path())),
  };
}

test.describe('Make Square / Add Border', () => {
  test('pads a wide photo to a square without cropping it', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/image/make-square/', CHOOSE);
    await chooseFile(frame, 'images/landscape-webp-1000x700.webp');
    await expect(frame.getByTestId('square-preview')).toBeVisible();
    const { name, header } = await saveAndRead(page, frame);
    expect(name).toBe('landscape-webp-1000x700-square.webp');
    expect(header).toMatchObject({ width: 1000, height: 1000 });
    expect(problems).toEqual([]);
  });

  test('blurred background works on a tall photo', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/make-square/', CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByText('Blurred', { exact: true }).click();
    const { header } = await saveAndRead(page, frame);
    expect(header).toEqual({ format: 'jpeg', width: 1600, height: 1600 });
  });

  test('border page adds 5% on every side and keeps the shape', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/add-border-to-photo/', CHOOSE);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await expect(frame.getByTestId('border')).toHaveValue('5');
    const { header } = await saveAndRead(page, frame);
    // 5% of the 1600 px longer side is 80 px on each side.
    expect(header).toMatchObject({ width: 1360, height: 1760 });
  });
});
