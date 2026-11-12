import { encodeGrayJpeg } from '@niftyfix/engine-image';
import { encodeCanvas, writePixels } from '@niftyfix/engine-image/browser';
import {
  colourLeft,
  finishPdf,
  grayscaleDocument,
  isolateImages,
  isGrayOnly,
  loadPdf,
  MAX_PDF_PAGES,
  readPdf,
  replaceImage,
  tonePixels,
  type ToneSettings,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, type VerificationCheck } from '@niftyfix/tool-sdk';
import { GrayscalePdfOptions, MAX_PIXELS } from './options';

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

const SUFFIX = { gray: 'grayscale', 'black-text': 'black-text', bw: 'black-and-white' } as const;
/** Canvas JPEG encoding (softened colour only) is limited by iOS canvas size. */
const CANVAS_PIXELS = 16_777_216;

export default defineProcessor({
  options: GrayscalePdfOptions,
  async run(input, options, { progress, signal }) {
    progress(0.02, 'Reading the PDF');
    const doc = await readPdf(input);
    const settings: ToneSettings = {
      method: options.method,
      brightness: options.brightness / 100,
      contrast: options.contrast / 100,
      mode: options.mode,
      threshold: options.threshold / 100,
      strength: options.mode === 'gray' ? options.strength / 100 : 1,
    };
    progress(0.08, 'Converting text, drawings and gradients');
    const result = grayscaleDocument(doc, settings, signal);

    let failed = 0;
    let tooLarge = 0;
    const images = result.images.filter((image) => {
      const fits = image.width * image.height <= MAX_PIXELS;
      if (!fits) tooLarge += 1;
      return fits;
    });
    if (images.length > 0) {
      progress(0.2, 'Decoding images');
      const isolated = await isolateImages(
        doc,
        images.map((image) => image.ref),
      );
      // pdf.js has decoders for every image format a PDF can hold.
      const { decodePageImage, openForRendering } = await import('@niftyfix/engine-pdf/render');
      const { doc: decoder, close } = await openForRendering(isolated, {
        assetOrigin: globalThis.location.origin,
        rawImages: true,
      });
      try {
        for (const [index, image] of images.entries()) {
          signal.throwIfAborted();
          progress(0.2 + (0.65 * index) / images.length, `Image ${index + 1} of ${images.length}`);
          const decoded = await decodePageImage(decoder, index);
          if (decoded?.width !== image.width || decoded.height !== image.height) {
            failed += 1;
            continue;
          }
          const { width, height } = image;
          const toned = tonePixels(decoded.data, width, height, settings, options.dither);
          // A colour-key mask the decoder applied becomes a soft mask.
          let alpha: Uint8Array | undefined;
          for (let p = 0; p < width * height; p += 1) {
            if ((decoded.data[p * 4 + 3] ?? 255) < 255) {
              alpha = Uint8Array.from(
                { length: width * height },
                (_, i) => decoded.data[i * 4 + 3] ?? 255,
              );
              break;
            }
          }
          const common = { width, height, ...(alpha ? { alpha } : {}) };
          if (toned.bits === 1) {
            replaceImage(doc, image.ref, {
              ...common,
              data: toned.data,
              filter: 'FlateDecode',
              space: 'DeviceGray',
              bits: 1,
            });
          } else if (toned.channels === 1) {
            // Photos stored lossy stay JPEG (now one channel) when that is smaller.
            const jpeg = image.lossy ? encodeGrayJpeg(toned.data, width, height, 0.9) : null;
            const flate = await deflatedSize(toned.data);
            const useJpeg = jpeg !== null && jpeg.length < flate;
            replaceImage(doc, image.ref, {
              ...common,
              data: useJpeg ? jpeg : toned.data,
              filter: useJpeg ? 'DCTDecode' : 'FlateDecode',
              space: 'DeviceGray',
              bits: 8,
            });
          } else {
            let data: Uint8Array = toned.data;
            let filter: 'DCTDecode' | 'FlateDecode' = 'FlateDecode';
            if (image.lossy && width * height <= CANVAS_PIXELS) {
              const rgba = new Uint8ClampedArray(width * height * 4);
              for (let p = 0; p < width * height; p += 1) {
                rgba.set(toned.data.subarray(p * 3, p * 3 + 3), p * 4);
                rgba[p * 4 + 3] = 255;
              }
              const blob = await encodeCanvas(
                writePixels({ data: rgba, width, height }),
                'jpeg',
                0.9,
              );
              data = new Uint8Array(await blob.arrayBuffer());
              filter = 'DCTDecode';
            }
            replaceImage(doc, image.ref, { ...common, data, filter, space: 'DeviceRGB', bits: 8 });
          }
        }
      } finally {
        await close();
      }
    }

    progress(0.9, 'Saving and checking');
    const warnings = [
      failed > 0
        ? `${plural(failed, 'image is', 'images are')} damaged in the PDF and kept as they were.`
        : '',
      tooLarge > 0
        ? `${plural(tooLarge, 'image is', 'images are')} over ${MAX_PIXELS / 1_000_000} megapixels, too large to convert in a browser, and kept as they were.`
        : '',
      result.skipped > 0
        ? `${plural(result.skipped, 'colour', 'colours')} in an unreadable form were kept as they were.`
        : '',
    ].filter(Boolean);
    const output = await finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, SUFFIX[options.mode], 'pdf'),
      pages: doc.getPageCount(),
      inputBytes: input.bytes,
      facts: [
        {
          label: 'Text and drawings',
          value: `${plural(result.streams, 'stream', 'streams')} converted, still selectable`,
        },
        { label: 'Images converted', value: String(images.length - failed) },
      ],
      warnings,
    });
    if (!isGrayOnly(settings)) return output;
    // Read the saved file back and look for any colour at all.
    const saved = await loadPdf(new Uint8Array(await output.blob.arrayBuffer()), {
      maxPages: MAX_PDF_PAGES,
    });
    const left = colourLeft(saved);
    const check: VerificationCheck = {
      id: 'colour',
      label: 'No colour left in the file',
      required: '0 colour items',
      actual: `${left} colour item${left === 1 ? '' : 's'}`,
      status: left === 0 ? 'pass' : 'fail',
    };
    return { ...output, verification: [...output.verification, check] };
  },
});

async function deflatedSize(data: Uint8Array): Promise<number> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream('deflate'));
  return (await new Response(stream).arrayBuffer()).byteLength;
}
