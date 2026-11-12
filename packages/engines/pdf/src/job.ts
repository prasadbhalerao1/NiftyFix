import type { PDFDocument } from '@cantoo/pdf-lib';
import {
  formatBytes,
  type OutputFact,
  type ProcessedFile,
  type ToolInputFile,
} from '@niftyfix/tool-sdk';
import { loadPdf, savePdf } from './document';
import { verifyPdfOutput } from './verify';

/**
 * Hard ceiling on pages per input document. File-size limits (per device, in
 * each manifest) bound memory; this bounds the work a single job can ask for.
 */
export const MAX_PDF_PAGES = 2000;

/** Read and parse one input file as a PDF. */
export async function readPdf(
  input: ToolInputFile,
  label?: string,
  password?: string,
): Promise<PDFDocument> {
  const bytes = new Uint8Array(await input.blob.arrayBuffer());
  return loadPdf(bytes, {
    maxPages: MAX_PDF_PAGES,
    ...(label === undefined ? {} : { label }),
    ...(password ? { password } : {}),
  });
}

export interface FinishOptions {
  fileName: string;
  /** Page count the output must have. */
  pages: number;
  rotations?: ReadonlyMap<number, number>;
  /** Total bytes of the input(s), to report the size change. */
  inputBytes: number;
  facts?: readonly OutputFact[];
  warnings?: readonly string[];
  /** Set to false to leave the producer field alone (e.g. when the user cleared metadata). */
  stampProducer?: boolean;
  /** Protect the output with the password the input was opened with. */
  password?: string;
}

/** Save, re-open independently to verify, and describe the result for the report. */
export async function finishPdf(doc: PDFDocument, options: FinishOptions): Promise<ProcessedFile> {
  if (options.password) {
    doc.encrypt({ userPassword: options.password, ownerPassword: options.password });
  }
  const bytes = await savePdf(doc, { stampProducer: options.stampProducer ?? true });
  const { checks } = await verifyPdfOutput(bytes, {
    pages: options.pages,
    fileName: options.fileName,
    ...(options.password ? { password: options.password } : {}),
    ...(options.rotations ? { rotations: options.rotations } : {}),
  });
  return {
    blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }),
    fileName: options.fileName,
    format: 'pdf',
    bytes: bytes.length,
    facts: [
      { label: 'Pages', value: String(options.pages) },
      {
        label: 'File size',
        value: `${formatBytes(bytes.length)} (was ${formatBytes(options.inputBytes)})`,
      },
      ...(options.facts ?? []),
    ],
    verification: checks,
    warnings: [...(options.warnings ?? [])],
  };
}
