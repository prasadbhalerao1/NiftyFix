import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { isToolError } from '@niftyfix/tool-sdk';
import {
  addImagePages,
  addPageNumbers,
  addTextWatermark,
  chunkPages,
  combinePages,
  createPdf,
  describePages,
  finishPdf,
  flattenForm,
  loadPdf,
  pageRangeSyntaxError,
  parsePageRange,
  readMetadata,
  readProtection,
  removeProtection,
  rotatePages,
  savePdf,
  verifyPdfOutput,
  writeMetadata,
} from '../src';

/** A PDF whose page i is (200 + i) points wide, so page identity survives copying. */
async function makePdf(pages: number, label = 'doc'): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i += 1) {
    doc.addPage([200 + i, 300]).drawText(`${label} ${i + 1}`, { x: 20, y: 150, size: 12, font });
  }
  return doc.save();
}
const widths = (doc: PDFDocument): number[] => doc.getPages().map((page) => page.getWidth());
const limits = { maxPages: 500 };

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return isToolError(error) ? error.code : 'not a ToolError';
  }
  return 'no error';
}

describe('parsePageRange', () => {
  it('parses pages, ranges and open ranges in typed order', () => {
    expect(parsePageRange('1-3, 5', 10)).toEqual({ ok: true, pages: [0, 1, 2, 4] });
    expect(parsePageRange('8-', 10)).toEqual({ ok: true, pages: [7, 8, 9] });
    expect(parsePageRange('-2', 10)).toEqual({ ok: true, pages: [0, 1] });
    expect(parsePageRange('5, 1', 10)).toEqual({ ok: true, pages: [4, 0] });
    expect(parsePageRange(' 2 - 3 ', 10)).toEqual({ ok: true, pages: [1, 2] });
  });

  it('drops repeats unless asked to keep them', () => {
    expect(parsePageRange('1-2, 2', 5)).toEqual({ ok: true, pages: [0, 1] });
    expect(parsePageRange('1, 1', 5, { allowRepeat: true })).toEqual({ ok: true, pages: [0, 0] });
  });

  it('explains every mistake', () => {
    for (const [text, message] of [
      ['', /at least one page/],
      ['abc', /not a page or range/],
      ['0', /start at 1/],
      ['12', /past the last page. This PDF has 10 pages/],
      ['5-2', /backwards. Write it as 2-5/],
      ['1--3', /not a page or range/],
    ] as const) {
      const result = parsePageRange(text, 10);
      expect(result.ok, text).toBe(false);
      if (!result.ok) expect(result.error).toMatch(message);
    }
  });

  it('checks syntax without knowing the page count', () => {
    expect(pageRangeSyntaxError('1-3, 5, 8-')).toBeNull();
    expect(pageRangeSyntaxError('-4')).toBeNull();
    expect(pageRangeSyntaxError('')).toMatch(/at least one/);
    expect(pageRangeSyntaxError('x')).toMatch(/not a page/);
    expect(pageRangeSyntaxError('0')).toMatch(/start at 1/);
    expect(pageRangeSyntaxError('9-2')).toMatch(/backwards/);
  });

  it('chunks and describes', () => {
    expect(chunkPages(5, 2)).toEqual([[0, 1], [2, 3], [4]]);
    expect(describePages([0, 1, 2, 4, 6, 7])).toBe('1-3, 5, 7-8');
  });
});

describe('loadPdf', () => {
  it('opens a valid PDF', async () => {
    const doc = await loadPdf(await makePdf(3), limits);
    expect(doc.getPageCount()).toBe(3);
  });

  it('refuses damaged, non-PDF, password-protected and over-long input', async () => {
    const bytes = await makePdf(3);
    expect(await codeOf(loadPdf(bytes.slice(0, 40), limits))).toBe('CORRUPT_INPUT');
    expect(await codeOf(loadPdf(new TextEncoder().encode('hello'), limits))).toBe('CORRUPT_INPUT');
    expect(await codeOf(loadPdf(bytes, { maxPages: 2 }))).toBe('TOO_MANY_PAGES');

    const locked = await PDFDocument.load(bytes);
    locked.encrypt({ userPassword: 'secret', ownerPassword: 'owner' });
    expect(await codeOf(loadPdf(await locked.save(), limits))).toBe('PASSWORD_PROTECTED');
  });

  it('opens a password-protected PDF with its password, and says when it is wrong', async () => {
    const locked = await PDFDocument.load(await makePdf(2));
    locked.encrypt({ userPassword: 'ABCD1990', ownerPassword: 'owner' });
    const bytes = await locked.save();
    const opened = await loadPdf(bytes, { ...limits, password: 'ABCD1990' });
    expect(opened.getPageCount()).toBe(2);
    await expect(loadPdf(bytes, { ...limits, password: 'abcd1990' })).rejects.toThrow(
      'The password for This PDF is not right.',
    );
  });

  it('names the file in messages when merging', async () => {
    try {
      await loadPdf(new Uint8Array([1, 2, 3]), { maxPages: 5, label: 'invoice.pdf' });
    } catch (error) {
      expect((error as Error).message).toContain('"invoice.pdf"');
    }
  });
});

