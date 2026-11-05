import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { chooseFile, recordRequests } from './helpers';
import { openPdfTool } from './pdf-helpers';

const CHOOSE = /Choose an image/;

test.describe('Image to Text (OCR)', () => {
  // The first run downloads the engine and language data from the frame origin.
  test.slow();

  test('reads an English document, offers copy and download, and calls no other site', async ({
    page,
  }) => {
    const log = recordRequests(page);
    const frame = await openPdfTool(page, '/ocr/image-to-text/', CHOOSE);
    await chooseFile(frame, 'ocr/english-clean.png');
    await frame.getByTestId('lang-hin').uncheck();
    await frame.getByTestId('prepare').click();
    const text = frame.getByTestId('text-result');
    await expect(text).toBeVisible({ timeout: 90_000 });
    await expect(text).toHaveValue(/Priya Sharma/);
    await expect(text).toHaveValue(/2046118/);
    await expect(frame.getByTestId('copy-text')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download').click(),
    ]);
    expect(download.suggestedFilename()).toBe('english-clean-text.txt');
    expect(readFileSync(await download.path(), 'utf8')).toContain('437 out of 500');

    // Engine, language data and image stay on our two origins. (WebKit also reports
    // in-memory blob: URLs of the frame as requests; they never touch the network.)
    const ours = ['http://localhost:4321', 'http://127.0.0.1:4322', 'blob:http://127.0.0.1:4322'];
    const elsewhere = log.requests.filter((r) => !ours.some((origin) => r.url.startsWith(origin)));
    expect(elsewhere.map((r) => r.url)).toEqual([]);
  });

  test('the Hindi page reads a phone photo of a Hindi certificate', async ({ page }) => {
    const frame = await openPdfTool(page, '/ocr/hindi-image-to-text/', CHOOSE);
    await chooseFile(frame, 'ocr/hindi-phone-photo.jpg');
    await expect(frame.getByTestId('lang-hin')).toBeChecked();
    await frame.getByTestId('prepare').click();
    const text = frame.getByTestId('text-result');
    await expect(text).toBeVisible({ timeout: 90_000 });
    await expect(text).toHaveValue(/प्रमाण पत्र/);
    await expect(text).toHaveValue(/नागपुर/);
  });
});
