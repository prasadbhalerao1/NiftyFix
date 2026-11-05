import { PDFDocument } from '@cantoo/pdf-lib';
import type { VerificationCheck } from '@niftyfix/tool-sdk';

export interface PdfExpectations {
  /** Expected number of pages in the output. */
  pages: number;
  fileName: string;
  /** Expected rotation per page index, when the tool changed it. */
  rotations?: ReadonlyMap<number, number>;
}

/**
 * Re-open the produced bytes from scratch, never trusting the in-memory
 * document that wrote them, and measure what the user will download.
 */
export async function verifyPdfOutput(
  bytes: Uint8Array,
  expect: PdfExpectations,
): Promise<{ checks: VerificationCheck[]; reopened: PDFDocument | null }> {
  const checks: VerificationCheck[] = [];
  const header = String.fromCharCode(...bytes.subarray(0, 5));
  checks.push({
    id: 'format',
    label: 'Format',
    required: 'PDF',
    actual: header === '%PDF-' ? 'PDF' : 'not a PDF',
    status: header === '%PDF-' ? 'pass' : 'fail',
  });

  let reopened: PDFDocument | null = null;
  try {
    reopened = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch {
    reopened = null;
  }
  checks.push({
    id: 'opens',
    label: 'Opens correctly',
    required: 'Valid PDF structure',
    actual: reopened ? 'Valid' : 'Could not be read back',
    status: reopened ? 'pass' : 'fail',
  });

  const pages = reopened?.getPageCount() ?? 0;
  checks.push({
    id: 'pages',
    label: 'Pages',
    required: `${expect.pages}`,
    actual: reopened ? `${pages}` : 'None',
    status: reopened && pages === expect.pages ? 'pass' : 'fail',
  });

  if (expect.rotations && reopened) {
    const wrong = [...expect.rotations].filter(
      ([index, angle]) => reopened?.getPage(index).getRotation().angle !== angle,
    );
    checks.push({
      id: 'rotation',
      label: 'Rotation',
      required: 'As selected',
      actual: wrong.length === 0 ? 'As selected' : `${wrong.length} page(s) differ`,
      status: wrong.length === 0 ? 'pass' : 'fail',
    });
  }

  const extensionOk = expect.fileName.toLowerCase().endsWith('.pdf');
  checks.push({
    id: 'extension',
    label: 'File extension',
    required: '.pdf',
    actual: `.${expect.fileName.split('.').pop() ?? ''}`,
    status: extensionOk ? 'pass' : 'fail',
  });
  return { checks, reopened };
}
