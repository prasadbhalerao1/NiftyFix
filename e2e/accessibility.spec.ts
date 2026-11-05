import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { chooseFile, fixture, openTool, TOOL_PATH } from './helpers';

/** A violation with the offending elements, so a failure says what to fix. */
type Violation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];
const describeViolation = (v: Violation): string =>
  `${v.id}: ${v.help}: ${v.nodes.map((n) => `${n.html} ${n.failureSummary ?? ''}`).join(' | ')}`;

/**
 * Audit the settled page: reveal everything that would fade in on scroll, then
 * wait for finite animations (fades, demos) to end. Mid-fade text is not what
 * readers are left with, and looping indicators never end, so they are skipped.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    for (const el of document.querySelectorAll('[data-reveal], [data-stagger]')) {
      el.classList.add('is-in');
    }
    // Demos start more animations on timers, so wait until nothing finite is left running.
    const finite = (): Animation[] =>
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
    for (let round = 0; round < 12; round += 1) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const running = finite();
      if (running.length === 0) break;
      await Promise.all(running.map((animation) => animation.finished.catch(() => undefined)));
    }
  });
}

/** axe cannot see into cross-origin frames from the parent, so tool states are scanned inside the frame. */
async function scanFrame(page: Page, label: string): Promise<void> {
  // Audit the settled frame: panels fade in, and mid-fade text is not what users read.
  await page
    .frameLocator('iframe[data-tool-frame]')
    .locator('body')
    .evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          // Endless ones (spinners, loading shimmer) never finish; cancelled ones reject.
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      ),
    );
  const results = await new AxeBuilder({ page })
    .include('iframe[data-tool-frame]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  // Prove the scan reached inside the cross-origin frame: in-frame nodes have nested targets.
  const scannedInsideFrame = results.passes.some((rule) =>
    rule.nodes.some((node) => node.target.length > 1),
  );
  expect(scannedInsideFrame, `${label}: axe did not reach inside the tool frame`).toBe(true);
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious.map(describeViolation), label).toEqual([]);
}

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(`site pages have no serious violations (${theme})`, async ({ page }) => {
      // Seven full pages, each settled before the audit: longer than one tool test.
      test.slow();
      if (theme === 'light')
        await page.addInitScript(() => localStorage.setItem('niftyfix-theme', 'light'));
      for (const path of [
        '/',
        '/forms/',
        TOOL_PATH,
        '/forms/signature-resizer/',
        '/image/',
        '/image/compress-image/',
        '/privacy-verification/',
      ]) {
        await page.goto(path);
        await settle(page);
        const results = await new AxeBuilder({ page })
          .exclude('iframe[data-tool-frame]')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const serious = results.violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        );
        expect(serious.map(describeViolation), `${path} (${theme})`).toEqual([]);
      }
    });
  }

  test('every tool state has no serious violations', async ({ page }) => {
    const frame = await openTool(page);
    await scanFrame(page, 'empty');
    await chooseFile(frame, 'images/portrait-1200x1600.jpg');
    await expect(frame.getByTestId('crop-frame')).toBeVisible();
    await frame.getByRole('button', { name: 'Advanced options' }).click();
    await scanFrame(page, 'editing with advanced options');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await scanFrame(page, 'result');
    await frame.getByTestId('max-kb').fill('1');
    await frame.getByTestId('width').fill('2000');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toBeVisible({ timeout: 30_000 });
    await scanFrame(page, 'error');
  });

  test('dark (default) theme: hovered drop zone keeps readable text', async ({ page }) => {
    for (const path of [TOOL_PATH, '/forms/signature-resizer/']) {
      await page.goto(path);
      const frame = page.frameLocator('iframe[data-tool-frame]');
      const dropzone = frame.getByRole('button', { name: /Choose a/ });
      await expect(dropzone).toBeVisible();
      await dropzone.hover();
      await scanFrame(page, `${path} dark, drop zone hovered`);
    }
  });

  test('PDF tools: file queue, page selection and result have no serious violations', async ({
    page,
  }) => {
    const { makePdf } = await import('./pdf-helpers');
    await page.goto('/pdf/merge-pdf/');
    const merge = page.frameLocator('iframe[data-tool-frame]');
    await expect(merge.getByRole('button', { name: /Choose PDF files/ })).toBeVisible();
    await scanFrame(page, 'merge empty');
    await merge
      .getByTestId('file-input')
      .setInputFiles([await makePdf('a.pdf', 1), await makePdf('b.pdf', 1)]);
    await expect(merge.getByTestId('queued-file')).toHaveCount(2);
    await scanFrame(page, 'merge queue');
    await merge.getByTestId('prepare').click();
    await expect(merge.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await scanFrame(page, 'merge result');

    await page.goto('/pdf/rotate-pdf/');
    const rotate = page.frameLocator('iframe[data-tool-frame]');
    await rotate.getByTestId('file-input').setInputFiles(await makePdf('c.pdf', 2));
    await rotate.getByText('Choose pages', { exact: true }).click();
    await rotate.getByTestId('page-ranges').fill('9-1');
    await expect(rotate.getByText('runs backwards')).toBeVisible();
    await scanFrame(page, 'rotate with a page-range error');
  });

  test('Compress Image settings and result have no serious violations', async ({ page }) => {
    await page.goto('/image/compress-image-to-50kb/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await frame.getByTestId('file-input').setInputFiles(fixture('images/portrait-1200x1600.jpg'));
    await expect(frame.getByTestId('target-size')).toBeVisible();
    await scanFrame(page, 'compress image settings');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await scanFrame(page, 'compress image result');
  });

  test('Remove EXIF metadata list has no serious violations', async ({ page }) => {
    const { withGpsExif } = await import('../packages/engines/image/test/samples');
    const { readFileSync } = await import('node:fs');
    await page.goto('/image/remove-exif/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    const input = withGpsExif(
      new Uint8Array(readFileSync(fixture('images/portrait-1200x1600.jpg'))),
    );
    await frame
      .getByTestId('file-input')
      .setInputFiles({ name: 'trip.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(input) });
    await expect(frame.getByTestId('metadata')).toContainText('includes location');
    await scanFrame(page, 'remove exif metadata list');
  });

  test('batch results have no serious violations', async ({ page }) => {
    await page.goto('/image/compress-image-to-100kb/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await frame
      .getByTestId('file-input')
      .setInputFiles([
        fixture('images/portrait-1200x1600.jpg'),
        fixture('malicious/pdf-disguised.jpg'),
        fixture('images/transparent-800x800.png'),
      ]);
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('batch-summary')).toBeVisible({ timeout: 60_000 });
    await scanFrame(page, 'batch results');
  });

  test('Passport Photo Maker has no serious violations', async ({ page }) => {
    await page.goto('/forms/us-passport-photo-2x2/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await frame.getByTestId('file-input').setInputFiles(fixture('images/portrait-1200x1600.jpg'));
    await expect(frame.getByTestId('head-guide')).toBeVisible();
    await scanFrame(page, 'passport photo settings');
  });

  test('Resize Image settings have no serious violations', async ({ page }) => {
    await page.goto('/image/resize-image/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await frame.getByTestId('file-input').setInputFiles(fixture('images/portrait-1200x1600.jpg'));
    await frame.getByTestId('keep-proportions').uncheck();
    await expect(frame.getByTestId('fit')).toBeVisible();
    await scanFrame(page, 'resize image settings');
  });

  test('Organize PDF page grid has no serious violations', async ({ page }) => {
    const { makePdf } = await import('./pdf-helpers');
    await page.goto('/pdf/organize-pdf/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await frame.getByTestId('file-input').setInputFiles(await makePdf('a.pdf', 3));
    await expect(frame.getByTestId('page-card')).toHaveCount(3);
    await frame.getByRole('button', { name: 'Remove Page 2' }).click();
    await scanFrame(page, 'organize grid with a removed page');
  });

  test('Sign PDF with a placed signature has no serious violations', async ({ page }) => {
    const { makePdf } = await import('./pdf-helpers');
    await page.goto('/pdf/sign-pdf/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await frame.getByTestId('file-input').setInputFiles(await makePdf('a.pdf', 2));
    await expect(frame.getByTestId('page-indicator')).toBeVisible();
    await scanFrame(page, 'sign before a signature');
    await frame.getByText('Upload a photo', { exact: true }).click();
    await frame
      .getByTestId('file-input')
      .last()
      .setInputFiles(fixture('signatures/white-black.jpg'));
    await expect(frame.getByTestId('signature-box')).toBeVisible();
    await scanFrame(page, 'sign with a placed signature');
  });

  test('signature resizer states have no serious violations', async ({ page }) => {
    await page.goto('/forms/signature-resizer/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await expect(frame.getByRole('button', { name: /Choose a signature/ })).toBeVisible();
    await scanFrame(page, 'signature empty');
    await chooseFile(frame, 'signatures/thin-pen.jpg');
    await expect(frame.getByTestId('signature-preview')).toBeVisible();
    await frame.getByText('Black & white', { exact: true }).click();
    await frame.getByLabel(/^Threshold/).fill('0.1');
    await expect(frame.getByTestId('preview-warning').first()).toBeVisible();
    await frame.getByRole('button', { name: 'Advanced options' }).click();
    await scanFrame(page, 'signature editing with warning and advanced options');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    await scanFrame(page, 'signature result');
  });
});
