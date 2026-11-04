/**
 * PDF rendering and text extraction with pdf.js, for processors running in
 * the tool frame's worker (or its main thread when workers lack canvases).
 *
 * pdf.js normally starts its own worker; here it already runs inside ours,
 * so its parser runs in the same thread ("fake worker", loaded lazily). Its
 * defaults assume a DOM, so this module supplies DOM-free factories and
 * absolute asset URLs. Assets (standard fonts, CMaps, image decoders) are
 * served by the frame itself under /pdfjs/ — the frame CSP allows nothing else.
 */
import {
  getDocument,
  InvalidPDFException,
  PasswordException,
  type PDFDocumentProxy,
} from 'pdfjs-dist';
import { ToolError } from '@niftyfix/tool-sdk';

export { PDFJS_ASSET_PATH } from './assets';
import { PDFJS_ASSET_PATH } from './assets';

type Canvas = OffscreenCanvas | HTMLCanvasElement;
type Context = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function newCanvas(width: number, height: number): Canvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  // The runtime reruns the job on the main thread when it sees this code.
  throw new ToolError(
    'WORKER_UNSUPPORTED',
    'This browser cannot draw PDF pages in the background.',
  );
}

/** pdf.js canvas factory without a DOM: same contract as its BaseCanvasFactory. */
class PortableCanvasFactory {
  create(width: number, height: number): { canvas: Canvas; context: Context } {
    if (width <= 0 || height <= 0) throw new Error('Invalid canvas size');
    const canvas = newCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true }) as Context | null;
    if (!context)
      throw new ToolError('OUT_OF_MEMORY', 'There is not enough memory to draw this page.');
    return { canvas, context };
  }
  reset(target: { canvas: Canvas }, width: number, height: number): void {
    target.canvas.width = width;
    target.canvas.height = height;
  }
  destroy(target: { canvas: Canvas | null; context: Context | null }): void {
    if (target.canvas) {
      target.canvas.width = 0;
      target.canvas.height = 0;
    }
    target.canvas = null;
    target.context = null;
  }
}

/**
 * pdf.js applies some colour transfer functions through SVG filters, which
 * need a DOM. Without one they are skipped: affected pages (rare) render with
 * slightly different colours. Recorded in ADR 0005.
 */
class NoFilterFactory {
  addFilter(): string {
    return 'none';
  }
  addHCMFilter(): string {
    return 'none';
  }
  addAlphaFilter(): string {
    return 'none';
  }
  addLuminosityFilter(): string {
    return 'none';
  }
  addHighlightHCMFilter(): string {
    return 'none';
  }
  destroy(): void {}
}

declare global {
  // pdf.js looks for its worker handler here to run the parser in this thread.
  var pdfjsWorker: unknown;
}

async function ensureParserLoaded(): Promise<void> {
  if (globalThis.pdfjsWorker) return;
  // @ts-expect-error -- pdf.js ships no types for its worker entry; only its handler is used.
  globalThis.pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
}

export interface RenderOpenOptions {
  /** Origin serving /pdfjs/ assets: the frame's own origin (self.location.origin). */
  assetOrigin: string;
  label?: string;
}

/**
 * Open untrusted bytes for rendering. Failures become actionable ToolErrors.
 * Call close() when done: it frees the parser's memory and caches.
 */
export async function openForRendering(
  bytes: Uint8Array,
  { assetOrigin, label }: RenderOpenOptions,
): Promise<{ doc: PDFDocumentProxy; close(): Promise<void> }> {
  await ensureParserLoaded();
  const asset = (dir: string): string => new URL(`${PDFJS_ASSET_PATH}${dir}/`, assetOrigin).href;
  const which = label ? `"${label}"` : 'This PDF';
  const task = getDocument({
    // pdf.js transfers (detaches) the buffer it is given; keep the caller's copy intact.
    data: bytes.slice(),
    cMapUrl: asset('cmaps'),
    cMapPacked: true,
    standardFontDataUrl: asset('standard_fonts'),
    wasmUrl: asset('wasm'),
    iccUrl: asset('iccs'),
    // Explicit: pdf.js otherwise reads document.baseURI, which a worker has none of.
    useWorkerFetch: false,
    isOffscreenCanvasSupported: typeof OffscreenCanvas !== 'undefined',
    disableFontFace: true,
    useSystemFonts: false,
    enableXfa: false,
    CanvasFactory: PortableCanvasFactory,
    FilterFactory: NoFilterFactory,
    // Refuse absurd embedded images instead of exhausting memory (pixels).
    maxImageSize: 100_000_000,
    verbosity: 0,
  });
  try {
    return { doc: await task.promise, close: () => task.destroy() };
  } catch (error) {
    await task.destroy();
    if (error instanceof PasswordException || (error as Error)?.name === 'PasswordException') {
      throw new ToolError('PASSWORD_PROTECTED', `${which} is protected with a password.`, {
        hint: 'Remove the password first, then try again.',
      });
    }
    if (error instanceof InvalidPDFException || (error as Error)?.name === 'InvalidPDFException') {
      throw new ToolError('CORRUPT_INPUT', `${which} is damaged or is not a valid PDF.`);
    }
    throw error;
  }
}

export interface RenderedPage {
  canvas: Canvas;
  width: number;
  height: number;
}

/**
 * Draw one page (0-based) on white at `scale` (1 = 72 DPI). The pixel area is
 * capped so a giant page cannot exhaust memory; the cap is reported back.
 */
export async function renderPage(
  doc: PDFDocumentProxy,
  index: number,
  scale: number,
  maxPixels = 40_000_000,
): Promise<RenderedPage & { scaledDown: boolean }> {
  const page = await doc.getPage(index + 1);
  try {
    let viewport = page.getViewport({ scale });
    let scaledDown = false;
    const area = viewport.width * viewport.height;
    if (area > maxPixels) {
      viewport = page.getViewport({ scale: scale * Math.sqrt(maxPixels / area) });
      scaledDown = true;
    }
    const width = Math.max(1, Math.floor(viewport.width));
    const height = Math.max(1, Math.floor(viewport.height));
    const canvas = newCanvas(width, height);
    const context = canvas.getContext('2d') as Context | null;
    if (!context)
      throw new ToolError('OUT_OF_MEMORY', 'There is not enough memory to draw this page.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    await page.render({
      canvas: canvas as HTMLCanvasElement,
      canvasContext: context as CanvasRenderingContext2D,
      viewport,
    }).promise;
    return { canvas, width, height, scaledDown };
  } finally {
    page.cleanup();
  }
}

/**
 * The text of one page in reading order, with line breaks where pdf.js marks
 * the end of a line. Empty for scanned pages (they need OCR).
 */
export async function pageText(doc: PDFDocumentProxy, index: number): Promise<string> {
  const page = await doc.getPage(index + 1);
  try {
    const content = await page.getTextContent();
    let text = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      text += item.str;
      if (item.hasEOL) text += '\n';
    }
    return text.replace(/[ \t]+\n/g, '\n').trimEnd();
  } finally {
    page.cleanup();
  }
}
