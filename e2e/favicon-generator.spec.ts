import { readFileSync } from 'node:fs';
import { unzipSync } from 'fflate';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { readIcoSizes } from '../tools/image/favicon-generator/ico';
import { fixture, recordProblems, toolFrame } from './helpers';

async function downloadZip(page: Page, frame: FrameLocator): Promise<Record<string, Uint8Array>> {
  await expect(frame.getByTestId('favicon-check')).toContainText('each checked');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  expect(download.suggestedFilename()).toBe('favicons.zip');
  return unzipSync(new Uint8Array(readFileSync(await download.path())));
}

test.describe('Favicon Generator', () => {
  test('makes the full icon set from a logo, each at its exact size', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/image/favicon-generator/');
    const frame = toolFrame(page);
    await frame.getByTestId('file-input').setInputFiles(fixture('images/transparent-800x800.png'));
    await expect(frame.getByTestId('favicon-preview')).toBeVisible();
    const files = await downloadZip(page, frame);
    expect(Object.keys(files).sort()).toEqual([
      'android-chrome-192x192.png',
      'android-chrome-512x512.png',
      'apple-touch-icon.png',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'favicon-tags.html',
      'favicon.ico',
      'maskable-512x512.png',
      'site.webmanifest',
    ]);
    expect(readIcoSizes(files['favicon.ico'] ?? new Uint8Array())).toEqual([16, 32, 48]);
    expect(readImageHeader(files['apple-touch-icon.png'] ?? new Uint8Array())).toEqual({
      format: 'png',
      width: 180,
      height: 180,
    });
    const manifest = JSON.parse(new TextDecoder().decode(files['site.webmanifest']));
    expect(manifest.icons).toHaveLength(3);
    expect(problems).toEqual([]);
  });

  test('makes an SVG favicon from text', async ({ page }) => {
    await page.goto('/image/favicon-generator/');
    const frame = toolFrame(page);
    await frame.getByText('Text or emoji', { exact: true }).click();
    await frame.getByTestId('favicon-text').fill('NF');
    const files = await downloadZip(page, frame);
    const svg = new TextDecoder().decode(files['favicon.svg']);
    expect(svg).toContain('>NF</text>');
    await expect(frame.getByTestId('favicon-tags')).toHaveValue(/favicon\.svg/);
  });
});
