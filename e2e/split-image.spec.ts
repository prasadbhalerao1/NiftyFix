import { readFileSync } from 'node:fs';
import { PDFDocument } from '@cantoo/pdf-lib';
import { unzipSync } from 'fflate';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { fixture, recordProblems } from './helpers';
import { openPdfTool } from './pdf-helpers';

const PHOTO = fixture('images/portrait-1200x1600.jpg');

async function save(page: Page, frame: FrameLocator): Promise<{ name: string; bytes: Buffer }> {
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
  await expect(frame.getByTestId('validation-report').locator('[data-status="fail"]')).toHaveCount(
    0,
  );
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  return { name: download.suggestedFilename(), bytes: readFileSync(await download.path()) };
}

test.describe('Split Image into a Grid', () => {
  test('a 2 × 2 grid keeps every original pixel', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/image/split-image/', /Choose an image/);
    await frame.getByTestId('file-input').setInputFiles(PHOTO);
    await expect(frame.getByTestId('grid-preview')).toBeVisible();
    const { name, bytes } = await save(page, frame);
    expect(name).toBe('portrait-1200x1600-grid.zip');
    const entries = unzipSync(new Uint8Array(bytes));
    expect(Object.keys(entries).sort()).toEqual([
      'portrait-1200x1600-row-1-col-1.jpg',
      'portrait-1200x1600-row-1-col-2.jpg',
      'portrait-1200x1600-row-2-col-1.jpg',
      'portrait-1200x1600-row-2-col-2.jpg',
    ]);
    for (const data of Object.values(entries)) {
      expect(readImageHeader(data)).toEqual({ format: 'jpeg', width: 600, height: 800 });
    }
    expect(problems).toEqual([]);
  });

  test('the Instagram page makes nine 1080 px tiles numbered in posting order', async ({
    page,
  }) => {
    const frame = await openPdfTool(page, '/image/instagram-grid-maker/', /Choose an image/);
    await frame.getByTestId('file-input').setInputFiles(PHOTO);
    await expect(frame.getByTestId('grid-preview').getByText('9', { exact: true })).toBeVisible();
    const { name, bytes } = await save(page, frame);
    expect(name).toBe('portrait-1200x1600-instagram-grid.zip');
    const entries = unzipSync(new Uint8Array(bytes));
    const names = Object.keys(entries).sort();
    expect(names).toHaveLength(9);
    expect(names[0]).toBe('portrait-1200x1600-post-01.jpg');
    expect(readImageHeader(entries[names[0] ?? ''] ?? new Uint8Array())).toEqual({
      format: 'jpeg',
      width: 1080,
      height: 1350,
    });
  });

  test('poster mode prints across A4 pages', async ({ page }) => {
    const frame = await openPdfTool(page, '/image/split-image/', /Choose an image/);
    await frame.getByTestId('file-input').setInputFiles(PHOTO);
    await frame.getByText('Poster', { exact: true }).click();
    const { name, bytes } = await save(page, frame);
    expect(name).toBe('portrait-1200x1600-poster.pdf');
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(4);
    expect(Math.round(doc.getPage(0).getWidth())).toBe(595);
  });
});
