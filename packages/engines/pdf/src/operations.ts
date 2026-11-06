import {
  degrees,
  PDFDict,
  PDFName,
  PDFRef,
  rgb,
  StandardFonts,
  type PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from '@cantoo/pdf-lib';
import { ToolError } from '@niftyfix/tool-sdk';
import { createPdf } from './document';

/**
 * Page-level operations. Each takes parsed documents and returns a new or
 * modified document; none reads files or touches the DOM, so all run in a
 * worker and in Node tests.
 */

/** Copy the selected pages of each source, in order, into one new document. */
export async function combinePages(
  sources: readonly { doc: PDFDocument; pages: readonly number[] }[],
  signal?: AbortSignal,
): Promise<PDFDocument> {
  const out = await createPdf();
  for (const { doc, pages } of sources) {
    signal?.throwIfAborted();
    const copied = await out.copyPages(doc, [...pages]);
    for (const page of copied) out.addPage(page);
  }
  return out;
}

export type Rotation = 90 | 180 | 270;

/** Rotate pages clockwise, adding to any rotation they already have. */
export function rotatePages(doc: PDFDocument, pages: readonly number[], by: Rotation): void {
  for (const index of pages) {
    const page = doc.getPage(index);
    page.setRotation(degrees((((page.getRotation().angle + by) % 360) + 360) % 360));
  }
}

/**
 * Standard fonts only cover Latin text (WinAnsi). The library does not reject
 * other characters (it would print garbage) so check the font's own
 * character set and refuse with a clear message.
 */
function checkEncodable(font: PDFFont, text: string, what: string): void {
  const supported = new Set(font.getCharacterSet());
  const unsupported = [...text].some((char) => !supported.has(char.codePointAt(0) ?? -1));
  if (unsupported) {
    throw new ToolError(
      'INVALID_OPTIONS',
      `${what} can only use Latin letters, digits and common punctuation for now.`,
      { hint: 'Remove characters such as Hindi or emoji and try again.' },
    );
  }
}

export type NumberPosition =
  'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

export interface PageNumberOptions {
  position: NumberPosition;
  /** "{n}" and "{total}" are replaced, e.g. "Page {n} of {total}". */
  template: string;
  /** Number shown on the first numbered page. */
  start: number;
  /** Pages to number (indices); others are left untouched. */
  pages: readonly number[];
  fontSize: number;
  /** Distance from the page edge, in points. */
  margin: number;
}

/** Stamp page numbers, positioned on each page's visible box and upright on rotated pages. */
export async function addPageNumbers(doc: PDFDocument, options: PageNumberOptions): Promise<void> {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const total = options.pages.length + options.start - 1;
  options.pages.forEach((index, order) => {
    const text = options.template
      .replaceAll('{n}', String(options.start + order))
      .replaceAll('{total}', String(total));
    checkEncodable(font, text, 'The page number text');
    const page = doc.getPage(index);
    const box = page.getCropBox();
    const width = font.widthOfTextAtSize(text, options.fontSize);
    const [vertical, horizontal] = options.position.split('-') as [string, string];
    const rotation = page.getRotation().angle % 360;
    // Work in the page as the reader sees it, then map back for rotated pages.
    const viewW = rotation === 90 || rotation === 270 ? box.height : box.width;
    const viewH = rotation === 90 || rotation === 270 ? box.width : box.height;
    const vx =
      horizontal === 'left'
        ? options.margin
        : horizontal === 'right'
          ? viewW - options.margin - width
          : (viewW - width) / 2;
    const vy = vertical === 'top' ? viewH - options.margin - options.fontSize : options.margin;
    const [x, y] =
      rotation === 90
        ? [box.width - vy, vx]
        : rotation === 180
          ? [box.width - vx, box.height - vy]
          : rotation === 270
            ? [vy, box.height - vx]
            : [vx, vy];
    page.drawText(text, {
      x: box.x + x,
      y: box.y + y,
      size: options.fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
      rotate: degrees(rotation),
    });
  });
}

export interface TextWatermarkOptions {
  text: string;
  /** 0–1 */
  opacity: number;
  /** Font size in points. */
  fontSize: number;
  /** Diagonal (45°) across the page, or horizontal in the centre. */
  layout: 'diagonal' | 'horizontal';
  /** RGB 0–1. */
  color: readonly [number, number, number];
  pages: readonly number[];
}

/** Draw a centred text watermark on each selected page. */
export async function addTextWatermark(
  doc: PDFDocument,
  options: TextWatermarkOptions,
): Promise<void> {
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  checkEncodable(font, options.text, 'The watermark');
  const angle = options.layout === 'diagonal' ? 45 : 0;
  const radians = (angle * Math.PI) / 180;
  for (const index of options.pages) {
    const page = doc.getPage(index);
    const box = page.getCropBox();
    // Shrink to fit the page diagonal/width so the text is never cut off.
    const room =
      options.layout === 'diagonal' ? Math.hypot(box.width, box.height) * 0.8 : box.width * 0.85;
    const size = Math.min(
      options.fontSize,
      (options.fontSize * room) / font.widthOfTextAtSize(options.text, options.fontSize),
    );
    const width = font.widthOfTextAtSize(options.text, size);
    const height = font.heightAtSize(size);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    page.drawText(options.text, {
      x: cx - (Math.cos(radians) * width) / 2 + (Math.sin(radians) * height) / 2,
      y: cy - (Math.sin(radians) * width) / 2 - (Math.cos(radians) * height) / 2,
      size,
      font,
      color: rgb(...options.color),
      opacity: options.opacity,
      rotate: degrees(angle),
    });
  }
}

export type PageSize = 'a4' | 'letter' | 'fit';

const PAGE_SIZES: Record<Exclude<PageSize, 'fit'>, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

export interface ImagePageOptions {
  pageSize: PageSize;
  orientation: 'auto' | 'portrait' | 'landscape';
  /** Margin in points (ignored for 'fit'). */
  margin: number;
}

/** Add one page per image (JPEG or PNG bytes), scaled to fit without distortion or cropping. */
export async function addImagePages(
  doc: PDFDocument,
  images: readonly { bytes: Uint8Array; format: 'jpeg' | 'png' }[],
  options: ImagePageOptions,
  signal?: AbortSignal,
): Promise<void> {
  for (const image of images) {
    signal?.throwIfAborted();
    const embedded =
      image.format === 'jpeg' ? await doc.embedJpg(image.bytes) : await doc.embedPng(image.bytes);
    const { width: iw, height: ih } = embedded;
    if (options.pageSize === 'fit') {
      doc.addPage([iw, ih]).drawImage(embedded, { x: 0, y: 0, width: iw, height: ih });
      continue;
    }
    let [pw, ph] = PAGE_SIZES[options.pageSize];
    const landscape =
      options.orientation === 'landscape' || (options.orientation === 'auto' && iw > ih);
    if (landscape) [pw, ph] = [ph, pw];
    const scale = Math.min((pw - 2 * options.margin) / iw, (ph - 2 * options.margin) / ih, 1e6);
    const w = iw * scale;
    const h = ih * scale;
    doc
      .addPage([pw, ph])
      .drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
}

/** A rectangle on the page as the reader sees it, as fractions of the visible page (0–1, from top-left). */
export interface DisplayRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Draw an embedded image at a rectangle given in displayed-page fractions,
 * upright as the reader sees it, also on pages stored rotated.
 */
export function placeImage(page: PDFPage, image: PDFImage, rect: DisplayRect): void {
  const box = page.getCropBox();
  const rotation = ((page.getRotation().angle % 360) + 360) % 360;
  const sideways = rotation === 90 || rotation === 270;
  const viewW = sideways ? box.height : box.width;
  const viewH = sideways ? box.width : box.height;
  const w = rect.width * viewW;
  const h = rect.height * viewH;
  // Bottom-left corner of the rectangle in displayed coordinates (origin bottom-left).
  const vx = rect.x * viewW;
  const vy = viewH - (rect.y + rect.height) * viewH;
  const [x, y] =
    rotation === 90
      ? [box.width - vy, vx]
      : rotation === 180
        ? [box.width - vx, box.height - vy]
        : rotation === 270
          ? [vy, box.height - vx]
          : [vx, vy];
  page.drawImage(image, {
    x: box.x + x,
    y: box.y + y,
    width: w,
    height: h,
    rotate: degrees(rotation),
  });
}

/** Number of images and other drawable objects a page's resources hold (to verify a stamp landed). */
export function countPageXObjects(page: PDFPage): number {
  const xobjects = page.node.Resources()?.lookup(PDFName.of('XObject'));
  return xobjects instanceof PDFDict ? xobjects.keys().length : 0;
}

/** Points per millimetre. */
export const PT_PER_MM = 72 / 25.4;

export const PAPER_SIZES = {
  a4: { label: 'A4', width: 595.28, height: 841.89 },
  letter: { label: 'US Letter', width: 612, height: 792 },
  legal: { label: 'US Legal', width: 612, height: 1008 },
  a3: { label: 'A3', width: 841.89, height: 1190.55 },
  a5: { label: 'A5', width: 419.53, height: 595.28 },
} as const;
export type PaperSize = keyof typeof PAPER_SIZES;

/** Margins as the reader sees the page (top = top of the displayed page), in points. */
export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Smallest visible area a crop may leave, in points (half an inch). */
export const MIN_CROPPED_SIDE = 36;

/**
 * Trim margins off the visible page. Works in the orientation the reader
 * sees: on a page stored rotated, "top" still means the displayed top.
 * Only the crop box changes: the trimmed content stays in the file.
 * Returns false (and leaves the page alone) if too little would remain.
 */
export function cropPage(page: PDFPage, margins: Margins): boolean {
  const box = page.getCropBox();
  const rotation = ((page.getRotation().angle % 360) + 360) % 360;
  // Map displayed edges to the page's own coordinate edges.
  const { top, right, bottom, left } = margins;
  const user =
    rotation === 90
      ? { left: top, top: right, right: bottom, bottom: left }
      : rotation === 180
        ? { left: right, right: left, top: bottom, bottom: top }
        : rotation === 270
          ? { right: top, bottom: right, left: bottom, top: left }
          : { left, right, top, bottom };
  const width = box.width - user.left - user.right;
  const height = box.height - user.top - user.bottom;
  if (width < MIN_CROPPED_SIDE || height < MIN_CROPPED_SIDE) return false;
  page.setCropBox(box.x + user.left, box.y + user.bottom, width, height);
  return true;
}

/**
 * Put a page on a standard paper size: content and annotations scale
 * together (links stay on their text) to fit without distortion, centred by
 * moving the page box rather than the content. Orientation follows the page.
 */
export function fitPageToPaper(page: PDFPage, paper: { width: number; height: number }): void {
  const visible = page.getCropBox();
  const sideways = page.getRotation().angle % 180 !== 0;
  // Compare in the page's own (unrotated) coordinates.
  const landscape = sideways ? visible.height > visible.width : visible.width > visible.height;
  const short = Math.min(paper.width, paper.height);
  const long = Math.max(paper.width, paper.height);
  const [targetW, targetH] = landscape !== sideways ? [long, short] : [short, long];
  const scale = Math.min(targetW / visible.width, targetH / visible.height);
  page.scale(scale, scale);
  const box = page.getCropBox();
  const x = box.x - (targetW - box.width) / 2;
  const y = box.y - (targetH - box.height) / 2;
  page.setMediaBox(x, y, targetW, targetH);
  page.setCropBox(x, y, targetW, targetH);
  page.setTrimBox(x, y, targetW, targetH);
  page.setBleedBox(x, y, targetW, targetH);
}

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
}

export function readMetadata(doc: PDFDocument): PdfMetadata {
  return {
    title: doc.getTitle() ?? '',
    author: doc.getAuthor() ?? '',
    subject: doc.getSubject() ?? '',
    keywords: doc.getKeywords() ?? '',
    creator: doc.getCreator() ?? '',
  };
}

/** Replace document information. Empty strings clear a field. */
export function writeMetadata(doc: PDFDocument, metadata: PdfMetadata): void {
  doc.setTitle(metadata.title);
  doc.setAuthor(metadata.author);
  doc.setSubject(metadata.subject);
  doc.setKeywords(metadata.keywords === '' ? [] : metadata.keywords.split(/\s*,\s*/));
  doc.setCreator(metadata.creator);
}

/**
 * Remove every trace of document information: the Info dictionary fields and
 * the XMP metadata stream (a second, often forgotten copy of the same details).
 */
export function removeAllMetadata(doc: PDFDocument): void {
  writeMetadata(doc, { title: '', author: '', subject: '', keywords: '', creator: '' });
  doc.setProducer('');
  // Delete the stream object itself: an unlinked object is still written into the
  // saved file, where the details remain readable.
  const xmp = doc.catalog.get(PDFName.of('Metadata'));
  doc.catalog.delete(PDFName.of('Metadata'));
  if (xmp instanceof PDFRef) doc.context.delete(xmp);
}

/** Whether the document still carries an XMP metadata stream. */
export const hasXmpMetadata = (doc: PDFDocument): boolean =>
  doc.catalog.get(PDFName.of('Metadata')) !== undefined;

/** Make form fields permanent page content. Returns how many fields were flattened. */
export function flattenForm(doc: PDFDocument): number {
  const form = doc.getForm();
  const count = form.getFields().length;
  if (count > 0) form.flatten();
  return count;
}

/** Where one source page goes on a sheet: a box in points, origin bottom left. */
export interface SheetSlot {
  /** Source page index, or null for a blank slot. */
  page: number | null;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Draw source pages onto new sheets (pages per sheet, booklets). Pages are
 * embedded as vector content, so text stays sharp and selectable; each is
 * shown upright as the reader sees it (its /Rotate is applied), scaled to fit
 * its slot and centred. Links and form fields do not carry over.
 */
export async function placePagesOnSheets(
  source: PDFDocument,
  sheets: readonly { width: number; height: number; slots: readonly SheetSlot[] }[],
  options: { frame: boolean },
  signal?: AbortSignal,
): Promise<PDFDocument> {
  const out = await createPdf();
  const used = [...new Set(sheets.flatMap((sheet) => sheet.slots.map((slot) => slot.page)))]
    .filter((page): page is number => page !== null)
    .sort((a, b) => a - b);
  const pages = used.map((index) => source.getPage(index));
  const embedded = await out.embedPages(
    pages,
    pages.map((page) => {
      const box = page.getCropBox();
      return { left: box.x, bottom: box.y, right: box.x + box.width, top: box.y + box.height };
    }),
  );
  const byIndex = new Map(used.map((index, i) => [index, i] as const));

  for (const sheet of sheets) {
    signal?.throwIfAborted();
    const target = out.addPage([sheet.width, sheet.height]);
    for (const slot of sheet.slots) {
      if (slot.page === null) continue;
      const i = byIndex.get(slot.page);
      const page = i === undefined ? undefined : embedded[i];
      const sourcePage = i === undefined ? undefined : pages[i];
      if (!page || !sourcePage) continue;
      const rotation = ((sourcePage.getRotation().angle % 360) + 360) % 360;
      const sideways = rotation % 180 !== 0;
      const shownWidth = sideways ? page.height : page.width;
      const shownHeight = sideways ? page.width : page.height;
      const scale = Math.min(slot.width / shownWidth, slot.height / shownHeight);
      const w = page.width * scale;
      const h = page.height * scale;
      // Bottom-left of the displayed page, centred in the slot.
      const left = slot.x + (slot.width - shownWidth * scale) / 2;
      const bottom = slot.y + (slot.height - shownHeight * scale) / 2;
      // drawPage rotates anticlockwise about its origin; /Rotate is clockwise.
      const origin =
        rotation === 90
          ? { x: left, y: bottom + w }
          : rotation === 180
            ? { x: left + w, y: bottom + h }
            : rotation === 270
              ? { x: left + h, y: bottom }
              : { x: left, y: bottom };
      target.drawPage(page, {
        ...origin,
        xScale: scale,
        yScale: scale,
        rotate: degrees(-rotation),
      });
      if (options.frame) {
        target.drawRectangle({
          x: left,
          y: bottom,
          width: shownWidth * scale,
          height: shownHeight * scale,
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 0.5,
        });
      }
    }
  }
  return out;
}
