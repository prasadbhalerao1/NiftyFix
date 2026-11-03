import { upscaleFactor, type ByteRange } from '@niftyfix/constraints';
import { decodeImage, renderCropped } from '@niftyfix/engine-image/browser';
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
import { PhotoResizerOptions } from './options';

const throwIfCancelled = (context: ProcessingContext): void => {
  if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
};

export default defineProcessor({
  options: PhotoResizerOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading photo');
    await readSafeHeader(input.blob, manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY);

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
      const dpi = options.format === 'jpeg' ? options.dpi : undefined;
      const sizing = range.minBytes !== undefined || range.maxBytes !== undefined;
      context.progress(0.3, sizing ? 'Finding the best quality for your size limit' : 'Encoding');
      const exported = await exportImage(canvas, {
        format: options.format,
        range,
        dpi,
        quality: options.quality,
        qualityFloor: options.qualityFloor,
        subject: 'photo',
        signal: context.signal,
        onAttempt: (attempt) =>
          context.progress(
            Math.min(0.85, 0.3 + attempt * 0.06),
            'Finding the best quality for your size limit',
          ),
      });
      throwIfCancelled(context);

      context.progress(0.9, 'Verifying');
      const fileName = resolveOutputName(
        input.name,
        options.fileName,
        `${options.width}x${options.height}`,
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
      ];
      if (exported.quality !== null) {
        facts.push({ label: 'Quality used', value: `${Math.round(exported.quality * 100)}%` });
      }

      context.progress(1, 'Done');
      return {
        blob: new Blob([exported.bytes.slice().buffer], {
          type: FILE_FORMATS[options.format].mime,
        }),
        fileName,
        format: options.format,
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
