import { expect, test, type Page } from '@playwright/test';
import { TOOL_PATH } from './helpers';

const toggle = (page: Page) => page.locator('[data-theme-toggle]');
const frameRoot = (page: Page) => page.frameLocator('iframe[data-tool-frame]').locator('html');

test.describe('theme toggle', () => {
  test('is dark by default, even when the system is light', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(TOOL_PATH);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme');
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Switch to light mode');
    const scheme = (el: Element) => getComputedStyle(el).colorScheme;
    expect(await page.locator('html').evaluate(scheme)).toBe('dark');
    await expect.poll(() => frameRoot(page).evaluate(scheme)).toBe('dark');
  });

  test('switches site and tool frame, and remembers the choice', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(TOOL_PATH);
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await expect(frame.getByRole('button', { name: /Choose a/ })).toBeVisible();

    await toggle(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(frameRoot(page)).toHaveAttribute('data-theme', 'light');
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Switch to dark mode');
    // The frame really renders light: light color-scheme, and a light drop zone surface
    // (paper, or cream while touch emulation leaves it in hover state).
    // Polled: the surface animates (transition-colors) from the dark colour.
    const measure = () =>
      frame.getByRole('button', { name: /Choose a/ }).evaluate((el) => {
        const probe = document.createElement('canvas').getContext('2d');
        if (!probe) throw new Error('no 2d context');
        probe.fillStyle = getComputedStyle(el).backgroundColor;
        probe.fillRect(0, 0, 1, 1);
        const [r = 0, g = 0, b = 0] = probe.getImageData(0, 0, 1, 1).data;
        return {
          scheme: getComputedStyle(document.documentElement).colorScheme,
          luminance: 0.299 * r + 0.587 * g + 0.114 * b,
        };
      });
    await expect.poll(async () => (await measure()).scheme).toBe('light');
    await expect.poll(async () => (await measure()).luminance).toBeGreaterThan(240);

    // Remembered across pages, applied before the frame loads its tool.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(frameRoot(page)).toHaveAttribute('data-theme', 'light');

    await toggle(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(frameRoot(page)).toHaveAttribute('data-theme', 'dark');
  });

  test('light is a choice, not the system setting', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    const body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(body).not.toBe('rgb(248, 243, 234)'); // cream, the light background
    await toggle(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(toggle(page)).toHaveAttribute('aria-label', 'Switch to dark mode');
  });
});
