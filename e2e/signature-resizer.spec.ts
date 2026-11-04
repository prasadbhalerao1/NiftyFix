import { readFileSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { fixture, recordProblems } from './helpers';

const PATH = '/forms/signature-resizer/';

async function open(page: Page): Promise<FrameLocator> {
  await page.goto(PATH);
  const frame = page.frameLocator('iframe[data-tool-frame]');
  await expect(frame.getByRole('button', { name: /Choose a signature/ })).toBeVisible();
  return frame;
}

async function choose(frame: FrameLocator, name: string): Promise<void> {
  await frame.getByTestId('file-input').setInputFiles(fixture(name));
  await expect(frame.getByTestId('crop-frame')).toBeVisible();
  await expect(frame.getByTestId('signature-preview')).toBeVisible();
}

async function requirements(
  frame: FrameLocator,
  values: { width?: string; height?: string; minKb?: string; maxKb?: string },
): Promise<void> {
  if (values.width !== undefined) await frame.getByTestId('width').fill(values.width);
  if (values.height !== undefined) await frame.getByTestId('height').fill(values.height);
  if (values.minKb !== undefined) await frame.getByTestId('min-kb').fill(values.minKb);
  if (values.maxKb !== undefined) await frame.getByTestId('max-kb').fill(values.maxKb);
}

async function prepareAndDownload(
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

interface PixelStats {
  /** Fraction of pixels in the outer 5 % border that are (near) white or transparent. */
  borderClean: number;
  /** Fraction of all pixels darker than mid-grey (ink coverage). */
  ink: number;
  /** Alpha of the top-left pixel. */
  cornerAlpha: number;
}

/** Decode the downloaded file in the browser and measure it — independent of the tool's own report. */
async function analyse(page: Page, bytes: Uint8Array, mime: string): Promise<PixelStats> {
  return page.evaluate(
    async ({ data, mime }) => {
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)], { type: mime }));
      // A DOM canvas: WebKit has no OffscreenCanvas on some versions.
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no context');
      ctx.drawImage(bitmap, 0, 0);
      const { data: px, width, height } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      const lum = (i: number): number => {
        const a = (px[i + 3] ?? 255) / 255;
        return (
          (0.299 * (px[i] ?? 0) + 0.587 * (px[i + 1] ?? 0) + 0.114 * (px[i + 2] ?? 0)) * a +
          255 * (1 - a)
        );
      };
      const mx = Math.max(1, Math.round(width * 0.05));
      const my = Math.max(1, Math.round(height * 0.05));
      let border = 0;
      let clean = 0;
      let ink = 0;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const i = (y * width + x) * 4;
          const l = lum(i);
          if (l < 128) ink += 1;
          if (x < mx || y < my || x >= width - mx || y >= height - my) {
            border += 1;
            if (l >= 235) clean += 1;
          }
        }
      }
      return {
        borderClean: clean / border,
        ink: ink / (width * height),
        cornerAlpha: px[3] ?? 255,
      };
    },
    { data: [...bytes], mime },
  );
}

test.describe('Signature Resizer — difficult inputs', () => {
  for (const name of [
    'white-black.jpg',
    'blue-ink.jpg',
    'thin-pen.jpg',
    'thick-marker.jpg',
    'uneven-lighting.jpg',
    'hand-shadow.jpg',
    'grey-paper.jpg',
    'jpeg-noise.jpg',
    'low-res.jpg',
    'transparent.png',
  ]) {
    test(`${name}: clean background, strokes kept, exact size, byte limit met`, async ({
      page,
    }) => {
      const problems = recordProblems(page);
      const frame = await open(page);
      await choose(frame, `signatures/${name}`);
      await requirements(frame, { width: '400', height: '150', maxKb: '20' });
      const { name: fileName, bytes } = await prepareAndDownload(page, frame);
      const report = frame.getByTestId('validation-report');
      for (const check of ['dimensions', 'size', 'format', 'extension']) {
        await expect(report.locator(`[data-check="${check}"]`)).toHaveAttribute(
          'data-status',
          'pass',
        );
      }
      expect(fileName).toMatch(/-signature-400x150\.jpg$/);
      expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 400, height: 150 });
      expect(bytes.length).toBeLessThanOrEqual(20_000);
      const stats = await analyse(page, bytes, 'image/jpeg');
      expect(stats.borderClean, 'paper should be white').toBeGreaterThan(0.97);
      expect(stats.ink, 'pen strokes must survive').toBeGreaterThan(0.004);
      expect(stats.ink, 'background must not turn dark').toBeLessThan(0.3);
      expect(problems).toEqual([]);
    });
  }
});

