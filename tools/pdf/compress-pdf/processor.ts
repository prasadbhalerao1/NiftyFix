import { createCanvas, decodeImage, encodeCanvas } from '@niftyfix/engine-image/browser';
import {
  loadPdf,
  MAX_PDF_PAGES,
  recompressImages,
  savePdf,
  verifyPdfOutput,
  type CompressSettings,
  type ImageTranscoder,
  type TranscodedImage,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import {
  defineProcessor,
  formatBytes,
  ToolError,
  type ProcessingContext,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import { CompressPdfOptions, LEVELS, TARGET_LADDER } from './options';

type Canvas = ReturnType<typeof createCanvas>;

function fit(width: number, height: number, maxSide: number): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function toJpeg(canvas: Canvas, quality: number, channels: 1 | 3): Promise<TranscodedImage> {
  const blob = await encodeCanvas(canvas, 'jpeg', quality);
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: canvas.width,
    height: canvas.height,
    channels,
  };
}

/** Canvas-based re-encoding, used by the engine for each image it may replace. */
const transcoder: ImageTranscoder = {
  async jpeg(bytes, maxSide, quality) {
    const bitmap = await decodeImage(new Blob([bytes as BlobPart], { type: 'image/jpeg' }));
    const size = fit(bitmap.width, bitmap.height, maxSide);
    const canvas = createCanvas(size.width, size.height);
    const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);
    bitmap.close();
    return toJpeg(canvas, quality, 3);
  },
  async pixels(raw, width, height, channels, maxSide, quality) {
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let p = 0, i = 0; p < width * height; p += 1, i += channels) {
      const r = raw[i] ?? 0;
      rgba[p * 4] = r;
      rgba[p * 4 + 1] = channels === 3 ? (raw[i + 1] ?? 0) : r;
      rgba[p * 4 + 2] = channels === 3 ? (raw[i + 2] ?? 0) : r;
      rgba[p * 4 + 3] = 255;
    }
    const full = createCanvas(width, height);
    (full.getContext('2d') as OffscreenCanvasRenderingContext2D | null)?.putImageData(
      new ImageData(rgba, width, height),
      0,
      0,
    );
    const size = fit(width, height, maxSide);
    if (size.width === width) return toJpeg(full, quality, channels);
    const small = createCanvas(size.width, size.height);
    const ctx = small.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) return null;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(full, 0, 0, size.width, size.height);
    return toJpeg(small, quality, channels);
  },
};

/** One attempt, always from the original bytes (never re-compressing what was already compressed). */
async function attempt(
  original: Uint8Array,
  settings: CompressSettings,
  context: ProcessingContext,
  from: number,
  to: number,
): Promise<{ bytes: Uint8Array; recompressed: number }> {
  const doc = await loadPdf(original, { maxPages: MAX_PDF_PAGES });
  const report = await recompressImages(doc, settings, transcoder, context.signal, (done, total) =>
    context.progress(from + ((to - from) * done) / Math.max(1, total), 'Recompressing images'),
  );
  return { bytes: await savePdf(doc), recompressed: report.recompressed };
}

export default defineProcessor({
  options: CompressPdfOptions,
  async run(input, options, context) {
    const original = new Uint8Array(await input.blob.arrayBuffer());
    context.progress(0.02, 'Reading the PDF');
    const ladder = options.mode === 'level' ? [LEVELS[options.level]] : TARGET_LADDER;
    let best: { bytes: Uint8Array; recompressed: number } | null = null;
    for (const [step, settings] of ladder.entries()) {
      context.signal.throwIfAborted();
      const from = 0.05 + (0.85 * step) / ladder.length;
      const result = await attempt(original, settings, context, from, from + 0.85 / ladder.length);
      if (!best || result.bytes.length < best.bytes.length) best = result;
      if (options.mode === 'level' || result.bytes.length <= options.maxBytes) break;
    }
    if (!best || best.bytes.length >= original.length) {
      throw new ToolError(
        'TARGET_UNREACHABLE',
        'This PDF is already compact: it could not be made smaller without damaging it.',
        {
          hint: 'Text and vector pages are already small. If it is still too big, remove pages you do not need.',
        },
      );
    }
    if (options.mode === 'target' && best.bytes.length > options.maxBytes) {
      throw new ToolError(
        'TARGET_UNREACHABLE',
        `The smallest this PDF can be made without unreadable pages is ${formatBytes(best.bytes.length)}, above your limit of ${formatBytes(options.maxBytes)}.`,
        { hint: 'Remove pages you do not need (Organize PDF), or split it into parts.' },
      );
    }

    context.progress(0.94, 'Checking the result');
    const fileName = resolveOutputName(input.name, options.fileName, 'compressed', 'pdf');
    const pages = (await loadPdf(original, { maxPages: MAX_PDF_PAGES })).getPageCount();
    const { checks } = await verifyPdfOutput(best.bytes, { pages, fileName });
    const sizeChecks: VerificationCheck[] = [
      {
        id: 'smaller',
        label: 'Smaller than the original',
        required: `< ${formatBytes(original.length)}`,
        actual: formatBytes(best.bytes.length),
        status: best.bytes.length < original.length ? 'pass' : 'fail',
      },
      ...(options.mode === 'target'
        ? [
            {
              id: 'size',
              label: 'File size',
              required: `at most ${formatBytes(options.maxBytes)}`,
              actual: formatBytes(best.bytes.length),
              status: best.bytes.length <= options.maxBytes ? ('pass' as const) : ('fail' as const),
            },
          ]
        : []),
    ];
    const saved = 1 - best.bytes.length / original.length;
    return {
      blob: new Blob([best.bytes as BlobPart], { type: 'application/pdf' }),
      fileName,
      format: 'pdf',
      bytes: best.bytes.length,
      facts: [
        {
          label: 'Size',
          value: `${formatBytes(original.length)} → ${formatBytes(best.bytes.length)}`,
        },
        { label: 'Reduced by', value: `${Math.round(saved * 100)}%` },
        { label: 'Images recompressed', value: String(best.recompressed) },
      ],
      verification: [...checks, ...sizeChecks],
      warnings: [],
    };
  },
});
