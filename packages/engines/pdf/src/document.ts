import { EncryptedPDFError, PDFDocument } from '@cantoo/pdf-lib';
import { ToolError } from '@niftyfix/tool-sdk';

export interface LoadLimits {
  /** Refuse documents with more pages than this (device-aware, set by the tool). */
  maxPages: number;
  /** Name shown in messages, e.g. when merging several files. */
  label?: string;
}

/**
 * Parse untrusted PDF bytes. Every failure becomes a ToolError the user can
 * act on: locked, damaged, empty, or too long for this device. Runs in a
 * worker, so a pathological file costs at most the job timeout.
 */
export async function loadPdf(bytes: Uint8Array, limits: LoadLimits): Promise<PDFDocument> {
  const which = limits.label ? `"${limits.label}"` : 'This PDF';
  let doc: PDFDocument;
  let pages: number;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: false });
    // A damaged catalogue can parse yet fail here, so this is inside the guard too.
    pages = doc.isEncrypted ? 0 : doc.getPageCount();
  } catch (error) {
    if (error instanceof EncryptedPDFError || (error as Error)?.name === 'EncryptedPDFError') {
      throw new ToolError('PASSWORD_PROTECTED', `${which} is protected with a password.`, {
        hint: 'Remove the password first (open it and save or print it as a new PDF), then try again.',
      });
    }
    throw new ToolError('CORRUPT_INPUT', `${which} is damaged or is not a valid PDF.`, {
      hint: 'Try re-saving it from the app that created it.',
    });
  }
  if (doc.isEncrypted) {
    throw new ToolError('PASSWORD_PROTECTED', `${which} is protected with a password.`, {
      hint: 'Remove the password first, then try again.',
    });
  }
  if (pages === 0) throw new ToolError('CORRUPT_INPUT', `${which} has no pages.`);
  if (pages > limits.maxPages) {
    throw new ToolError(
      'TOO_MANY_PAGES',
      `${which} has ${pages} pages. The limit on this device is ${limits.maxPages}.`,
      { hint: 'Split it into smaller parts first, or use a computer, which allows more pages.' },
    );
  }
  return doc;
}

/** Serialise a document. The producer is set so the output says where it was made. */
export async function savePdf(
  doc: PDFDocument,
  { stampProducer = true }: { stampProducer?: boolean } = {},
): Promise<Uint8Array> {
  if (stampProducer) {
    doc.setProducer('NiftyFix (niftyfix.in)');
    doc.setModificationDate(new Date());
  }
  return doc.save({ useObjectStreams: true });
}

/** A new, empty document that inherits nothing from the inputs. */
export const createPdf = (): Promise<PDFDocument> => PDFDocument.create();
