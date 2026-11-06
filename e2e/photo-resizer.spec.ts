import { readFileSync } from 'node:fs';
import { expect, test, type Download, type FrameLocator } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { jpegDpi } from '../packages/engines/image/src/jfif';
import {
  chooseFile,
  fixture,
  FRAME_ORIGIN,
  openTool,
  recordProblems,
  recordRequests,
  SITE_ORIGIN,
} from './helpers';

async function setRequirements(
  frame: FrameLocator,
  values: { width?: string; height?: string; minKb?: string; maxKb?: string },
): Promise<void> {
  if (values.width !== undefined) await frame.getByTestId('width').fill(values.width);
  if (values.height !== undefined) await frame.getByTestId('height').fill(values.height);
  if (values.minKb !== undefined) await frame.getByTestId('min-kb').fill(values.minKb);
  if (values.maxKb !== undefined) await frame.getByTestId('max-kb').fill(values.maxKb);
}

async function downloadBytes(download: Download): Promise<Uint8Array> {
  const path = await download.path();
  return new Uint8Array(readFileSync(path));
}

test.describe('Form Photo Resizer: end to end', () => {
  test('upload → exact dimensions → KB range → verify → download', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openTool(page);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await expect(frame.getByText('1200 × 1600 px')).toBeVisible();
    await expect(frame.getByTestId('crop-frame')).toBeVisible();

    await setRequirements(frame, { width: '200', height: '230', minKb: '10', maxKb: '20' });
    await frame.getByTestId('prepare').click();

    const result = frame.getByTestId('result');
    await expect(result).toBeVisible({ timeout: 30_000 });
    await expect(result.getByText('Your photo meets every requirement you entered.')).toBeVisible();
    const report = frame.getByTestId('validation-report');
    for (const check of ['dimensions', 'size', 'format', 'extension']) {
      await expect(report.locator(`[data-check="${check}"]`)).toHaveAttribute(
        'data-status',
        'pass',
      );
    }

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download').click(),
    ]);
    expect(download.suggestedFilename()).toBe('portrait-1200x1600-200x230.jpg');
    const bytes = await downloadBytes(download);
    // Independent verification of the downloaded file (not the UI's claim).
    expect(readImageHeader(bytes)).toEqual({ format: 'jpeg', width: 200, height: 230 });
    expect(bytes.length).toBeGreaterThanOrEqual(10 * 1024); // safe convention: min uses 1024
    expect(bytes.length).toBeLessThanOrEqual(20 * 1000); // safe convention: max uses 1000
    expect(problems).toEqual([]);
  });

  test('writes DPI and a custom file name when requested', async ({ page }) => {
    const frame = await openTool(page);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByRole('button', { name: '3.5 × 4.5 cm photo at 300 DPI' }).click();
    await frame.getByRole('button', { name: 'Advanced options' }).click();
    await frame.getByTestId('file-name').fill('photo');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await expect(frame.locator('[data-check="dpi"]')).toHaveAttribute('data-status', 'pass');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download').click(),
    ]);
    expect(download.suggestedFilename()).toBe('photo.jpg');
    const bytes = await downloadBytes(download);
    expect(readImageHeader(bytes)).toMatchObject({ width: 413, height: 531 });
    expect(jpegDpi(bytes)).toBe(300);
  });

  test('reports an unreachable maximum honestly instead of producing a file', async ({ page }) => {
    const frame = await openTool(page);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await setRequirements(frame, { width: '1000', height: '1000', maxKb: '2' });
    await frame.getByTestId('prepare').click();
    const error = frame.getByTestId('error-view');
    await expect(error).toBeVisible({ timeout: 30_000 });
    await expect(error).toHaveAttribute('data-error-code', 'TARGET_UNREACHABLE');
    await expect(error).toContainText('lowest quality you allow');
    await expect(frame.getByTestId('result')).toHaveCount(0);
  });

  test('refuses to pad a file to reach a minimum', async ({ page }) => {
    const frame = await openTool(page);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await setRequirements(frame, { width: '40', height: '40', minKb: '200' });
    await frame.getByTestId('prepare').click();
    const error = frame.getByTestId('error-view');
    await expect(error).toBeVisible({ timeout: 30_000 });
    await expect(error).toContainText('never pad files');
  });

  test('validates settings before processing', async ({ page }) => {
    const frame = await openTool(page);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await setRequirements(frame, { width: '10' });
    await expect(frame.getByText('Enter a whole number from 16 to 8000.')).toBeVisible();
    await expect(frame.getByTestId('prepare')).toBeDisabled();
    await setRequirements(frame, { width: '300', minKb: '50', maxKb: '20' });
    await expect(frame.getByText('Minimum must be smaller than maximum.')).toBeVisible();
    await expect(frame.getByTestId('prepare')).toBeDisabled();
  });

  test('applies EXIF orientation', async ({ page }) => {
    const frame = await openTool(page);
    await chooseFile(frame, 'images/exif-rotated-6.jpg');
    // Stored as 1600×1200 with orientation 6: users see (and we process) 1200×1600.
    await expect(frame.getByText('1200 × 1600 px')).toBeVisible();
  });

  test('accepts a PNG with a .jpg name and explains the mismatch', async ({ page }) => {
    const frame = await openTool(page);
    await chooseFile(frame, 'images/png-named.jpg');
    await expect(frame.getByText(/really a PNG/)).toBeVisible();
  });

  test('flattens transparency onto the chosen background for JPEG', async ({ page }) => {
    const frame = await openTool(page);
    await chooseFile(frame, 'images/transparent-800x800.png');
    await setRequirements(frame, { width: '300', height: '300' });
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await expect(frame.locator('[data-check="format"]')).toHaveAttribute('data-status', 'pass');
  });

  for (const [file, pattern] of [
    ['malicious/random-bytes.jpg', /not a supported type/],
    ['malicious/pdf-disguised.jpg', /not a supported type/],
    ['malicious/truncated.jpg', /damaged or incomplete/],
    ['malicious/png-bomb-30000x30000.png', /30000 × 30000 px, too large/],
    ['malicious/iphone.heic', /HEIC photos .* not supported yet/],
    ['malicious/empty.jpg', /This file is empty/],
  ] as const) {
    test(`rejects ${file} with a clear message`, async ({ page }) => {
      const frame = await openTool(page);
      await chooseFile(frame, file);
      await expect(frame.getByTestId('error-view')).toContainText(pattern);
      await expect(frame.getByTestId('crop-frame')).toHaveCount(0);
    });
  }

  test('cancel stops processing and returns to editing', async ({ page }) => {
    const frame = await openTool(page);
    await chooseFile(frame, 'images/large-4000x3000.jpg');
    await setRequirements(frame, { width: '3000', height: '2250', minKb: '300', maxKb: '310' });
    await frame.getByTestId('prepare').click();
    // Dispatch directly: in the main-thread fallback (old Safari) the frame is busy and
    // resizing while work runs, so waiting for a "stable" button would outlast the job.
    await frame.getByTestId('cancel').dispatchEvent('click');
    await expect(frame.getByTestId('cancel')).toHaveCount(0);
    await expect(frame.getByTestId('result')).toHaveCount(0);
    await expect(frame.getByTestId('error-view')).toHaveCount(0);
    await expect(frame.getByTestId('prepare')).toBeEnabled();
  });

  test('keyboard-only flow', async ({ page, browserName }) => {
    test.skip(
      browserName === 'webkit',
      'WebKit does not move focus to buttons with Tab by default (macOS setting).',
    );
    const frame = await openTool(page);
    await frame.getByRole('button', { name: /Choose a photo/ }).focus();
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.keyboard.press('Enter'),
    ]);
    await chooser.setFiles(fixture('images/portrait-1200x1600.jpg'));
    const crop = frame.getByTestId('crop-frame');
    await crop.focus();
    const before = await crop.getAttribute('style');
    await page.keyboard.press('Minus');
    await page.keyboard.press('ArrowRight');
    expect(await crop.getAttribute('style')).not.toBe(before);
    await frame.getByTestId('prepare').focus();
    await page.keyboard.press('Enter');
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await frame.getByTestId('download').focus();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.keyboard.press('Enter'),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.jpg$/);
  });

  test('no file data leaves the tool frame during processing', async ({ page }) => {
    const log = recordRequests(page);
    const frame = await openTool(page);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await setRequirements(frame, { width: '200', height: '230', maxKb: '30' });
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await Promise.all([page.waitForEvent('download'), frame.getByTestId('download').click()]);

    const fromFrame = log.requests.filter((r) => r.frameUrl.startsWith(FRAME_ORIGIN));
    expect(fromFrame.length).toBeGreaterThan(0);
    for (const request of fromFrame) {
      const allowed =
        request.url.startsWith(`${FRAME_ORIGIN}/`) ||
        request.url.startsWith('blob:') ||
        request.url.startsWith('data:');
      expect(allowed, `frame requested ${request.url}`).toBe(true);
      expect(request.method, `frame used ${request.method} for ${request.url}`).toBe('GET');
    }
    // Nothing anywhere on the page talks to third parties.
    for (const request of log.requests) {
      const firstParty = [SITE_ORIGIN, FRAME_ORIGIN, 'blob:', 'data:'].some((prefix) =>
        request.url.startsWith(prefix),
      );
      expect(firstParty, `unexpected request ${request.url}`).toBe(true);
    }
  });

  test('parent receives only coarse, content-free events', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { events: unknown[] }).events = [];
      document.addEventListener('niftyfix:tool-event', (event) => {
        (window as unknown as { events: unknown[] }).events.push((event as CustomEvent).detail);
      });
    });
    const frame = await openTool(page);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    const events = (): Promise<{ name: string }[]> =>
      page.evaluate(() => (window as unknown as { events: { name: string }[] }).events);
    // Messages cross from the frame asynchronously: the last one may land just after the result shows.
    await expect
      .poll(async () => (await events()).map((event) => event.name))
      .toEqual(['tool_ready', 'file_selected', 'tool_start', 'tool_success']);
    expect(JSON.stringify(await events())).not.toContain('portrait');
  });
});

