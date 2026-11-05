import {
  decodeImage,
  hasTransparency,
  rotateFlip,
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
import { RotateImageOptions } from './options';

export default defineProcessor({
  options: RotateImageOptions,
  async run(input, options, context) {
    if (options.turn === 0 && !options.flipHorizontal && !options.flipVertical) {
      throw new ToolError('INVALID_OPTIONS', 'Choose a rotation or a flip first.');
    }
    context.progress(0.02, 'Reading image');
    const header = await readSafeHeader(
      input.blob,
      manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY,
    );
    // Decoding applies the photo's own EXIF rotation, so turns start from what the user sees.
    const bitmap = await decodeImage(input.blob);
    try {
      let format: EncodableFormat = sameFormatAs(
        header.format,
        () => hasTransparency(bitmap),
        false,
      );
      context.progress(0.3, 'Rotating');
      const canvas = rotateFlip(
        bitmap,
        options.turn,
        options.flipHorizontal,
        options.flipVertical,
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
      const size = { width: canvas.width, height: canvas.height };
      const fileName = resolveOutputName(
        input.name,
        options.fileName,
        'rotated',
        FILE_FORMATS[format].extensions[0],
      );
      const verification = await verifyImageOutput(exported.bytes, {
        ...size,
        format,
        range: {},
        fileName,
      });
      const changes = [
        options.turn === 0 ? null : `${options.turn}° clockwise`,
        options.flipHorizontal ? 'flipped left to right' : null,
        options.flipVertical ? 'flipped top to bottom' : null,
      ].filter((change) => change !== null);
      const facts: OutputFact[] = [
        { label: 'Changes', value: changes.join(', ') },
        {
          label: 'Result',
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