describe('operations', () => {
  it('combines selected pages from several documents in order', async () => {
    const a = await loadPdf(await makePdf(3), limits);
    const b = await loadPdf(await makePdf(2), limits);
    const out = await combinePages([
      { doc: b, pages: [1] },
      { doc: a, pages: [2, 0] },
    ]);
    expect(widths(out)).toEqual([201, 202, 200]);
  });

  it('rotates selected pages, adding to existing rotation', async () => {
    const doc = await loadPdf(await makePdf(3), limits);
    rotatePages(doc, [0, 2], 90);
    rotatePages(doc, [2], 270);
    expect(doc.getPages().map((page) => page.getRotation().angle)).toEqual([90, 0, 0]);
  });

  it('numbers pages, including rotated ones, and refuses non-Latin text', async () => {
    const doc = await loadPdf(await makePdf(4), limits);
    rotatePages(doc, [1], 90);
    rotatePages(doc, [2], 180);
    rotatePages(doc, [3], 270);
    for (const position of ['bottom-center', 'top-right', 'bottom-left'] as const) {
      await addPageNumbers(doc, {
        position,
        template: 'Page {n} of {total}',
        start: 1,
        pages: [0, 1, 2, 3],
        fontSize: 10,
        margin: 24,
      });
    }
    const { checks } = await verifyPdfOutput(await savePdf(doc), { pages: 4, fileName: 'x.pdf' });
    expect(checks.every((check) => check.status === 'pass')).toBe(true);

    expect(
      await codeOf(
        addPageNumbers(doc, {
          position: 'bottom-center',
          template: 'पृष्ठ {n}',
          start: 1,
          pages: [0],
          fontSize: 10,
          margin: 24,
        }),
      ),
    ).toBe('INVALID_OPTIONS');
  });

  it('draws a watermark that fits even when the requested size is huge', async () => {
    const doc = await loadPdf(await makePdf(2), limits);
    await addTextWatermark(doc, {
      text: 'CONFIDENTIAL',
      opacity: 0.2,
      fontSize: 400,
      layout: 'diagonal',
      color: [0.8, 0, 0],
      pages: [0, 1],
    });
    const { checks } = await verifyPdfOutput(await savePdf(doc), { pages: 2, fileName: 'w.pdf' });
    expect(checks.every((check) => check.status === 'pass')).toBe(true);
  });

  it('makes one page per image, fitted without distortion', async () => {
    const png = await (
      await createPdf()
    ).embedPng(
      // 2 × 1 px red/blue PNG.
      Uint8Array.from(
        atob(
          'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAAD0lEQVR4nGP4z8DwnwEIABf2A/2IoRWBAAAAAElFTkSuQmCC',
        ),
        (c) => c.charCodeAt(0),
      ),
    );
    expect(png.width).toBe(2);
    const doc = await createPdf();
    const bytes = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAAD0lEQVR4nGP4z8DwnwEIABf2A/2IoRWBAAAAAElFTkSuQmCC',
      ),
      (c) => c.charCodeAt(0),
    );
    await addImagePages(
      doc,
      [
        { bytes, format: 'png' },
        { bytes, format: 'png' },
      ],
      {
        pageSize: 'a4',
        orientation: 'auto',
        margin: 36,
      },
    );
    expect(doc.getPageCount()).toBe(2);
    // Wide image ⇒ landscape A4.
    expect(doc.getPage(0).getWidth()).toBeCloseTo(841.89);
    const fit = await createPdf();
    await addImagePages(fit, [{ bytes, format: 'png' }], {
      pageSize: 'fit',
      orientation: 'auto',
      margin: 0,
    });
    expect([fit.getPage(0).getWidth(), fit.getPage(0).getHeight()]).toEqual([2, 1]);
  });

  it('reads, writes and clears metadata', async () => {
    const doc = await loadPdf(await makePdf(1), limits);
    writeMetadata(doc, {
      title: 'Report',
      author: 'A. Person',
      subject: '',
      keywords: 'one, two',
      creator: '',
    });
    const reopened = await loadPdf(await savePdf(doc), limits);
    expect(readMetadata(reopened)).toMatchObject({
      title: 'Report',
      author: 'A. Person',
      subject: '',
    });
    expect(reopened.getKeywords()).toContain('one');
  });

  it('flattens form fields and reports how many', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([300, 300]);
    const field = doc.getForm().createTextField('name');
    field.setText('Asha');
    field.addToPage(page, { x: 20, y: 200, width: 200, height: 24 });
    const loaded = await loadPdf(await doc.save(), limits);
    expect(flattenForm(loaded)).toBe(1);
    const reopened = await loadPdf(await savePdf(loaded), limits);
    expect(reopened.getForm().getFields()).toHaveLength(0);
  });
});