test.describe('Form Photo Resizer: mobile layout', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('dropzone is above the fold and nothing scrolls horizontally', async ({ page }) => {
    const frame = await openTool(page);
    const box = await page.locator('iframe[data-tool-frame]').boundingBox();
    expect(box).not.toBeNull();
    expect((box?.y ?? 9999) < 640).toBe(true);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await expect(frame.getByTestId('crop-frame')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('download')).toBeVisible({ timeout: 30_000 });
    // The result renders above the settings on phones; it must be brought on screen.
    await expect(
      frame.getByText('Your photo meets every requirement you entered.'),
    ).toBeInViewport();
  });

  test('errors are brought on screen too', async ({ page }) => {
    const frame = await openTool(page);
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await frame.getByTestId('width').fill('1000');
    await frame.getByTestId('height').fill('1000');
    await frame.getByTestId('max-kb').fill('2');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toBeInViewport({ timeout: 30_000 });
  });
});

test('IBPS PO photo page opens with the notice sizes filled in', async ({ page }) => {
  await page.goto('/forms/ibps-po-photo-size/');
  await expect(page.getByText('ibps.in').first()).toBeVisible();
  const frame = page.frameLocator('iframe[data-tool-frame]');
  await chooseFile(frame, 'images/portrait-1200x1600.jpg');
  await expect(frame.getByTestId('width')).toHaveValue('200');
  await expect(frame.getByTestId('height')).toHaveValue('230');
  await expect(frame.getByTestId('min-kb')).toHaveValue('20');
  await expect(frame.getByTestId('max-kb')).toHaveValue('50');
});

test('choosing an exam fills its official sizes, which stay editable', async ({ page }) => {
  await page.goto('/forms/ibps-po-photo-size/');
  const frame = page.frameLocator('iframe[data-tool-frame]');
  await chooseFile(frame, 'images/portrait-1200x1600.jpg');
  await expect(frame.getByTestId('exam-picker')).toHaveValue('ibps-po-2026-photo');
  await frame.getByTestId('exam-picker').selectOption('upsc-2026-photo');
  // UPSC states no pixel size, so IBPS's 200 x 230 goes back to the default, not blank.
  await expect(frame.getByTestId('width')).toHaveValue('413');
  await expect(frame.getByTestId('height')).toHaveValue('531');
  await expect(frame.getByTestId('min-kb')).toHaveValue('20');
  await expect(frame.getByTestId('max-kb')).toHaveValue('200');
  await expect(frame.getByText('upsconline.nic.in')).toBeVisible();
  await frame.getByTestId('max-kb').fill('150');
  await expect(frame.getByTestId('max-kb')).toHaveValue('150');
});