test.describe('Signature Resizer — controls and honesty', () => {
  test('auto-crop trims the empty margins', async ({ page }) => {
    const frame = await open(page);
    await choose(frame, 'signatures/white-black.jpg');
    const style = (await frame.getByTestId('crop-frame').getAttribute('style')) ?? '';
    const width = Number(/width:\s*([\d.]+)%/.exec(style)?.[1]);
    // The signature spans ~60 % of the image width; the crop should be far below 100 %.
    expect(width).toBeGreaterThan(55);
    expect(width).toBeLessThan(80);
  });

  test('preview compares cleaned and original, and settings can be reset', async ({ page }) => {
    const frame = await open(page);
    await choose(frame, 'signatures/grey-paper.jpg');
    const preview = frame.getByTestId('signature-preview');
    await expect(preview).toHaveAttribute('data-view', 'cleaned');
    await frame.getByText('Original', { exact: true }).click();
    await expect(preview).toHaveAttribute('data-view', 'original');
    await frame.getByText('Cleaned', { exact: true }).click();
    await frame.getByTestId('no-cleanup').click();
    await expect(frame.getByTestId('flatten')).not.toBeChecked();
    await frame.getByTestId('reset-cleanup').click();
    await expect(frame.getByTestId('flatten')).toBeChecked();
  });

  test('warns before a harsh threshold destroys thin strokes', async ({ page }) => {
    const frame = await open(page);
    await choose(frame, 'signatures/thin-pen.jpg');
    await frame.getByText('Black & white', { exact: true }).click();
    const threshold = frame.getByLabel(/^Threshold/);
    await threshold.fill('0.1');
    await expect(frame.getByTestId('preview-warning').first()).toBeVisible();
    // The warning is repeated in the final result, not silently dropped.
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await expect(frame.getByTestId('result-warning').first()).toBeVisible();
  });

  test('transparent PNG keeps ink and removes the paper', async ({ page }) => {
    const frame = await open(page);
    await choose(frame, 'signatures/white-black.jpg');
    await frame.getByRole('button', { name: 'Advanced options' }).click();
    await frame.getByTestId('transparent').check();
    const { name, bytes } = await prepareAndDownload(page, frame);
    expect(name).toMatch(/\.png$/);
    expect(readImageHeader(bytes)).toMatchObject({ format: 'png', width: 400, height: 150 });
    const stats = await analyse(page, bytes, 'image/png');
    expect(stats.cornerAlpha).toBe(0);
    expect(stats.ink).toBeGreaterThan(0.004);
  });

  test('meets a min–max KB window and reports the exact bytes', async ({ page }) => {
    const frame = await open(page);
    await choose(frame, 'signatures/white-black.jpg');
    await requirements(frame, { width: '600', height: '240', minKb: '10', maxKb: '20' });
    const { bytes } = await prepareAndDownload(page, frame);
    expect(bytes.length).toBeGreaterThanOrEqual(10 * 1024);
    expect(bytes.length).toBeLessThanOrEqual(20 * 1000);
  });

  test('refuses to pad a clean signature up to a large minimum', async ({ page }) => {
    const frame = await open(page);
    await choose(frame, 'signatures/white-black.jpg');
    await requirements(frame, { width: '200', height: '80', minKb: '100' });
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toHaveAttribute(
      'data-error-code',
      'TARGET_UNREACHABLE',
    );
    await expect(frame.getByTestId('error-view')).toContainText('never pad files');
  });

  test('fill placement locks the crop to the output shape', async ({ page }) => {
    const frame = await open(page);
    await choose(frame, 'signatures/white-black.jpg');
    await frame.getByText('Fill', { exact: true }).click();
    const crop = frame.getByTestId('crop-frame');
    const box = await crop.boundingBox();
    expect(box).not.toBeNull();
    // 400 × 150 output ⇒ crop aspect 8:3 (allow a pixel of rounding).
    expect(Math.abs((box?.width ?? 0) / (box?.height ?? 1) - 400 / 150)).toBeLessThan(0.05);
  });

  for (const [file, pattern] of [
    ['malicious/random-bytes.jpg', /not a supported type/],
    ['malicious/truncated.jpg', /damaged or incomplete/],
    ['malicious/png-bomb-30000x30000.png', /30000 × 30000 px, too large/],
    ['malicious/iphone.heic', /HEIC photos .* not supported yet/],
  ] as const) {
    test(`rejects ${file}`, async ({ page }) => {
      const frame = await open(page);
      await frame.getByTestId('file-input').setInputFiles(fixture(file));
      await expect(frame.getByTestId('error-view')).toContainText(pattern);
    });
  }

  test('handles a large 12-megapixel photo', async ({ page }) => {
    const frame = await open(page);
    await choose(frame, 'images/large-4000x3000.jpg');
    await frame.getByTestId('autocrop').click();
    await requirements(frame, { width: '400', height: '150', maxKb: '20' });
    const { bytes } = await prepareAndDownload(page, frame);
    expect(readImageHeader(bytes)).toMatchObject({ width: 400, height: 150 });
  });
});
