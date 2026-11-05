/**
 * Browser-only image operations. Runs in a Web Worker (OffscreenCanvas) and,
 * on browsers whose workers lack OffscreenCanvas (Safari before 16.4/17), on
 * the tool frame's main thread with a regular <canvas>.
 */
import { ToolError, FILE_FORMATS } from '@niftyfix/tool-sdk';
import type { Pixels } from './enhance';

export type EncodableFormat = 'jpeg' | 'png' | 'webp';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Canvas = OffscreenCanvas | HTMLCanvasElement;
type Context2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

/** Create a canvas in whatever form this execution context supports. */
export function createCanvas(width: number, height: number): Canvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new ToolError(
    'WORKER_UNSUPPORTED',
    'This browser cannot draw images in a background worker.',
    { retryable: true },
  );
}

/** Decode with EXIF orientation applied, so width/height match what the user sees. */
export async function decodeImage(blob: Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'undefined') {
    throw new ToolError(
      'WORKER_UNSUPPORTED',
      'This browser cannot decode images in a background worker.',
      { retryable: true },
    );
  }
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    throw new ToolError(
      'CORRUPT_INPUT',
      'This image could not be read. It may be damaged or incomplete.',
      {
        hint: 'Open it in your gallery or photo viewer, save a new copy, and try again.',
      },
    );
  }
}

function context2d(canvas: Canvas): Context2D {
  const ctx = canvas.getContext('2d', { alpha: true }) as Context2D | null;
  if (ctx === null) {
    throw new ToolError('ENGINE_CRASHED', 'Your browser could not create an image canvas.', {
      retryable: true,
    });
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return ctx;
}

/**
 * Draw `crop` of `source` into an output of exactly `width × height`.
 * Large reductions are done in halving steps, which avoids the aliasing a
 * single bilinear downscale produces.
 */
export function renderCropped(
  source: ImageBitmap | Canvas,
  crop: CropRect,
  width: number,
  height: number,
  background: string | null,
): Canvas {
  let current: CanvasImageSource = source;
  let cx = crop.x;
  let cy = crop.y;
  let cw = crop.width;
  let ch = crop.height;

  while (cw / 2 >= width && ch / 2 >= height) {
    const stepW = Math.max(width, Math.round(cw / 2));
    const stepH = Math.max(height, Math.round(ch / 2));
    const step = createCanvas(stepW, stepH);
    context2d(step).drawImage(current, cx, cy, cw, ch, 0, 0, stepW, stepH);
    current = step;
    cx = 0;
    cy = 0;
    cw = stepW;
    ch = stepH;
  }

  const output = createCanvas(width, height);
  const ctx = context2d(output);
  if (background !== null) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(current, cx, cy, cw, ch, 0, 0, width, height);
  return output;
}

/**
 * Scale the whole `source` to fit inside `width × height` without cropping or
 * distortion, centred on `background` (null = transparent).
 */
export function fitInto(
  source: Canvas,
  width: number,
  height: number,
  background: string | null,
): Canvas {
  const scale = Math.min(width / source.width, height / source.height);
  const fitWidth = Math.max(1, Math.round(source.width * scale));
  const fitHeight = Math.max(1, Math.round(source.height * scale));
  const scaled = renderCropped(
    source,
    { x: 0, y: 0, width: source.width, height: source.height },
    fitWidth,
    fitHeight,
    null,
  );
  const output = createCanvas(width, height);
  const ctx = context2d(output);
  if (background !== null) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(scaled, Math.floor((width - fitWidth) / 2), Math.floor((height - fitHeight) / 2));
  return output;
}

/**
 * Whether any pixel is see-through. Checked on a small copy (at most 256 px a side):
 * scaling averages alpha, so even a thin transparent edge still shows up.
 */
export function hasTransparency(source: ImageBitmap): boolean {
  const scale = Math.min(1, 256 / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = createCanvas(width, height);
  const ctx = context2d(canvas);
  ctx.drawImage(source, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 255) < 255) return true;
  return false;
}

/** Read a canvas into a pure RGBA buffer (see enhance.ts). */
export function readPixels(canvas: Canvas): Pixels {
  const image = context2d(canvas).getImageData(0, 0, canvas.width, canvas.height);
  return { data: image.data, width: image.width, height: image.height };
}

/** Write an RGBA buffer to a new canvas of the same size. */
export function writePixels(pixels: Pixels): Canvas {
  const canvas = createCanvas(pixels.width, pixels.height);
  const image = new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height);
  context2d(canvas).putImageData(image, 0, 0);
  return canvas;
}

function toBlob(canvas: Canvas, type: string, quality: number | undefined): Promise<Blob | null> {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob(quality === undefined ? { type } : { type, quality });
  }
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Encode with the browser's native encoder, failing loudly if it silently falls back to PNG. */
export async function encodeCanvas(
  canvas: Canvas,
  format: EncodableFormat,
  quality: number,
): Promise<Blob> {
  const type = FILE_FORMATS[format].mime;
  const blob = await toBlob(canvas, type, format === 'png' ? undefined : quality);
  if (blob === null || blob.type !== type) {
    throw new ToolError(
      'ENCODER_UNAVAILABLE',
      `Your browser cannot create ${FILE_FORMATS[format].label} files.`,
      {
        hint: 'Choose JPEG or PNG, or use a recent version of Chrome, Edge, Firefox or Safari.',
      },
    );
  }
  return blob;
}
