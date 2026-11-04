import { DEFAULT_ENHANCE, enhancePixels, findInkBounds } from '@niftyfix/engine-image';
import { ToolError } from '@niftyfix/tool-sdk';

/** Longest side of the cleaned signature image: sharp when printed, small in the PDF. */
const MAX_SIDE = 1200;

/**
 * Turn a photo or scan of a signature into a transparent PNG of just the ink:
 * crop to the ink, flatten lighting, make the paper transparent. Uses the
 * same engine as the Signature Resizer.
 */
export async function cleanSignaturePhoto(file: File): Promise<Uint8Array> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ToolError('CORRUPT_INPUT', 'This image could not be read. Try a JPG or PNG photo.');
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new ToolError('OUT_OF_MEMORY', 'There is not enough memory to read this image.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const whole = ctx.getImageData(0, 0, width, height);
  const bounds = findInkBounds({ data: whole.data, width, height }, 0.04);
  if (!bounds) {
    throw new ToolError('INVALID_OPTIONS', 'No signature was found in this image.', {
      hint: 'Use a clear photo of dark ink on plain paper.',
    });
  }
  const crop = ctx.getImageData(bounds.x, bounds.y, bounds.width, bounds.height);
  const cleaned = enhancePixels(
    { data: crop.data, width: bounds.width, height: bounds.height },
    { ...DEFAULT_ENHANCE, transparent: true },
  );
  const out = document.createElement('canvas');
  out.width = cleaned.width;
  out.height = cleaned.height;
  out
    .getContext('2d')
    ?.putImageData(
      new ImageData(new Uint8ClampedArray(cleaned.data), cleaned.width, cleaned.height),
      0,
      0,
    );
  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
  if (!blob) throw new ToolError('UNKNOWN', 'The signature image could not be prepared.');
  return new Uint8Array(await blob.arrayBuffer());
}
