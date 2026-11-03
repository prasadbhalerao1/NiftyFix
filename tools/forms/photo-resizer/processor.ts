import {
  solveQualityForRange,
  positionInRange,
  upscaleFactor,
  type ByteRange,
} from '@niftyfix/constraints';
import { HEADER_PROBE_BYTES, jpegDpi, readImageHeader, setJpegDpi } from '@niftyfix/engine-image';
import { decodeImage, encodeCanvas, renderCropped } from '@niftyfix/engine-image/browser';
import { outputFileName, sanitizeBaseName } from '@niftyfix/runtime';
import {
  defineProcessor,
  FILE_FORMATS,
  formatBytes,
  formatBytesExact,
  ToolError,
  type OutputFact,
  type ProcessingContext,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import manifest from './manifest';
import { PhotoResizerOptions } from './options';

const throwIfCancelled = (context: ProcessingContext): void => {
  if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
};

const percent = (quality: number): string => `${Math.round(quality * 100)}%`;

function describeRange(range: ByteRange): string {
  if (range.minBytes !== undefined && range.maxBytes !== undefined) {
    return `${formatBytes(range.minBytes)} – ${formatBytes(range.maxBytes)}`;
  }
  if (range.maxBytes !== undefined) return `at most ${formatBytes(range.maxBytes)}`;
  if (range.minBytes !== undefined) return `at least ${formatBytes(range.minBytes)}`;
  return 'any';
}

export default defineProcessor({
  options: PhotoResizerOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading photo');
    const head = new Uint8Array(await input.blob.slice(0, HEADER_PROBE_BYTES).arrayBuffer());
    const header = readImageHeader(head);
    if (header === null) {
      throw new ToolError('CORRUPT_INPUT', 'This image header is damaged or unreadable.', {
        hint: 'Save a fresh copy from your gallery or camera app and try again.',
      });
    }
    const maxPixels = manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY;
    if (header.width * header.height > maxPixels) {
      throw new ToolError(
        'TOO_MANY_PIXELS',
        `This image is ${header.width} × ${header.height} px, which is too large to process safely in a browser.`,
        { hint: 'Resize it in your gallery app first, or use a smaller photo.' },
      );
    }

    const bitmap = await decodeImage(input.blob);
    try {
      throwIfCancelled(context);
      const source = { width: bitmap.width, height: bitmap.height };
      const crop = options.crop;
      if (crop.x + crop.width > source.width + 1 || crop.y + crop.height > source.height + 1) {
        throw new ToolError(
          'INVALID_OPTIONS',
          'The crop area is outside the photo. Please adjust it and try again.',
        );
      }
      const warnings: string[] = [];
      const upscale = upscaleFactor(crop, options);
      if (upscale > 1.5) {
        warnings.push(
          `The selected area is enlarged ${upscale.toFixed(1)}× to reach ${options.width} × ${options.height} px, so the photo may look soft. Select a larger area or use a higher-resolution photo.`,
        );
      }

      context.progress(0.15, 'Resizing');
      const background = options.format === 'jpeg' ? options.background : null;
      const canvas = renderCropped(bitmap, crop, options.width, options.height, background);
      throwIfCancelled(context);

      const range: ByteRange = {
        ...(options.minBytes === undefined ? {} : { minBytes: options.minBytes }),
        ...(options.maxBytes === undefined ? {} : { maxBytes: options.maxBytes }),
      };
      const hasRange = range.minBytes !== undefined || range.maxBytes !== undefined;
      const dpi = options.format === 'jpeg' ? options.dpi : undefined;

      const encode = async (quality: number): Promise<{ bytes: number; value: Uint8Array }> => {
        const blob = await encodeCanvas(canvas, options.format, quality);
        let bytes: Uint8Array = new Uint8Array(await blob.arrayBuffer());
        if (dpi !== undefined) bytes = setJpegDpi(bytes, dpi);
        return { bytes: bytes.length, value: bytes };
      };

      let chosen: { quality: number | null; bytes: Uint8Array };
      context.progress(0.3, hasRange ? 'Finding the best quality for your size limit' : 'Encoding');
      if (options.format === 'png') {
        const { value } = await encode(1);
        if (hasRange && positionInRange(value.length, range) !== 'within') {
          throw new ToolError(
            'TARGET_UNREACHABLE',
            `As PNG this photo is ${formatBytes(value.length)}, outside your limit (${describeRange(range)}). PNG is lossless, so its size cannot be tuned.`,
            { hint: 'Choose JPEG, which can be compressed to fit a size range.' },
          );
        }
        chosen = { quality: null, bytes: value };
      } else if (hasRange) {
        let encodes = 0;
        const result = await solveQualityForRange({
          encode: async (quality) => {
            const out = await encode(quality);
            encodes += 1;
            context.progress(
              Math.min(0.85, 0.3 + encodes * 0.06),
              'Finding the best quality for your size limit',
            );
            return out;
          },
          range,
          qualityFloor: Math.min(options.qualityFloor, 1),
          qualityCeiling: 1,
          signal: context.signal,
        });
        if (result.status !== 'met') {
          const closest = result.closest;
          const reason =
            result.status === 'too-large'
              ? `Even at the lowest quality you allow (${percent(options.qualityFloor)}), the photo is ${formatBytes(closest.bytes)}, above the ${formatBytes(range.maxBytes ?? 0)} maximum.`
              : result.status === 'too-small'
                ? `Even at maximum quality the photo is only ${formatBytes(closest.bytes)}, below the ${formatBytes(range.minBytes ?? 0)} minimum. We never pad files with junk data to reach a minimum.`
                : `No quality setting produces a file inside ${describeRange(range)}; the closest is ${formatBytes(closest.bytes)}.`;
          const hint =
            result.status === 'too-large'
              ? 'Lower the minimum quality, choose smaller dimensions if the form allows, or crop out busy background.'
              : result.status === 'too-small'
                ? 'Use larger pixel dimensions if the form allows them, or check whether the minimum really applies.'
                : 'Widen the size range slightly or change the dimensions.';
          throw new ToolError('TARGET_UNREACHABLE', reason, { hint });
        }
        chosen = { quality: result.attempt.quality, bytes: result.attempt.value };
      } else {
        const { value } = await encode(options.quality);
        chosen = { quality: options.quality, bytes: value };
      }
      throwIfCancelled(context);

      context.progress(0.9, 'Verifying');
      const extension = FILE_FORMATS[options.format].extensions[0];
      const baseName = options.fileName.trim() ? sanitizeBaseName(options.fileName) : null;
      const fileName = baseName
        ? `${baseName}.${extension}`
        : outputFileName(input.name, `${options.width}x${options.height}`, extension);
      const blob = new Blob([chosen.bytes.buffer as ArrayBuffer], {
        type: FILE_FORMATS[options.format].mime,
      });
      const verification = await verifyOutput(
        chosen.bytes,
        blob,
        fileName,
        options,
        range,
        hasRange,
      );

      const facts: OutputFact[] = [
        {
          label: 'Original',
          value: `${source.width} × ${source.height} px · ${formatBytes(input.bytes)}`,
        },
        {
          label: 'Output',
          value: `${options.width} × ${options.height} px · ${formatBytesExact(chosen.bytes.length)}`,
        },
        { label: 'Format', value: FILE_FORMATS[options.format].label },
      ];
      if (chosen.quality !== null)
        facts.push({ label: 'Quality used', value: percent(chosen.quality) });

      context.progress(1, 'Done');
      return {
        blob,
        fileName,
        format: options.format,
        bytes: chosen.bytes.length,
        facts,
        verification,
        warnings,
      };
    } finally {
      bitmap.close();
    }
  },
});

