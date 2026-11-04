import { readFileSync } from 'node:fs';
import { PDFDocument } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { chooseFile, fixture, SITE_ORIGIN, toolFrame } from './helpers';
import { makePdf, openPdfTool, runAndDownload } from './pdf-helpers';

test.describe('Intent pages', () => {
  test('have their own title, heading and canonical URL, and link to their siblings', async ({
    page,
  }) => {
    await page.goto('/pdf/compress-pdf-to-200kb/');
    await expect(page).toHaveTitle(/Compress PDF to 200KB/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Compress a PDF to 200 KB');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      /\/pdf\/compress-pdf-to-200kb\/$/,
    );
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
    const nav = page.getByRole('navigation', { name: /Other Compress PDF pages/ });
    await expect(nav.getByRole('link', { name: '500 KB' })).toHaveAttribute(
      'href',
      '/pdf/compress-pdf-to-500kb/',
    );
    await expect(nav.getByRole('link', { name: '200 KB' })).toHaveCount(0);
  });

  test('are listed in the sitemap', async ({ request }) => {
    const sitemap = await (await request.get(`${SITE_ORIGIN}/sitemap.xml`)).text();
    for (const path of ['/pdf/compress-pdf-to-200kb/', '/forms/signature-resize-10-to-20kb/'])
      expect(sitemap).toContain(path);
  });

  test('Compress PDF to 200 KB opens with that target and meets it', async ({ page }) => {
    const doc = await PDFDocument.create();
    const photo = await doc.embedJpg(readFileSync(fixture('images/large-4000x3000.jpg')));
    doc.addPage([842, 595]).drawImage(photo, { x: 0, y: 0, width: 842, height: 595 });
    const input = {
      name: 'scan.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(await doc.save()),
    };
    const frame = await openPdfTool(page, '/pdf/compress-pdf-to-200kb/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(input);
    await expect(frame.getByTestId('target-size')).toHaveValue('200');
    const { bytes } = await runAndDownload(page, frame);
    expect(bytes.length).toBeLessThanOrEqual(200_000);
  });

  test('signature 10–20 KB opens with the range filled in', async ({ page }) => {
    await page.goto('/forms/signature-resize-10-to-20kb/');
    const frame = toolFrame(page);
    await chooseFile(frame, 'images/large-4000x3000.jpg');
    await expect(frame.getByTestId('min-kb')).toHaveValue('10');
    await expect(frame.getByTestId('max-kb')).toHaveValue('20');
  });

  test('Resize PDF to A4 opens on the resize setting', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/resize-pdf-to-a4/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('letter.pdf', 1));
    await expect(frame.getByTestId('paper')).toHaveValue('a4');
  });
});
