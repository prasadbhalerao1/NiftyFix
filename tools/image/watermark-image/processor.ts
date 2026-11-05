import {
  decodeImage,
  hasTransparency,
  renderCropped,
  sameFormatAs,
  webpOrPng,
  type Canvas,
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
import manifest from './manifest';
import { COLOURS, WatermarkImageOptions } from './options';

type Context = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function canvasContext(canvas: Canvas): Context {
  const ctx = canvas.getContext('2d') as Context | null;
  if (ctx === null) {
    throw new ToolError('ENGINE_CRASHED', 'Your browser could not create an image canvas.', {
      retryable: true,
    });
  }
  return ctx;
}

/** Draw the text once at (x, y), aligned as given, with an outline for contrast. */
function stamp(ctx: Context, text: string, x: number, y: number, outline: number): void {
  if (outline > 0) ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

function drawWatermark(canvas: Canvas, options: WatermarkImageOptions): void {
  const ctx = canvasContext(canvas);
  const { width, height } = canvas;
  const fontSize = Math.max(8, Math.round((Math.min(width, height) * options.size) / 100));
  const colour = COLOURS[options.colour];
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", sans-serif`;
  ctx.fillStyle = colour.fill;
  ctx.strokeStyle = colour.outline;
  const outline = Math.max(1, fontSize / 18);
  ctx.lineWidth = outline;
  ctx.lineJoin = 'round';
  ctx.globalAlpha = options.opacity;
  const margin = Math.round(fontSize * 0.6);
  const angle = options.diagonal ? -Math.atan2(height, width) : 0;

  if (options.position === 'tile') {
    const textWidth = ctx.measureText(options.text).width;
    const stepX = textWidth + fontSize * 2.5;
    const stepY = fontSize * 4;
    // Cover the rotated canvas: work in rotated space over the full diagonal.
    const reach = Math.hypot(width, height);
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let row = -reach / 2, i = 0; row <= reach / 2; row += stepY, i += 1) {
      // Alternate rows are offset by half a step, like a brick wall.
      const shift = i % 2 === 0 ? 0 : stepX / 2;
      for (let col = -reach / 2 - shift; col <= reach / 2; col += stepX)
        stamp(ctx, options.text, col, row, outline);
    }
    return;
  }

  if (options.position === 'center') {
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    stamp(ctx, options.text, 0, 0, outline);
    return;
  }

  const right = options.position.endsWith('right');
  const bottom = options.position.startsWith('bottom');
  ctx.textAlign = right ? 'right' : 'left';
  ctx.textBaseline = bottom ? 'bottom' : 'top';
  stamp(
    ctx,
    options.text,
    right ? width - margin : margin,
    bottom ? height - margin : margin,
    outline,
  );
}

export default defineProcessor({
  options: WatermarkImageOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading image');
    const header = await readSafeHeader(
      input.blob,
      manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY,
    );
    const bitmap = await decodeImage(input.blob);
    try {
      const size = { width: bitmap.width, height: bitmap.height };
      let format: EncodableFormat = sameFormatAs(
        header.format,
        () => hasTransparency(bitmap),
        false,
      );
      context.progress(0.3, 'Adding watermark');
      const canvas = renderCropped(
        bitmap,
        { x: 0, y: 0, ...size },
        size.width,
        size.height,
        format === 'jpeg' ? '#ffffff' : null,
      );
      drawWatermark(canvas, options);
      if (format === 'webp') format = await webpOrPng(canvas);
      if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');

      context.progress(0.6, 'Saving');
      const exported = await exportImage(canvas, {
        format,
        range: {},
        quality: 0.92,
        qualityFloor: 0.92,
        subject: 'image',
        signal: context.signal,
      });

      context.progress(0.9, 'Verifying');
      const fileName = resolveOutputName(
        input.name,
        options.fileName,
        'watermarked',
        FILE_FORMATS[format].extensions[0],
      );
      const verification = await verifyImageOutput(exported.bytes, {
        ...size,
        format,
        range: {},
        fileName,
      });
      const facts: OutputFact[] = [
        { label: 'Watermark', value: options.text },
        {
          label: 'Image',
          value: `${size.width} × ${size.height} px · ${formatBytesExact(exported.bytes.length)}`,
        },
        { label: 'Format', value: FILE_FORMATS[format].label },
      ];

      context.progress(1, 'Done');
      return {
        blob: new Blob([exported.bytes.slice().buffer], { type: FILE_FORMATS[format].mime }),
        fileName,
        format,
        bytes: exported.bytes.length,
        facts,
        verification,
        warnings: [],
      };
    } finally {
      bitmap.close();
    }
  },
});
