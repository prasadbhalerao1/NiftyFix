import type { ByteRange } from '@niftyfix/constraints';
import { assessLegibility, enhancePixels, type LegibilityIssue } from '@niftyfix/engine-image';
import {
  decodeImage,
  fitInto,
  readPixels,
  renderCropped,
  writePixels,
} from '@niftyfix/engine-image/browser';
import { exportImage, readSafeHeader, verifyImageOutput } from '@niftyfix/engine-image/pipeline';
import { resolveOutputName } from '@niftyfix/runtime';
import {
  defineProcessor,
  FILE_FORMATS,
  formatBytes,
  formatBytesExact,
  ToolError,
  type OutputFact,
  type ProcessingContext,
} from '@niftyfix/tool-sdk';
import manifest from './manifest';
import { SignatureResizerOptions } from './options';

const throwIfCancelled = (context: ProcessingContext): void => {
  if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
};

/** Cleanup runs at this resolution: enough detail for thin strokes, bounded cost on phones. */
function workingSize(
  crop: { width: number; height: number },
  output: { width: number; height: number },
) {
  const cap = Math.min(3000, Math.max(1600, 2 * Math.max(output.width, output.height)));
  const scale = Math.min(1, cap / Math.max(crop.width, crop.height));
  return {
    width: Math.max(1, Math.round(crop.width * scale)),
    height: Math.max(1, Math.round(crop.height * scale)),
  };
}

const LEGIBILITY_WARNINGS: Record<LegibilityIssue, string> = {
  'strokes-lost':
    'Some pen strokes became much lighter or disappeared with these cleanup settings. Compare with the original and lower "Background cleanup" or use Colour/Grayscale instead of Black & white.',
  empty:
    'Almost nothing of the signature is visible after cleanup. Check the crop and the cleanup settings.',
  'background-dark':
    'A large part of the image is still dark. Turn on "Even out lighting", raise "Background cleanup", or crop closer to the signature.',
};

export default defineProcessor({
  options: SignatureResizerOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading image');
    await readSafeHeader(input.blob, manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY);
    if (options.enhance.transparent && options.format !== 'png') {
      throw new ToolError('INVALID_OPTIONS', 'A transparent background needs PNG output.');
    }

    const bitmap = await decodeImage(input.blob);
    const source = { width: bitmap.width, height: bitmap.height };
    let working;
    try {
      throwIfCancelled(context);
      const { crop } = options;
      if (crop.x + crop.width > bitmap.width + 1 || crop.y + crop.height > bitmap.height + 1) {
        throw new ToolError(
          'INVALID_OPTIONS',
          'The crop area is outside the image. Please adjust it and try again.',
        );
      }
      context.progress(0.1, 'Cropping');
      const size = workingSize(crop, options);
      // Composite on white so transparent inputs are analysed as ink on paper.
      working = renderCropped(bitmap, crop, size.width, size.height, '#ffffff');
    } finally {
      bitmap.close();
    }
    throwIfCancelled(context);

    context.progress(0.2, 'Cleaning up the background');
    const original = readPixels(working);
    const enhanced = enhancePixels(original, options.enhance);
    const warnings = assessLegibility(original, enhanced).map(
      (issue) => LEGIBILITY_WARNINGS[issue],
    );
    const cleaned = writePixels(enhanced);
    throwIfCancelled(context);

    context.progress(0.35, 'Resizing');
    const background = options.enhance.transparent ? null : '#ffffff';
    const canvas =
      options.placement === 'fit'
        ? fitInto(cleaned, options.width, options.height, background)
        : renderCropped(
            cleaned,
            { x: 0, y: 0, width: cleaned.width, height: cleaned.height },
            options.width,
            options.height,
            background,
          );

    const range: ByteRange = {
      ...(options.minBytes === undefined ? {} : { minBytes: options.minBytes }),
      ...(options.maxBytes === undefined ? {} : { maxBytes: options.maxBytes }),
    };
    const dpi = options.format === 'jpeg' ? options.dpi : undefined;
    context.progress(0.45, 'Finding the best quality for your size limit');
    const exported = await exportImage(canvas, {
      format: options.format,
      range,
      dpi,
      quality: options.quality,
      qualityFloor: options.qualityFloor,
      subject: 'signature',
      signal: context.signal,
      onAttempt: (attempt) =>
        context.progress(
          Math.min(0.88, 0.45 + attempt * 0.05),
          'Finding the best quality for your size limit',
        ),
    });
    throwIfCancelled(context);

    context.progress(0.92, 'Verifying');
    const fileName = resolveOutputName(
      input.name,
      options.fileName,
      `signature-${options.width}x${options.height}`,
      FILE_FORMATS[options.format].extensions[0],
    );
    const verification = await verifyImageOutput(exported.bytes, {
      width: options.width,
      height: options.height,
      format: options.format,
      range,
      dpi,
      fileName,
    });

    const facts: OutputFact[] = [
      {
        label: 'Original',
        value: `${source.width} × ${source.height} px · ${formatBytes(input.bytes)}`,
      },
      {
        label: 'Output',
        value: `${options.width} × ${options.height} px · ${formatBytesExact(exported.bytes.length)}`,
      },
      { label: 'Format', value: FILE_FORMATS[options.format].label },
      {
        label: 'Cleanup',
        value: `${options.enhance.mode === 'color' ? 'colour ink' : options.enhance.mode === 'grayscale' ? 'grayscale' : 'black & white'}${options.enhance.flatten ? ', lighting evened out' : ''}${options.enhance.transparent ? ', transparent background' : ''}`,
      },
    ];
    if (exported.quality !== null) {
      facts.push({ label: 'Quality used', value: `${Math.round(exported.quality * 100)}%` });
    }

    context.progress(1, 'Done');
    return {
      blob: new Blob([exported.bytes.slice().buffer], { type: FILE_FORMATS[options.format].mime }),
      fileName,
      format: options.format,
      bytes: exported.bytes.length,
      facts,
      verification,
      warnings,
    };
  },
});
