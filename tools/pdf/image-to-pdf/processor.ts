import { addImagePages, createPdf, finishPdf } from '@niftyfix/engine-pdf';
import { readJpegOrientation } from '@niftyfix/engine-image';
import { createCanvas, decodeImage, encodeCanvas } from '@niftyfix/engine-image/browser';
import { readSafeHeader } from '@niftyfix/engine-image/pipeline';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineMultiFileProcessor, sniffFormat, ToolError } from '@niftyfix/tool-sdk';
import { ImageToPdfOptions, MAX_IMAGES } from './options';

/**
 * JPEG and PNG bytes go into the PDF unchanged (lossless). Anything else,
 * and JPEGs whose EXIF says "rotate me" (which a PDF would otherwise show
 * sideways), is decoded upright and stored as PNG or high-quality JPEG.
 */
async function pageImage(
  blob: Blob,
  name: string,
  maxPixels: number,
): Promise<{ bytes: Uint8Array; format: 'jpeg' | 'png'; redrawn: boolean }> {
  await readSafeHeader(blob, maxPixels);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const format = sniffFormat(bytes.subarray(0, 64));
  if (format === 'png') return { bytes, format, redrawn: false };
  if (format === 'jpeg' && readJpegOrientation(bytes) === 1) {
    return { bytes, format, redrawn: false };
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await decodeImage(blob);
  } catch (error) {
    if (error instanceof ToolError && error.code === 'WORKER_UNSUPPORTED') throw error;
    throw new ToolError('CORRUPT_INPUT', `"${name}" could not be read as an image.`);
  }
  const canvas = createCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
  if (!ctx) throw new ToolError('OUT_OF_MEMORY', 'There is not enough memory to draw this image.');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const target = format === 'jpeg' ? 'jpeg' : 'png';
  const encoded = await encodeCanvas(canvas, target, 0.95);
  return { bytes: new Uint8Array(await encoded.arrayBuffer()), format: target, redrawn: true };
}

export default defineMultiFileProcessor({
  options: ImageToPdfOptions,
  inputs: { min: 1, max: MAX_IMAGES },
  async run(inputs, options, { progress, signal }) {
    const images = [];
    let redrawn = 0;
    for (const [index, input] of inputs.entries()) {
      signal.throwIfAborted();
      progress((index / inputs.length) * 0.7, `Image ${index + 1} of ${inputs.length}`);
      const image = await pageImage(input.blob, input.name, options.maxPixels);
      if (image.redrawn) redrawn += 1;
      images.push(image);
    }
    progress(0.75, 'Building the PDF');
    const doc = await createPdf();
    await addImagePages(doc, images, options, signal);
    progress(0.9, 'Checking the PDF');
    const first = inputs[0]?.name ?? 'images';
    return finishPdf(doc, {
      fileName: resolveOutputName(
        first,
        options.fileName,
        inputs.length > 1 ? 'images' : 'image',
        'pdf',
      ),
      pages: inputs.length,
      inputBytes: inputs.reduce((sum, input) => sum + input.bytes, 0),
      facts: [
        {
          label: 'Page size',
          value: { a4: 'A4', letter: 'US Letter', fit: 'Same as each image' }[options.pageSize],
        },
        ...(redrawn > 0
          ? [
              {
                label: 'Converted or turned upright',
                value: `${redrawn} image${redrawn === 1 ? '' : 's'}`,
              },
            ]
          : []),
      ],
    });
  },
});
