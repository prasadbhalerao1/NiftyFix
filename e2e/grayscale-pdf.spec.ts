import {
  decodePDFRawStream,
  PDFDocument,
  PDFName,
  PDFRawStream,
  StandardFonts,
  rgb,
} from '@cantoo/pdf-lib';
import { expect, test, type Page } from '@playwright/test';
import { colourLeft } from '../packages/engines/pdf/src/grayscale';
import { contentBytes } from '../packages/engines/pdf/src/content';
import { readFixture, recordProblems } from './helpers';
import { openPdfTool, runAndDownload, type PdfFile } from './pdf-helpers';

const JPEG = readFixture('images/portrait-1200x1600.jpg');

/** Red heading, blue body text, a green box and a colour photo. */
async function colourNotes(): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawRectangle({ x: 40, y: 700, width: 200, height: 60, color: rgb(0.2, 0.7, 0.3) });
  page.drawText('Heading', { x: 50, y: 780, size: 24, font, color: rgb(1, 0, 0) });
  page.drawText('Body text', { x: 50, y: 650, size: 12, font, color: rgb(0, 0, 1) });
  page.drawImage(await doc.embedJpg(JPEG), { x: 300, y: 300, width: 240, height: 320 });
  return { name: 'notes.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

const text = (doc: PDFDocument): string =>
  new TextDecoder('latin1').decode(contentBytes(doc.getPage(0).node.Contents(), doc));

function photo(doc: PDFDocument): PDFRawStream {
  for (const [, object] of doc.context.enumerateIndirectObjects()) {
    if (
      object instanceof PDFRawStream &&
      object.dict.lookup(PDFName.of('Subtype')) === PDFName.of('Image') &&
      object.dict.lookup(PDFName.of('Width'))?.toString() === '1200'
    ) {
      return object;
    }
  }
  throw new Error('photo not found');
}

/** Decode image bytes in the browser; returns [width, height]. */
async function decodes(page: Page, bytes: Uint8Array, type: string): Promise<number[]> {
  return page.evaluate(
    async ({ data, type }) => {
      const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)], { type }));
      return [bitmap.width, bitmap.height];
    },
    { data: [...bytes], type },
  );
}

test.describe('PDF to Black and White', () => {
  test('grayscale keeps text as text, makes the photo a one-channel JPEG and leaves no colour', async ({
    page,
  }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/pdf/grayscale-pdf/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await colourNotes());
    await expect(frame.getByTestId('tone-preview')).toBeVisible();
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('notes-grayscale.pdf');
    expect(colourLeft(doc)).toBe(0);
    const content = text(doc);
    expect(content).toContain('Tj');
    expect(content).not.toMatch(/ (rg|RG|k|K)\b/);
    const image = photo(doc);
    expect(image.dict.lookup(PDFName.of('ColorSpace'))).toBe(PDFName.of('DeviceGray'));
    expect(image.dict.lookup(PDFName.of('Filter'))).toBe(PDFName.of('DCTDecode'));
    // Our own gray JPEG encoder: the browser must decode it at full size.
    expect(await decodes(page, image.contents, 'image/jpeg')).toEqual([1200, 1600]);
    expect(image.contents.length).toBeLessThan(JPEG.length);
    expect(problems).toEqual([]);
  });

  test('black text makes every letter solid black', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/grayscale-pdf/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await colourNotes());
    await frame.getByText('Black text', { exact: true }).click();
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('notes-black-text.pdf');
    const content = text(doc);
    for (const block of content.match(/BT[\s\S]*?ET/g) ?? []) {
      const fills = block.match(/([\d.]+) g/g) ?? [];
      expect(fills.every((fill) => fill === '0 g')).toBe(true);
    }
    expect(colourLeft(doc)).toBe(0);
  });

  test('black and white makes 1-bit images', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/grayscale-pdf/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await colourNotes());
    await frame.getByText('Black & white', { exact: true }).click();
    await frame.getByText('Dither photos').click();
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('notes-black-and-white.pdf');
    const image = photo(doc);
    expect(image.dict.lookup(PDFName.of('BitsPerComponent'))?.toString()).toBe('1');
    const bits = decodePDFRawStream(image).decode();
    expect(bits.length).toBe(Math.ceil(1200 / 8) * 1600);
    expect(colourLeft(doc)).toBe(0);
  });
});