/** Re-measure the produced file; nothing here trusts the encoder's intent. */
async function verifyOutput(
  bytes: Uint8Array,
  blob: Blob,
  fileName: string,
  options: PhotoResizerOptions,
  range: ByteRange,
  hasRange: boolean,
): Promise<VerificationCheck[]> {
  const header = readImageHeader(bytes.subarray(0, HEADER_PROBE_BYTES));
  const checks: VerificationCheck[] = [];
  const wantDims = `${options.width} × ${options.height} px`;

  let decoded: { width: number; height: number } | null = null;
  try {
    const bitmap = await createImageBitmap(blob);
    decoded = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
  } catch {
    decoded = null;
  }
  checks.push({
    id: 'dimensions',
    label: 'Dimensions',
    required: wantDims,
    actual: header ? `${header.width} × ${header.height} px` : 'unreadable',
    status:
      header?.width === options.width &&
      header.height === options.height &&
      decoded?.width === options.width &&
      decoded.height === options.height
        ? 'pass'
        : 'fail',
  });

  checks.push({
    id: 'size',
    label: 'File size',
    required: describeRange(range),
    actual: formatBytesExact(bytes.length),
    status: !hasRange
      ? 'not-checked'
      : positionInRange(bytes.length, range) === 'within'
        ? 'pass'
        : 'fail',
    ...(hasRange ? {} : { note: 'No size limit was set.' }),
  });

  const label = FILE_FORMATS[options.format].label;
  checks.push({
    id: 'format',
    label: 'Format',
    required: label,
    actual: header ? FILE_FORMATS[header.format].label : 'unknown',
    status: header?.format === options.format && decoded !== null ? 'pass' : 'fail',
  });

  const extension = fileName.slice(fileName.lastIndexOf('.') + 1);
  const allowed: readonly string[] = FILE_FORMATS[options.format].extensions;
  checks.push({
    id: 'extension',
    label: 'File extension',
    required: allowed.map((e) => `.${e}`).join(' or '),
    actual: `.${extension}`,
    status: allowed.includes(extension) ? 'pass' : 'fail',
  });

  if (options.format === 'jpeg') {
    const actualDpi = jpegDpi(bytes);
    checks.push({
      id: 'dpi',
      label: 'Resolution (DPI)',
      required: options.dpi === undefined ? 'not set' : `${options.dpi} DPI`,
      actual: actualDpi === null ? 'not declared' : `${actualDpi} DPI`,
      status:
        options.dpi === undefined ? 'not-checked' : actualDpi === options.dpi ? 'pass' : 'fail',
    });
  }
  return checks;
}
