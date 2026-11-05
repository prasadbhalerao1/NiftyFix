import {
  decodeImage,
  hasTransparency,
  renderCropped,
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
import manifest from './manifest';
import { CropImageOptions } from './options';

export default defineProcessor({
  options: CropImageOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading image');
    const header = await readSafeHeader(
      input.blob,
      manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY,
    );
    const bitmap = await decodeImage(input.blob);
    try {
      const source = { width: bitmap.width, height: bitmap.height };
      // Whole pixels, kept inside the image.
      const x = Math.max(0, Math.round(options.crop.x));
      const y = Math.max(0, Math.round(options.crop.y));
      const width = Math.min(source.width - x, Math.round(options.crop.width));
      const height = Math.min(source.height - y, Math.round(options.crop.height));
      if (width < 1 || height < 1) {
        throw new ToolError(
          'INVALID_OPTIONS',
          'The crop area is outside the image. Please adjust it and try again.',
        );
      }

      let format: EncodableFormat = sameFormatAs(
        header.format,
        () => hasTransparency(bitmap),
        false,
      );
      context.progress(0.3, 'Cropping');
      // Same size in and out: the kept pixels are copied, not resampled.
      const canvas = renderCropped(
        bitmap,
        { x, y, width, height },
        width,
        height,
        format === 'jpeg' ? '#ffffff' : null,
      );
      if (format === 'webp') format = await webpOrPng(canvas);
      if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');

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
        'cropped',
        FILE_FORMATS[format].extensions[0],
      );
      const verification = await verifyImageOutput(exported.bytes, {
        width,
        height,
        format,
        range: {},
        fileName,
      });
      const facts: OutputFact[] = [
        { label: 'Original', value: `${source.width} × ${source.height} px` },
        {
          label: 'Cropped',
          value: `${width} × ${height} px · ${formatBytesExact(exported.bytes.length)}`,
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
