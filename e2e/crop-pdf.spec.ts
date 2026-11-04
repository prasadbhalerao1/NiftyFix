import { PDFDocument } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { makePdf, openPdfTool, runAndDownload } from './pdf-helpers';

const PATH = '/pdf/crop-pdf/';
const CHOOSE = /Choose a PDF/;
const MM = 72 / 25.4;

test.describe('Crop and Resize PDF Pages', () => {
  test('crops the chosen margins, with a live preview', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('scan.pdf', 2, 200));
    await expect(frame.getByTestId('crop-preview')).toBeVisible();
    await frame.getByTestId('margin-left').fill('20');
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('scan-cropped.pdf');
    for (const index of [0, 1]) {
      const box = doc.getPage(index).getCropBox();
      expect(box.x).toBeCloseTo(20 * MM, 1);
      expect(box.y).toBeCloseTo(10 * MM, 1);
      expect(box.width).toBeCloseTo(200 + index - 30 * MM, 1);
      expect(box.height).toBeCloseTo(400 - 20 * MM, 1);
    }
    await expect(frame.getByTestId('result-warning')).toContainText('still inside the file');
  });

  test('refuses margins that would leave almost nothing', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('scan.pdf', 1, 200));
    await frame.getByTestId('margin-left').fill('60');
    await frame.getByTestId('margin-right').fill('60');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText('leave almost nothing');
  });

  test('resizes a US Letter page to A4 without distortion', async ({ page }) => {
    const letter = await PDFDocument.create();
    letter.addPage([612, 792]);
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles({
      name: 'letter.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(await letter.save()),
    });
    await frame.getByText('Resize pages', { exact: true }).click();
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('letter-a4.pdf');
    const media = doc.getPage(0).getMediaBox();
    expect(media.width).toBeCloseTo(595.28, 1);
    expect(media.height).toBeCloseTo(841.89, 1);
  });
});
