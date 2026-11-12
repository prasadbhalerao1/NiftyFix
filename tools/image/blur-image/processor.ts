import { redactPixels } from '@niftyfix/engine-image';
import {
  decodeImage,
  hasTransparency,
  readPixels,
  renderCropped,
  sameFormatAs,
  webpOrPng,
  writePixels,
  type EncodableFormat,
} from '@niftyfix/engine-image/browser';
import { exportImage, readSafeHeader, verifyImageOutput } from '@niftyfix/engine-image/pipeline';
import { resolveOutputName } from '@niftyfix/runtime';
import {
  defineProcessor,
  FILE_FORMATS,
  formatBytesExact,
  ToolError,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import manifest from './manifest';
import { BlurImageOptions } from './options';

const NAMES = {
  black: ['black box', 'black boxes'],
  white: ['white box', 'white boxes'],
  pixelate: ['pixelated area', 'pixelated areas'],
  blur: ['blurred area', 'blurred areas'],
} as const;

/** JPEG may shift a flat colour by a few levels; anything more means content shows through. */
const SOLID_TOLERANCE = 24;

export default defineProcessor({
  options: BlurImageOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading image');
    const header = await readSafeHeader(
      input.blob,
      manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY,
    );
    const bitmap = await decodeImage(input.blob);
    try {
      const { width, height } = bitmap;
      let format: EncodableFormat = sameFormatAs(
        header.format,
        () => hasTransparency(bitmap),
        false,
      );
      context.progress(0.2, 'Covering the marked areas');
      const pixels = readPixels(
        renderCropped(
          bitmap,
          { x: 0, y: 0, width, height },
          width,
          height,
          format === 'jpeg' ? '#ffffff' : null,
        ),
      );
      const applied = redactPixels(pixels, options.boxes, options.strength);
      if (applied === 0) {
        throw new ToolError('INVALID_OPTIONS', 'Every marked area is outside the image.', {
          hint: 'Draw the boxes over the picture and try again.',
        });
      }
      const canvas = writePixels(pixels);
      if (format === 'webp') format = await webpOrPng(canvas);
      context.signal.throwIfAborted();

      context.progress(0.6, 'Saving');
      // Re-encoding also drops location and camera data (EXIF).
      const exported = await exportImage(canvas, {
        format,
        range: {},
        quality: 0.95,
        qualityFloor: 0.95,
        subject: 'image',
        signal: context.signal,
      });

      context.progress(0.85, 'Verifying');
      const fileName = resolveOutputName(
        input.name,
        options.fileName,
        'redacted',
        FILE_FORMATS[format].extensions[0],
      );
      const verification = await verifyImageOutput(exported.bytes, {
        width,
        height,
        format,
        range: {},
        fileName,
      });
      verification.push(await solidCheck(exported.bytes, FILE_FORMATS[format].mime, options.boxes));

      const describe = (Object.keys(NAMES) as (keyof typeof NAMES)[])
        .map((style) => [style, options.boxes.filter((box) => box.style === style).length] as const)
        .filter(([, count]) => count > 0)
        .map(([style, count]) => `${count} ${NAMES[style][count === 1 ? 0 : 1]}`)
        .join(', ');
      return {
        blob: new Blob([exported.bytes.slice().buffer], { type: FILE_FORMATS[format].mime }),
        fileName,
        format,
        bytes: exported.bytes.length,
        facts: [
          { label: 'Covered', value: describe },
          {
            label: 'Image',
            value: `${width} × ${height} px · ${formatBytesExact(exported.bytes.length)}`,
          },
          { label: 'Location and camera data', value: 'Removed' },
        ],
        verification,
        warnings: options.boxes.some((box) => box.style === 'pixelate' || box.style === 'blur')
          ? [
              'Blur and pixelation can sometimes be undone. For numbers and text, black boxes are safest.',
            ]
          : [],
      };
    } finally {
      bitmap.close();
    }
  },
});

/** Decode the saved file and check that black and white boxes are solid all the way through. */
async function solidCheck(
  bytes: Uint8Array,
  mime: string,
  boxes: BlurImageOptions['boxes'],
): Promise<VerificationCheck> {
  const solid = boxes.filter((box) => box.style === 'black' || box.style === 'white');
  const check = {
    id: 'covered',
    label: 'Black and white boxes are solid',
    required: 'Nothing shows through',
  };
  if (solid.length === 0) return { ...check, actual: 'No solid boxes', status: 'pass' };
  const bitmap = await decodeImage(new Blob([bytes as BlobPart], { type: mime }));
  const { width, height } = bitmap;
  const saved = readPixels(
    renderCropped(bitmap, { x: 0, y: 0, width, height }, width, height, null),
  );
  bitmap.close();
  let leaks = 0;
  for (const box of solid) {
    const target = box.style === 'black' ? 0 : 255;
    // Inside by a pixel: JPEG blocks blend the very edge with its neighbours.
    const x0 = Math.max(0, Math.ceil(box.x) + 1);
    const y0 = Math.max(0, Math.ceil(box.y) + 1);
    const x1 = Math.min(saved.width, Math.floor(box.x + box.width) - 1);
    const y1 = Math.min(saved.height, Math.floor(box.y + box.height) - 1);
    let bad = false;
    for (let y = y0; y < y1 && !bad; y += 1) {
      for (let x = x0; x < x1 && !bad; x += 1) {
        const i = (y * saved.width + x) * 4;
        for (let c = 0; c < 3; c += 1) {
          if (Math.abs((saved.data[i + c] ?? 0) - target) > SOLID_TOLERANCE) bad = true;
        }
      }
    }
    if (bad) leaks += 1;
  }
  return {
    ...check,
    actual: leaks === 0 ? 'Nothing shows through' : `${leaks} box(es) not solid`,
    status: leaks === 0 ? 'pass' : 'fail',
  };
}
