import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { fixture, recordProblems, toolFrame } from './helpers';

const PNG_PATH = fixture('images/transparent-800x800.png');
const PNG = readFileSync(PNG_PATH);

test.describe('Image to Base64 and Back', () => {
  test('encodes an image to a data URI that decodes to the exact file', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/image/image-to-base64/');
    const frame = toolFrame(page);
    await frame.getByTestId('file-input').setInputFiles(PNG_PATH);
    const text = await frame.getByTestId('encoded-text').inputValue();
    expect(text.startsWith('data:image/png;base64,')).toBe(true);
    expect(Buffer.from(text.split(',')[1] ?? '', 'base64').equals(PNG)).toBe(true);
    await frame.getByTestId('snippet').selectOption('html');
    await expect(frame.getByTestId('encoded-text')).toHaveValue(
      /^<img src="data:image\/png;base64,/,
    );
    expect(problems).toEqual([]);
  });

  test('the Base64 to image page decodes pasted text and downloads it', async ({ page }) => {
    await page.goto('/image/base64-to-image/');
    const frame = toolFrame(page);
    // Wrapped across lines, as it often is when copied from code.
    const base64 = PNG.toString('base64');
    await frame
      .getByTestId('base64-input')
      .fill(`data:image/png;base64,${base64.slice(0, 500)}\n${base64.slice(500)}`);
    await expect(frame.getByTestId('decoded')).toContainText('PNG · 800 × 800 px');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download-decoded').click(),
    ]);
    expect(download.suggestedFilename()).toBe('decoded.png');
    expect(readFileSync(await download.path()).equals(PNG)).toBe(true);
  });

  test('explains broken Base64 precisely', async ({ page }) => {
    await page.goto('/image/base64-to-image/');
    const frame = toolFrame(page);
    await frame.getByTestId('base64-input').fill('iVBOR#w0KGgo');
    await expect(frame.getByTestId('decode-error')).toHaveText(
      '"#" at position 6 is not a Base64 character.',
    );
  });
});
