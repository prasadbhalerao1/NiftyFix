import { readFileSync } from 'node:fs';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { openPdfTool } from './pdf-helpers';
import { recordProblems } from './helpers';

/** A 600 × 300 PNG: white card, a red block on the left, an Aadhaar-style number on the right. */
async function card(
  page: Page,
  number = '1234 5678 9012',
): Promise<{ name: string; mimeType: string; buffer: Buffer }> {
  const base64 = await page.evaluate((text) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no context');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 300);
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(20, 20, 160, 160);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(text, 230, 240);
    return canvas.toDataURL('image/png').split(',')[1] ?? '';
  }, number);
  return { name: 'card.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') };
}

/** Pixel colour at (x, y) of a downloaded image, decoded in the browser. */
async function pixel(page: Page, bytes: Buffer, x: number, y: number): Promise<number[]> {
  return page.evaluate(
    async ({ data, x, y }) => {
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)]));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no context');
      ctx.drawImage(bitmap, 0, 0);
      return [...ctx.getImageData(x, y, 1, 1).data.slice(0, 3)];
    },
    { data: [...bytes], x, y },
  );
}

/** Drag across the drawing area between two points given as fractions of its size. */
async function drag(page: Page, frame: FrameLocator, from: [number, number], to: [number, number]) {
  const box = await frame.getByTestId('redact-area').boundingBox();
  if (!box) throw new Error('no drawing area');
  await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 5 });
  await page.mouse.up();
}

async function save(page: Page, frame: FrameLocator): Promise<Buffer> {
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
  await expect(frame.getByTestId('validation-report').locator('[data-status="fail"]')).toHaveCount(
    0,
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  return readFileSync(await download.path());
}

test.describe('Blur and Redact Image', () => {
  test('a drawn black box covers exactly its area', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/image/blur-image/', /Choose an image/);
    await frame.getByTestId('file-input').setInputFiles(await card(page));
    // Over the red block: from (10%, 10%) to (25%, 50%) of 600 × 300.
    await drag(page, frame, [0.1, 0.1], [0.25, 0.5]);
    await expect(frame.getByRole('button', { name: /Area 1, black box/ })).toBeVisible();
    const bytes = await save(page, frame);
    expect(await pixel(page, bytes, 100, 100)).toEqual([0, 0, 0]);
    // Outside the box the red block is untouched.
    expect(await pixel(page, bytes, 170, 170)).toEqual([255, 0, 0]);
    expect(problems).toEqual([]);
  });

  test('a box can switch to pixelate and still saves', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/blur-image/', /Choose an image/);
    await frame.getByTestId('file-input').setInputFiles(await card(page));
    await drag(page, frame, [0.02, 0.02], [0.4, 0.7]);
    await frame.getByText('Pixelate', { exact: true }).click();
    await expect(frame.getByRole('button', { name: /Area 1, pixelated/ })).toBeVisible();
    const bytes = await save(page, frame);
    // The red/white edge is averaged into a mixed block colour.
    const edge = await pixel(page, bytes, 182, 100);
    expect(edge[0]).toBeGreaterThan(200);
    expect(edge[1]).toBeGreaterThan(0);
    expect(edge[1]).toBeLessThan(255);
  });

  test('the masked Aadhaar page finds the number and hides the first 8 digits', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const frame = await openPdfTool(page, '/image/mask-aadhaar/', /Choose an image/);
    await frame.getByTestId('file-input').setInputFiles(await card(page));
    await expect(frame.getByTestId('find-status')).toContainText('Covered 1 Aadhaar number', {
      timeout: 90_000,
    });
    const bytes = await save(page, frame);
    // "1234 5678" (left part of the text) is black; the last group "9012" still shows white paper around it.
    expect(await pixel(page, bytes, 260, 228)).toEqual([0, 0, 0]);
    expect(await pixel(page, bytes, 560, 200)).toEqual([255, 255, 255]);
  });
});
