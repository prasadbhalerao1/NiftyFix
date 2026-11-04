/**
 * Page previews for tool UIs (main thread). pdf.js parses in its own worker
 * (served from the frame's origin) and only paints thumbnails here, so large
 * documents never block the page. Loaded lazily by the UI once a file is
 * chosen; never part of the initial download.
 */
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ToolError } from '@niftyfix/tool-sdk';
import { PDFJS_ASSET_PATH } from './assets';

export interface PreviewDocument {
  pageCount: number;
  /** Page sizes in points as displayed (rotation applied), for laying out placeholders. */
  sizes: { width: number; height: number }[];
  /** Document information as stored in the file (empty strings when absent). */
  info: {
    title: string;
    author: string;
    subject: string;
    keywords: string;
    creator: string;
    producer: string;
  };
  /** Draw page `index` (0-based) into `canvas`, fitting `maxCssWidth` at the screen's density. */
  render(index: number, canvas: HTMLCanvasElement, maxCssWidth: number): Promise<void>;
  close(): Promise<void>;
}

export async function openPreview(file: Blob): Promise<PreviewDocument> {
  GlobalWorkerOptions.workerSrc = workerUrl;
  const asset = (dir: string): string =>
    new URL(`${PDFJS_ASSET_PATH}${dir}/`, location.origin).href;
  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: asset('cmaps'),
    cMapPacked: true,
    standardFontDataUrl: asset('standard_fonts'),
    wasmUrl: asset('wasm'),
    iccUrl: asset('iccs'),
    enableXfa: false,
    verbosity: 0,
  });
  let doc: PDFDocumentProxy;
  try {
    doc = await task.promise;
  } catch (error) {
    await task.destroy();
    const name = (error as Error)?.name;
    if (name === 'PasswordException') {
      throw new ToolError('PASSWORD_PROTECTED', 'This PDF is protected with a password.', {
        hint: 'Remove the password first, then try again.',
      });
    }
    throw new ToolError('CORRUPT_INPUT', 'This PDF is damaged or is not a valid PDF.');
  }
  // In parallel: one round trip per page to the parser worker, not one after another.
  const sizes = await Promise.all(
    Array.from({ length: doc.numPages }, async (_, i) => {
      const { width, height } = (await doc.getPage(i + 1)).getViewport({ scale: 1 });
      return { width, height };
    }),
  );
  const raw = ((await doc.getMetadata()).info ?? {}) as Record<string, unknown>;
  const text = (key: string): string => (typeof raw[key] === 'string' ? (raw[key] as string) : '');
  return {
    pageCount: doc.numPages,
    sizes,
    info: {
      title: text('Title'),
      author: text('Author'),
      subject: text('Subject'),
      keywords: text('Keywords'),
      creator: text('Creator'),
      producer: text('Producer'),
    },
    async render(index, canvas, maxCssWidth) {
      const page = await doc.getPage(index + 1);
      const base = page.getViewport({ scale: 1 });
      const density = Math.min(2, globalThis.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale: (maxCssWidth / base.width) * density });
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext('2d');
      if (!context) return;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      page.cleanup();
    },
    close: () => task.destroy(),
  };
}
