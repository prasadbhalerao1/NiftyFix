/**
 * Text recognition (OCR) with Tesseract, entirely on the device. Runs from a
 * tool processor (itself in a worker); tesseract.js starts one more worker for
 * the WebAssembly engine. Language data is cached by the browser after first use.
 */
import { createWorker, OEM, type Line, type Worker } from 'tesseract.js';
import { ToolError } from '@niftyfix/tool-sdk';
import { OCR_ASSET_PATHS, type OcrLanguage } from './assets';

export * from './assets';

export interface OcrLine {
  text: string;
  /** 0 to 100, as Tesseract reports it. */
  confidence: number;
}

export interface OcrResult {
  text: string;
  /** Mean word confidence, 0 to 100. */
  confidence: number;
  lines: OcrLine[];
}

export interface RecognizeOptions {
  languages: readonly OcrLanguage[];
  /** Absolute URL of the frame origin that serves the OCR assets. */
  assetOrigin: string;
  signal: AbortSignal;
  onProgress?: (fraction: number, stage: string) => void;
}

const STAGES: Record<string, string> = {
  'loading tesseract core': 'Loading the text reader',
  'loading language traineddata': 'Loading language data (first time only)',
  'initializing api': 'Starting',
  'recognizing text': 'Reading text',
};

export async function recognizeText(image: Blob, options: RecognizeOptions): Promise<OcrResult> {
  const url = (path: string): string => new URL(path, options.assetOrigin).href;
  let worker: Worker | null = null;
  const abort = (): void => void worker?.terminate();
  options.signal.addEventListener('abort', abort, { once: true });
  try {
    worker = await createWorker([...options.languages], OEM.LSTM_ONLY, {
      workerPath: url(OCR_ASSET_PATHS.worker),
      corePath: url(OCR_ASSET_PATHS.core),
      langPath: url(OCR_ASSET_PATHS.lang),
      // Load the worker script from our origin directly (the CSP allows no blob: workers).
      workerBlobURL: false,
      gzip: true,
      logger: (message) => {
        const stage = STAGES[message.status];
        if (stage) options.onProgress?.(message.progress, stage);
      },
      errorHandler: () => undefined,
    });
    if (options.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const { data } = await worker.recognize(image, {}, { text: true, blocks: true });
    const lines: OcrLine[] = (data.blocks ?? [])
      .flatMap((block) => block.paragraphs)
      .flatMap((paragraph) => paragraph.lines)
      .map((line: Line) => ({ text: line.text.trim(), confidence: line.confidence }))
      .filter((line) => line.text !== '');
    return { text: data.text.trim(), confidence: data.confidence, lines };
  } catch {
    if (options.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    throw new ToolError('ENGINE_CRASHED', 'The text reader could not start or read this image.', {
      hint: 'Try again. If it keeps failing, try a smaller image or another browser.',
      retryable: true,
    });
  } finally {
    options.signal.removeEventListener('abort', abort);
    await worker?.terminate();
  }
}
