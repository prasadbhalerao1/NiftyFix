import { readFileSync } from 'node:fs';
import {
  concatTransformationMatrix,
  drawObject,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  type PDFPage,
  type PDFRef,
} from '@cantoo/pdf-lib';
import { unzipSync } from 'fflate';
import { expect, test, type FrameLocator, type Page } from '@playwright/test';
import { readJpegOrientation } from '../packages/engines/image/src/exif';
import { readImageHeader } from '../packages/engines/image/src/header';
import { readFixture, recordProblems } from './helpers';
import { makePdf, openPdfTool, type PdfFile } from './pdf-helpers';

const JPEG = readFixture('images/portrait-1200x1600.jpg');
const PNG = readFixture('images/transparent-800x800.png');
/** 2 × 1 pixels, an icon-sized image. */
const SPECK = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAAD0lEQVR4nGP4z8DwnwEIABf2A/2IoRWBAAAAAElFTkSuQmCC',
  'base64',
);

const pdfFile = async (name: string, doc: PDFDocument): Promise<PdfFile> => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from(await doc.save()),
});

/**
 * Page 1: the photo and a speck. Page 2: the transparent PNG and the photo
 * embedded a second time (a separate copy with identical bytes). Page 3: text only.
 */
async function brochure(): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const first = doc.addPage([600, 800]);
  first.drawImage(await doc.embedJpg(JPEG), { x: 0, y: 0, width: 300, height: 400 });
  first.drawImage(await doc.embedPng(SPECK), { x: 400, y: 400, width: 20, height: 10 });
  const second = doc.addPage([600, 800]);
  second.drawImage(await doc.embedPng(PNG), { x: 0, y: 0, width: 200, height: 200 });
  second.drawImage(await doc.embedJpg(JPEG), { x: 300, y: 0, width: 150, height: 200 });
  doc.addPage([600, 800]);
  return pdfFile('brochure.pdf', doc);
}

const IMAGE = { Type: 'XObject', Subtype: 'Image', BitsPerComponent: 8 };

function addImage(doc: PDFDocument, data: number[], dict: Record<string, unknown>): PDFRef {
  return doc.context.register(
    doc.context.flateStream(Uint8Array.from(data), { ...IMAGE, ...dict } as never),
  );
}

/** Draw an image XObject with the matrix [a b c d e f]. */
function draw(page: PDFPage, ref: PDFRef, [a, b, c, d, e, f]: number[]): void {
  page.pushOperators(
    pushGraphicsState(),
    concatTransformationMatrix(a ?? 1, b ?? 0, c ?? 0, d ?? 1, e ?? 0, f ?? 0),
    drawObject(page.node.newXObject('Im', ref)),
    popGraphicsState(),
  );
}

const RED = [255, 0, 0];
const GREEN = [0, 255, 0];
const BLUE = [0, 0, 255];
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const repeat = (pixel: number[], count: number): number[] =>
  Array.from({ length: count }, () => pixel).flat();

/**
 * Page 1: a CMYK image and a stencil mask (formats that need the full decoders).
 * Page 2: one picture stored as three strips (red, green, blue rows).
 * Page 3: an image and the photo, both drawn turned a quarter left, then an inline image.
 */
