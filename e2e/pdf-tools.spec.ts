import { readFileSync } from 'node:fs';
import { PDFArray, PDFDocument } from '@cantoo/pdf-lib';
import { unzipSync } from 'fflate';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { fixture, recordProblems } from './helpers';
import { makePdf, openPdfTool, pageWidths, runAndDownload, type PdfFile } from './pdf-helpers';

const CHOOSE_PDF = /Choose a PDF/;

async function choose(frame: FrameLocator, file: PdfFile): Promise<void> {
  await frame.getByTestId('file-input').setInputFiles(file);
  await expect(frame.getByTestId('chosen-file')).toContainText(file.name);
}

/** Number of content streams on a page: drawing text on top of a page adds one. */
const contentStreams = (doc: PDFDocument, index: number): number => {
  const contents = doc.getPage(index).node.Contents();
  return contents instanceof PDFArray ? contents.size() : contents ? 1 : 0;
};

async function download(page: Page, frame: FrameLocator): Promise<{ name: string; bytes: Buffer }> {
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
  await expect(frame.getByTestId('validation-report').locator('[data-status="fail"]')).toHaveCount(
    0,
  );
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    frame.getByTestId('download').click(),
  ]);
  return { name: file.suggestedFilename(), bytes: readFileSync(await file.path()) };
}

test.describe('Split PDF', () => {
  test('splits every page into its own file inside a ZIP', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/pdf/split-pdf/', CHOOSE_PDF);
    await choose(frame, await makePdf('report.pdf', 3, 200));
    const { name, bytes } = await download(page, frame);
    expect(name).toBe('report-split.zip');
    const entries = unzipSync(new Uint8Array(bytes));
    expect(Object.keys(entries)).toEqual([
      'report-pages-1.pdf',
      'report-pages-2.pdf',
      'report-pages-3.pdf',
    ]);
    for (const [index, data] of Object.values(entries).entries()) {
      expect(pageWidths(await PDFDocument.load(data))).toEqual([200 + index]);
    }
    expect(problems).toEqual([]);
  });

  test('splits by ranges, one file per range', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/split-pdf/', CHOOSE_PDF);
    await choose(frame, await makePdf('scan.pdf', 6, 300));
    await frame.getByText('By ranges', { exact: true }).click();
    await frame.getByTestId('page-ranges').fill('1-2, 3, 4-');
    const { bytes } = await download(page, frame);
    const entries = unzipSync(new Uint8Array(bytes));
    const docs = await Promise.all(Object.values(entries).map((data) => PDFDocument.load(data)));
    expect(docs.map(pageWidths)).toEqual([[300, 301], [302], [303, 304, 305]]);
  });

  test('a single range downloads a PDF directly, not a ZIP', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/split-pdf/', CHOOSE_PDF);
    await choose(frame, await makePdf('scan.pdf', 4, 300));
    await frame.getByText('By ranges', { exact: true }).click();
    await frame.getByTestId('page-ranges').fill('2-3');
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('scan-pages-2-3.pdf');
    expect(pageWidths(doc)).toEqual([301, 302]);
  });

  test('explains a range past the last page', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/split-pdf/', CHOOSE_PDF);
    await choose(frame, await makePdf('short.pdf', 3));
    await frame.getByText('By ranges', { exact: true }).click();
    await frame.getByTestId('page-ranges').fill('1, 5');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText('This PDF has 3 pages');
  });
});

test.describe('Extract PDF Pages', () => {
  test('extracts pages in the typed order', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/extract-pdf-pages/', CHOOSE_PDF);
    await choose(frame, await makePdf('bundle.pdf', 5, 200));
    await expect(frame.getByTestId('prepare')).toBeDisabled();
    await frame.getByTestId('page-ranges').fill('4, 1-2');
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('bundle-pages.pdf');
    expect(pageWidths(doc)).toEqual([203, 200, 201]);
  });

  test('shows a syntax error as you type', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/extract-pdf-pages/', CHOOSE_PDF);
    await choose(frame, await makePdf('bundle.pdf', 5));
    await frame.getByTestId('page-ranges').fill('5-2');
    await expect(frame.getByText('runs backwards')).toBeVisible();
    await expect(frame.getByTestId('prepare')).toBeDisabled();
  });
});

