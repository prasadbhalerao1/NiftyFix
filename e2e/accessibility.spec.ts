import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { chooseFile, openTool, TOOL_PATH } from './helpers';

/** axe cannot see into cross-origin frames from the parent, so tool states are scanned inside the frame. */
async function scanFrame(page: Page, label: string): Promise<void> {
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
  expect(
    serious.map((v) => `${v.id}: ${v.help}`),
    label,
  ).toEqual([]);
}

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  test('site pages have no serious violations', async ({ page }) => {
    for (const path of ['/', '/forms/', TOOL_PATH, '/privacy-verification/']) {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .exclude('iframe[data-tool-frame]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(
        serious.map((v) => `${v.id}: ${v.help}`),
        path,
      ).toEqual([]);
    }
  });

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
});