async function tricky(): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const first = doc.addPage([600, 800]);
  const cyan = addImage(doc, repeat([255, 0, 0, 0], 8), {
    Width: 4,
    Height: 2,
    ColorSpace: 'DeviceCMYK',
  });
  draw(first, cyan, [100, 0, 0, 50, 50, 600]);
  const stencil = addImage(doc, [0b11110000], {
    Width: 8,
    Height: 1,
    BitsPerComponent: 1,
    ImageMask: true,
  });
  draw(first, stencil, [80, 0, 0, 10, 50, 500]);
  const second = doc.addPage([600, 800]);
  [RED, GREEN, BLUE].forEach((colour, i) => {
    const strip = addImage(doc, repeat(colour, 12), {
      Width: 6,
      Height: 2,
      ColorSpace: 'DeviceRGB',
    });
    draw(second, strip, [60, 0, 0, 20, 50, 500 - 20 * i]);
  });
  const third = doc.addPage([600, 800]);
  // Red top-left pixel, the rest white.
  const marked = addImage(doc, [...RED, ...repeat(WHITE, 7)], {
    Width: 4,
    Height: 2,
    ColorSpace: 'DeviceRGB',
  });
  draw(third, marked, [0, 80, -40, 0, 100, 100]);
  const photo = await doc.embedJpg(JPEG);
  draw(third, photo.ref, [0, 300, -400, 0, 500, 300]);
  // An inline 3 × 3 gray ramp (black, gray, white in every row).
  const head = new TextEncoder().encode('q 30 0 0 30 400 600 cm BI /W 3 /H 3 /CS /G /BPC 8 ID ');
  const tail = new TextEncoder().encode(' EI Q');
  const inline = new Uint8Array([...head, ...repeat([0, 128, 255], 3), ...tail]);
  third.node.addContentStream(doc.context.register(doc.context.stream(inline)));
  return pdfFile('tricky.pdf', doc);
}

/** Decode a PNG in the browser: size and RGBA pixels. */
async function pixels(
  page: Page,
  bytes: Uint8Array,
): Promise<{ width: number; height: number; data: number[] }> {
  return page.evaluate(
    async (data) => {
      const bitmap = await createImageBitmap(
        new Blob([new Uint8Array(data)], { type: 'image/png' }),
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no context');
      ctx.drawImage(bitmap, 0, 0);
      const image = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
      return { width: image.width, height: image.height, data: [...image.data] };
    },
    [...bytes],
  );
}

const pixelAt = (image: { width: number; data: number[] }, x: number, y: number): number[] =>
  image.data.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 3);

async function extract(
  page: Page,
  frame: FrameLocator,
  file: PdfFile,
  settings?: () => Promise<void>,
): Promise<void> {
  await frame.getByTestId('file-input').setInputFiles(file);
  await expect(frame.getByTestId('chosen-file')).toContainText(file.name);
  await settings?.();
  await frame.getByTestId('prepare').click();
  await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
  await expect(frame.getByTestId('validation-report').locator('[data-status="fail"]')).toHaveCount(
    0,
  );
}

async function save(page: Page, button: ReturnType<FrameLocator['getByTestId']>) {
  const [file] = await Promise.all([page.waitForEvent('download'), button.click()]);
  return { name: file.suggestedFilename(), bytes: readFileSync(await file.path()) };
}