test.describe('Rotate PDF', () => {
  test('rotates only the chosen pages and leaves the rest untouched', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/rotate-pdf/', CHOOSE_PDF);
    await choose(frame, await makePdf('scan.pdf', 3));
    await frame.getByText('Upside down', { exact: true }).click();
    await frame.getByText('Choose pages', { exact: true }).click();
    await frame.getByTestId('page-ranges').fill('2');
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('scan-rotated.pdf');
    expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([0, 180, 0]);
  });
});

test.describe('Add Page Numbers', () => {
  test('numbers the selected pages only', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/add-page-numbers/', CHOOSE_PDF);
    const input = await makePdf('thesis.pdf', 4);
    await choose(frame, input);
    await frame.getByTestId('style').selectOption('page-of');
    await frame.getByText('Choose pages', { exact: true }).click();
    await frame.getByTestId('page-ranges').fill('2-');
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('thesis-numbered.pdf');
    const original = await PDFDocument.load(input.buffer);
    // Page 1 untouched; pages 2-4 gained a drawing.
    expect(contentStreams(doc, 0)).toBe(contentStreams(original, 0));
    for (const index of [1, 2, 3]) {
      expect(contentStreams(doc, index)).toBeGreaterThan(contentStreams(original, index));
    }
  });
});

test.describe('Watermark PDF', () => {
  test('watermarks every page', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/watermark-pdf/', CHOOSE_PDF);
    const input = await makePdf('id.pdf', 2);
    await choose(frame, input);
    await frame.getByTestId('watermark-text').fill('Only for bank KYC, Nov 2026');
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('id-watermarked.pdf');
    const original = await PDFDocument.load(input.buffer);
    for (const index of [0, 1]) {
      expect(contentStreams(doc, index)).toBeGreaterThan(contentStreams(original, index));
    }
  });

  test('refuses text the font cannot draw instead of printing garbage', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/watermark-pdf/', CHOOSE_PDF);
    await choose(frame, await makePdf('id.pdf', 1));
    await frame.getByTestId('watermark-text').fill('केवल बैंक के लिए');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText('can only use Latin letters');
  });
});

test.describe('JPG to PDF', () => {
  test('one upright page per image, in order, sized to the image shape', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/pdf/image-to-pdf/', /Choose images/);
    await frame
      .getByTestId('file-input')
      .setInputFiles([
        fixture('images/portrait-1200x1600.jpg'),
        fixture('images/exif-rotated-6.jpg'),
        fixture('images/landscape-webp-1000x700.webp'),
      ]);
    await expect(frame.getByTestId('queued-file')).toHaveCount(3);
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('portrait-1200x1600-images.pdf');
    const shape = doc
      .getPages()
      .map((p) => (p.getWidth() > p.getHeight() ? 'landscape' : 'portrait'));
    // The EXIF-rotated photo is stored sideways but must come out upright (portrait).
    expect(shape).toEqual(['portrait', 'portrait', 'landscape']);
    await expect(frame.getByText('Converted or turned upright')).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('image size pages match each image exactly', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/image-to-pdf/', /Choose images/);
    await frame
      .getByTestId('file-input')
      .setInputFiles([fixture('images/transparent-800x800.png')]);
    await frame.getByText('Image size', { exact: true }).click();
    const { doc } = await runAndDownload(page, frame);
    expect([doc.getPage(0).getWidth(), doc.getPage(0).getHeight()]).toEqual([800, 800]);
  });
});

test.describe('Flatten PDF', () => {
  test('turns form fields into page content', async ({ page }) => {
    const form = await PDFDocument.create();
    const formPage = form.addPage([300, 300]);
    const field = form.getForm().createTextField('name');
    field.setText('Asha Rao');
    field.addToPage(formPage, { x: 20, y: 200, width: 200, height: 24 });
    const frame = await openPdfTool(page, '/pdf/flatten-pdf/', /Choose a filled PDF form/);
    await choose(frame, {
      name: 'form.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(await form.save()),
    });
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('form-flattened.pdf');
    expect(doc.getForm().getFields()).toHaveLength(0);
    await expect(frame.getByText('Form fields flattened')).toBeVisible();
  });

  test('says so when there was nothing to flatten', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/flatten-pdf/', /Choose a filled PDF form/);
    await choose(frame, await makePdf('plain.pdf', 1));
    await runAndDownload(page, frame);
    await expect(frame.getByTestId('result-warning')).toContainText('no form fields');
  });
});
