import type { PDFDocument } from '@cantoo/pdf-lib';
import {
  formatBytes,
  type OutputFact,
  type ProcessedFile,
  type ToolInputFile,
} from '@niftyfix/tool-sdk';
import { ToolError } from '@niftyfix/tool-sdk';
import { loadPdf, savePdf } from './document';
import { allPages, parsePageRange } from './pages';
import { verifyPdfOutput } from './verify';

/**
 * Hard ceiling on pages per input document. File-size limits (per device, in
 * each manifest) bound memory; this bounds the work a single job can ask for.
 */
export const MAX_PDF_PAGES = 2000;

/** Read and parse one input file as a PDF. */
export async function readPdf(input: ToolInputFile, label?: string): Promise<PDFDocument> {
  const bytes = new Uint8Array(await input.blob.arrayBuffer());
  return loadPdf(bytes, { maxPages: MAX_PDF_PAGES, ...(label === undefined ? {} : { label }) });
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
}

/** Save, re-open independently to verify, and describe the result for the report. */
export async function finishPdf(doc: PDFDocument, options: FinishOptions): Promise<ProcessedFile> {
  const bytes = await savePdf(doc);
  const { checks } = await verifyPdfOutput(bytes, {
    pages: options.pages,
    fileName: options.fileName,
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

/**
 * Resolve a page selection against the real document. Out-of-range or
 * malformed selections become an INVALID_OPTIONS error with the exact reason
 * ("This PDF has 10 pages"), shown to the user next to a retry button.
 */
export function selectPages(
  selection: { mode: 'all' | 'custom'; ranges: string },
  pageCount: number,
  { allowRepeat = false }: { allowRepeat?: boolean } = {},
): number[] {
  if (selection.mode === 'all') return allPages(pageCount);
  const result = parsePageRange(selection.ranges, pageCount, { allowRepeat });
  if (!result.ok) throw new ToolError('INVALID_OPTIONS', result.error);
  return result.pages;
}