test.describe('Extract Images from PDF', () => {
  test('saves each image once at original quality, skipping icons', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/pdf/extract-pdf-images/', /Choose a PDF/);
    await extract(page, frame, await brochure());
    await expect(frame.getByTestId('result')).toContainText('Repeats skipped');
    const { name, bytes } = await save(page, frame.getByTestId('download'));
    expect(name).toBe('brochure-images.zip');
    const entries = unzipSync(new Uint8Array(bytes));
    expect(Object.keys(entries)).toEqual([
      'brochure-page-1-image-1.jpg',
      'brochure-page-2-image-1.png',
    ]);
    // The JPEG is the exact file that was put into the PDF.
    expect(Buffer.from(entries['brochure-page-1-image-1.jpg'] ?? [])).toEqual(JPEG);
    expect(readImageHeader(entries['brochure-page-2-image-1.png'] ?? new Uint8Array())).toEqual({
      format: 'png',
      width: 800,
      height: 800,
    });
    expect(problems).toEqual([]);
  });

  test('downloads only the images ticked in the gallery', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/extract-pdf-images/', /Choose a PDF/);
    await extract(page, frame, await brochure());
    const gallery = frame.getByTestId('image-gallery');
    await expect(gallery.locator('img')).toHaveCount(2);
    await gallery.getByRole('checkbox', { name: 'brochure-page-1-image-1.jpg' }).uncheck();
    const { name, bytes } = await save(page, frame.getByTestId('download-selected'));
    expect(name).toBe('brochure-page-2-image-1.png');
    expect(readImageHeader(bytes)?.format).toBe('png');
  });

  test('decodes every format, joins strips and turns pictures as the page shows them', async ({
    page,
  }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/pdf/extract-pdf-images/', /Choose a PDF/);
    await extract(page, frame, await tricky(), () =>
      frame.getByText('Keep all', { exact: true }).click(),
    );
    await expect(frame.getByTestId('result')).toContainText('3 pieces into 1');
    const { bytes } = await save(page, frame.getByTestId('download'));
    const entries = unzipSync(new Uint8Array(bytes));
    expect(Object.keys(entries)).toEqual([
      'tricky-page-1-image-1.png',
      'tricky-page-1-image-2.png',
      'tricky-page-2-image-1.png',
      'tricky-page-3-image-1.png',
      'tricky-page-3-image-2.jpg',
      'tricky-page-3-image-3.png',
    ]);
    const entry = (name: string): Uint8Array => entries[`tricky-${name}`] ?? new Uint8Array();

    // CMYK cyan comes out as RGB cyan.
    const [r, , b] = pixelAt(await pixels(page, entry('page-1-image-1.png')), 0, 0);
    expect(r).toBeLessThan(80);
    expect(b).toBeGreaterThan(180);
    // The stencil paints its 0 bits: 11110000 is 4 blank (white) then 4 black.
    const mask = await pixels(page, entry('page-1-image-2.png'));
    expect([pixelAt(mask, 0, 0), pixelAt(mask, 7, 0)]).toEqual([WHITE, BLACK]);
    // Three strips, one picture: red, green and blue bands top to bottom.
    const joined = await pixels(page, entry('page-2-image-1.png'));
    expect([joined.width, joined.height]).toEqual([6, 6]);
    expect([pixelAt(joined, 0, 0), pixelAt(joined, 5, 2), pixelAt(joined, 3, 5)]).toEqual([
      RED,
      GREEN,
      BLUE,
    ]);
    // Turned a quarter left on the page: the stored top-left (red) is now bottom-left.
    const turned = await pixels(page, entry('page-3-image-1.png'));
    expect([turned.width, turned.height]).toEqual([2, 4]);
    expect(pixelAt(turned, 0, 3)).toEqual(RED);
    // The JPEG keeps its data; only its orientation tag says how to show it.
    const photo = entry('page-3-image-2.jpg');
    expect(readImageHeader(photo)).toEqual({ format: 'jpeg', width: 1200, height: 1600 });
    expect(readJpegOrientation(photo)).toBe(8);
    const inline = await pixels(page, entry('page-3-image-3.png'));
    expect([pixelAt(inline, 0, 1), pixelAt(inline, 2, 1)]).toEqual([BLACK, WHITE]);
    expect(problems).toEqual([]);
  });

  test('opens a password-protected PDF with its password', async ({ page }) => {
    const doc = await PDFDocument.create();
    const photo = await doc.embedJpg(JPEG);
    doc.addPage([600, 800]).drawImage(photo, { x: 0, y: 0, width: 300, height: 400 });
    doc.encrypt({ userPassword: 'SURE1990', ownerPassword: 'owner' });
    const frame = await openPdfTool(page, '/pdf/extract-photo-from-pdf/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await pdfFile('eaadhaar.pdf', doc));
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText('protected with a password');
    await frame.getByTestId('pdf-password').fill('SURE1990');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('result')).toBeVisible({ timeout: 30_000 });
    const { name, bytes } = await save(page, frame.getByTestId('download'));
    expect(name).toBe('eaadhaar-page-1-image-1.jpg');
    expect(Buffer.from(bytes)).toEqual(JPEG);
  });

  test('the photo page explains a PDF with no pictures in it', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/extract-photo-from-pdf/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('letter.pdf', 2));
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText(
      'No images were found on the chosen pages.',
    );
    await expect(frame.getByTestId('error-view')).toContainText('PDF to JPG');
  });
});
