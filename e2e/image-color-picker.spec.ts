import { expect, test, type Page } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

/** 400 × 200 PNG: left half dark orange (#FF8C00), right half dark green (#006400). */
async function twoColours(page: Page): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no context');
    ctx.fillStyle = '#ff8c00';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#006400';
    ctx.fillRect(200, 0, 200, 200);
    return canvas.toDataURL('image/png').split(',')[1] ?? '';
  });
  return { name: 'brand.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') };
}

test.describe('Image Colour Picker', () => {
  test('tapping the image picks the exact colour, with codes and contrast', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/image/image-color-picker/');
    const frame = toolFrame(page);
    await frame.getByTestId('file-input').setInputFiles(await twoColours(page));
    const area = frame.getByTestId('pick-area');
    await expect(area).toBeVisible();
    const box = await area.boundingBox();
    if (!box) throw new Error('no picking area');
    await page.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.5);
    const picked = frame.getByTestId('picked');
    await expect(picked).toContainText('#FF8C00');
    await expect(picked).toContainText('darkorange');
    await expect(frame.getByText('rgb(255, 140, 0)')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('arrow keys and Enter pick without a mouse', async ({ page }) => {
    await page.goto('/image/image-color-picker/');
    const frame = toolFrame(page);
    await frame.getByTestId('file-input').setInputFiles(await twoColours(page));
    const area = frame.getByTestId('pick-area');
    await area.focus();
    // The cursor starts in the middle (x 200, green); one step left is orange.
    await area.press('ArrowLeft');
    await area.press('Enter');
    await expect(frame.getByTestId('picked')).toContainText('#FF8C00');
  });

  test('the palette page lists the main colours and exports them', async ({ page }) => {
    await page.goto('/image/color-palette-from-image/');
    const frame = toolFrame(page);
    await frame.getByTestId('file-input').setInputFiles(await twoColours(page));
    const palette = frame.getByTestId('palette');
    await expect(palette).toContainText('#FF8C00');
    await expect(palette).toContainText('#006400');
    await expect(palette).toContainText('50%');
    await frame.getByText('CSS', { exact: true }).click();
    await expect(frame.getByTestId('palette-export')).toHaveValue(/--color-1: #(FF8C00|006400);/);
  });
});
