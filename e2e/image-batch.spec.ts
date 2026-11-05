import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { readZip } from '../packages/runtime/src/download';
import { fixture } from './helpers';
import { openPdfTool } from './pdf-helpers';

const CHOOSE = /Choose an image/;

test.describe('image tools: several files at once', () => {
  test('Convert turns every file into JPG and downloads them as one ZIP', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/png-to-jpg/', CHOOSE);
    await frame
      .getByTestId('file-input')
      .setInputFiles([
        fixture('images/transparent-800x800.png'),
        fixture('images/landscape-webp-1000x700.webp'),
        fixture('images/portrait-1200x1600.jpg'),
      ]);
    await expect(frame.getByTestId('batch-item')).toHaveCount(3);
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('batch-summary')).toHaveText('All 3 files are ready.', {
      timeout: 60_000,
    });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download-all').click(),
    ]);
    expect(download.suggestedFilename()).toBe('niftyfix-convert-image.zip');
    const entries = await readZip(new Blob([readFileSync(await download.path())]));
    expect(entries.map((entry) => entry.name).sort()).toEqual([
      'landscape-webp-1000x700.jpg',
      'portrait-1200x1600.jpg',
      'transparent-800x800.jpg',
    ]);
    for (const entry of entries) expect(readImageHeader(entry.bytes)?.format).toBe('jpeg');
  });

  test('a bad file is skipped and the rest still run', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/compress-image-to-100kb/', CHOOSE);
    await frame
      .getByTestId('file-input')
      .setInputFiles([
        fixture('images/large-4000x3000.jpg'),
        fixture('malicious/pdf-disguised.jpg'),
        fixture('images/portrait-1200x1600.jpg'),
      ]);
    await expect(frame.getByTestId('skipped-files')).toContainText('pdf-disguised.jpg');
    await expect(frame.getByTestId('batch-item')).toHaveCount(2);
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('batch-summary')).toHaveText('All 2 files are ready.', {
      timeout: 60_000,
    });
    // Each file can also be downloaded on its own, and meets the limit.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('batch-download').first().click(),
    ]);
    expect(readFileSync(await download.path()).length).toBeLessThanOrEqual(100_000);
  });

  test('one file keeps the single-file layout', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/compress-image/', CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(fixture('images/portrait-1200x1600.jpg'));
    await expect(frame.getByTestId('chosen-file')).toBeVisible();
    await expect(frame.getByTestId('batch')).toHaveCount(0);
  });
});
