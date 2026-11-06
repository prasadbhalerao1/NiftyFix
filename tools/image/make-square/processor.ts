import {
  createCanvas,
  decodeImage,
  sameFormatAs,
  webpOrPng,
  type EncodableFormat,
} from '@niftyfix/engine-image/browser';
import { exportImage, readSafeHeader, verifyImageOutput } from '@niftyfix/engine-image/pipeline';
import { resolveOutputName } from '@niftyfix/runtime';
import {
  defineProcessor,
  FILE_FORMATS,
  formatBytesExact,
  ToolError,
  type OutputFact,
} from '@niftyfix/tool-sdk';
import { planFrame } from './frame';
import manifest from './manifest';
import { MakeSquareOptions } from './options';

type Context2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function context2d(canvas: OffscreenCanvas | HTMLCanvasElement): Context2D {
  const ctx = canvas.getContext('2d') as Context2D | null;
  if (ctx === null) {
    throw new ToolError('OUT_OF_MEMORY', 'There is not enough memory to draw this image.', {
      retryable: true,
    });
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

/**
 * A soft background made from the photo itself: drawn tiny and stretched back
 * up, which blurs it in every browser (canvas filters are missing on some).
 */
function drawBlurredCover(
  ctx: Context2D,
  bitmap: ImageBitmap,
  width: number,
  height: number,
): void {
  const cover = Math.max(width / bitmap.width, height / bitmap.height);
  const tinyScale = 24 / Math.max(width, height);
  const tiny = createCanvas(
    Math.max(1, Math.round(width * tinyScale)),
    Math.max(1, Math.round(height * tinyScale)),
  );
  const tinyCtx = context2d(tiny);
  const drawWidth = bitmap.width * cover * tinyScale;
  const drawHeight = bitmap.height * cover * tinyScale;
  tinyCtx.drawImage(
    bitmap,
    (tiny.width - drawWidth) / 2,
    (tiny.height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  ctx.drawImage(tiny, 0, 0, width, height);
  // Soften it a little more so the real photo stands out in front.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(0, 0, width, height);
}

export default defineProcessor({
  options: MakeSquareOptions,
  async run(input, options, context) {
    if (options.shape === 'border' && options.borderPercent === 0) {
      throw new ToolError('INVALID_OPTIONS', 'Choose a border size above 0%.');
    }
    context.progress(0.02, 'Reading image');
    const header = await readSafeHeader(
      input.blob,
      manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY,
    );
    const bitmap = await decodeImage(input.blob);
    try {
      const frame = planFrame(bitmap, options);
      context.progress(0.3, options.shape === 'square' ? 'Making it square' : 'Adding the border');
      const canvas = createCanvas(frame.width, frame.height);
      const ctx = context2d(canvas);
      if (options.fill === 'blur') drawBlurredCover(ctx, bitmap, frame.width, frame.height);
      else {
        ctx.fillStyle = options.colour;
        ctx.fillRect(0, 0, frame.width, frame.height);
      }
      const { x, y, width, height } = frame.image;
      ctx.drawImage(bitmap, x, y, width, height);
      if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');

      // The frame is fully painted, so there is no transparency to keep.
      let format: EncodableFormat = sameFormatAs(header.format, () => false, false);
      if (format === 'webp') format = await webpOrPng(canvas);

      context.progress(0.6, 'Saving');
      const exported = await exportImage(canvas, {
        format,
        range: {},
        quality: 0.95,
        qualityFloor: 0.95,
        subject: 'image',
        signal: context.signal,
      });

      context.progress(0.9, 'Verifying');
      const fileName = resolveOutputName(
        input.name,
        options.fileName,
        options.shape === 'square' ? 'square' : 'border',
        FILE_FORMATS[format].extensions[0],
      );
      const verification = await verifyImageOutput(exported.bytes, {
        width: frame.width,
        height: frame.height,
        format,
        range: {},
        fileName,
      });
      const facts: OutputFact[] = [
        {
          label: 'Shape',
          value: options.shape === 'square' ? 'Square' : 'Original shape with a border',
        },
        { label: 'Background', value: options.fill === 'blur' ? 'Blurred photo' : options.colour },
        {
          label: 'Result',
          value: `${frame.width} × ${frame.height} px · ${formatBytesExact(exported.bytes.length)}`,
        },
      ];
      const warnings =
        frame.scale < 1
          ? [
              `The result was scaled to ${Math.round(frame.scale * 100)}% so it opens on phones too.`,
            ]
          : [];

      context.progress(1, 'Done');
      return {
        blob: new Blob([exported.bytes.slice().buffer], { type: FILE_FORMATS[format].mime }),
        fileName,
        format,
        bytes: exported.bytes.length,
        facts,
        verification,
        warnings,
      };
    } finally {
      bitmap.close();
    }
  },
});