describe('finishPdf', () => {
  it('keeps the password a PDF was opened with, and checks that it holds', async () => {
    const locked = await PDFDocument.load(await makePdf(2));
    locked.encrypt({ userPassword: 'SURE1990', ownerPassword: 'owner' });
    const doc = await loadPdf(await locked.save(), { ...limits, password: 'SURE1990' });
    const result = await finishPdf(doc, {
      fileName: 'out.pdf',
      pages: 2,
      inputBytes: 1,
      password: 'SURE1990',
    });
    expect(result.verification.every((check) => check.status === 'pass')).toBe(true);
    expect(result.verification.map((check) => check.id)).toContain('password');
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    expect(await codeOf(loadPdf(bytes, limits))).toBe('PASSWORD_PROTECTED');
    expect((await loadPdf(bytes, { ...limits, password: 'SURE1990' })).getPageCount()).toBe(2);
  });
});

describe('verifyPdfOutput', () => {
  it('fails page count, rotation and extension mismatches', async () => {
    const doc = await loadPdf(await makePdf(2), limits);
    rotatePages(doc, [0], 90);
    const bytes = await savePdf(doc);
    const { checks } = await verifyPdfOutput(bytes, {
      pages: 3,
      fileName: 'x.txt',
      rotations: new Map([[0, 180]]),
    });
    const status = Object.fromEntries(checks.map((check) => [check.id, check.status]));
    expect(status).toEqual({
      format: 'pass',
      opens: 'pass',
      pages: 'fail',
      rotation: 'fail',
      extension: 'fail',
    });
  });

  it('fails bytes that are not a PDF', async () => {
    const { checks } = await verifyPdfOutput(new Uint8Array([1, 2, 3, 4, 5, 6]), {
      pages: 1,
      fileName: 'a.pdf',
    });
    expect(checks.find((check) => check.id === 'opens')?.status).toBe('fail');
  });
});

describe('removeProtection', () => {
  it.each([
    ['an open password', 'u1', 'u1'],
    ['an owner password used to open', 'u1', 'o1'],
    ['only print and copy restrictions', '', undefined],
  ] as const)('leaves no protection on a PDF with %s', async (_, user, password) => {
    const locked = await PDFDocument.load(await makePdf(2));
    locked.encrypt({
      userPassword: user,
      ownerPassword: 'o1',
      permissions: { printing: false, copying: false },
    });
    const bytes = await locked.save({ useObjectStreams: user === 'u1' });
    const protection = readProtection(bytes, user === '');
    expect(protection).toEqual({ openPassword: user !== '', restricted: true });
    const doc = await loadPdf(bytes, { ...limits, ...(password ? { password } : {}) });
    removeProtection(doc);
    const out = await savePdf(doc);
    expect(readProtection(out, true)).toBeNull();
    const reopened = await PDFDocument.load(out);
    expect(reopened.isEncrypted).toBe(false);
    expect(reopened.getPageCount()).toBe(2);
  });
});
