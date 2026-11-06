import { readFileSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { fixture, recordProblems } from './helpers';

async function combine(
  page: Page,
  frame: FrameLocator,
): Promise<{ name: string; bytes: Uint8Array }> {
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  return {
    name: download.suggestedFilename(),
    bytes: new Uint8Array(readFileSync(await download.path())),
  };
}

test('stacks two images at the narrowest width with the chosen gap', async ({ page }) => {
  const problems = recordProblems(page);
  await page.goto('/image/combine-images/');
  const frame = page.frameLocator('iframe[data-tool-frame]');
  await frame
    .getByTestId('file-input')
    .setInputFiles([
      fixture('images/portrait-1200x1600.jpg'),
      fixture('images/landscape-webp-1000x700.webp'),
    ]);
  await expect(frame.getByTestId('queued-file')).toHaveCount(2);
  const { name, bytes } = await combine(page, frame);
  expect(name).toMatch(/\.jpg$/);
  // 1200 x 1600 shrinks to 1000 x 1333, then a 20 px gap, then 1000 x 700.
  expect(readImageHeader(bytes)).toMatchObject({ format: 'jpeg', width: 1000, height: 2053 });
  expect(problems).toEqual([]);
});

test('Aadhaar page puts both sides on an A4 page at 300 DPI', async ({ page }) => {
  await page.goto('/image/aadhaar-front-back-one-page/');
  const frame = page.frameLocator('iframe[data-tool-frame]');
  await frame
    .getByTestId('file-input')
    .setInputFiles([
      fixture('images/landscape-webp-1000x700.webp'),
      fixture('images/exif-rotated-6.jpg'),
    ]);
  await expect(frame.getByTestId('arrangement')).toHaveValue('id-a4');
  const { bytes } = await combine(page, frame);
  expect(readImageHeader(bytes)).toMatchObject({ width: 2480, height: 3508 });
});

test('asks for a second image before combining', async ({ page }) => {
  await page.goto('/image/combine-images/');
  const frame = page.frameLocator('iframe[data-tool-frame]');
  await frame.getByTestId('file-input').setInputFiles([fixture('images/portrait-1200x1600.jpg')]);
  await expect(frame.getByTestId('prepare')).toBeDisabled();
  await expect(frame.getByTestId('prepare')).toHaveText('Add at least 2 images');
});
