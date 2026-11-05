import { centredCropForAspect, upscaleFactor } from '@niftyfix/constraints';
import {
  decodeImage,
  fitInto,
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
  formatBytes,
  formatBytesExact,
  type OutputFact,
  type ProcessingContext,
} from '@niftyfix/tool-sdk';
import manifest from './manifest';
import { ResizeImageOptions } from './options';

const throwIfCancelled = (context: ProcessingContext): void => {
  if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
};

export default defineProcessor({
  options: ResizeImageOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading image');
    const header = await readSafeHeader(
      input.blob,
      manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY,
    );
    const bitmap = await decodeImage(input.blob);
    try {
      throwIfCancelled(context);
      const source = { width: bitmap.width, height: bitmap.height };
      const { width, height } = options;
      let format: EncodableFormat =
        options.format === 'auto'
          ? sameFormatAs(header.format, () => hasTransparency(bitmap), false)
          : options.format;
      // JPEG has no transparency, so borders and see-through areas become white.
      const background = (): string | null => (format === 'jpeg' ? '#ffffff' : null);

      context.progress(0.2, 'Resizing');
      const full = { x: 0, y: 0, ...source };
      const drawn =
        options.fit === 'contain'
          ? fitInto(bitmap, width, height, background())
          : renderCropped(
              bitmap,
              options.fit === 'cover' ? centredCropForAspect(source, width / height) : full,
              width,
              height,
              background(),
            );
      throwIfCancelled(context);
      if (options.format === 'auto' && format === 'webp') format = await webpOrPng(drawn);

      context.progress(0.6, 'Saving');
      const dpi = format === 'jpeg' ? options.dpi : undefined;
      const exported = await exportImage(drawn, {
        format,
        range: {},
        dpi,
        quality: 0.92,
        qualityFloor: 0.92,
        subject: 'image',
        signal: context.signal,
      });
      throwIfCancelled(context);

      const warnings: string[] = [];
      const enlarged = upscaleFactor(source, { width, height });
      if (enlarged > 1.5) {
        warnings.push(
          `The image is enlarged ${enlarged.toFixed(1)}× from ${source.width} × ${source.height} px, so it may look soft. Enlarging cannot add detail that was not in the original.`,
        );
      }
      if (
        options.fit === 'stretch' &&
        Math.abs(width / height - source.width / source.height) > 0.01
      ) {
        warnings.push('The new shape differs from the original, so the image is stretched.');
      }

      context.progress(0.9, 'Verifying');
      const fileName = resolveOutputName(
        input.name,
        options.fileName,
        `${width}x${height}`,
        FILE_FORMATS[format].extensions[0],
      );
      const verification = await verifyImageOutput(exported.bytes, {
        width,
        height,
        format,
        range: {},
        dpi,
        fileName,
      });

      const facts: OutputFact[] = [
        {
          label: 'Original',
          value: `${source.width} × ${source.height} px · ${formatBytes(input.bytes)}`,
        },
        {
          label: 'Resized',
          value: `${width} × ${height} px · ${formatBytesExact(exported.bytes.length)}`,
        },
        { label: 'Format', value: FILE_FORMATS[format].label },
      ];
      if (dpi !== undefined) facts.push({ label: 'DPI', value: String(dpi) });

      context.progress(1, 'Done');
      return {
        blob: new Blob([exported.bytes.slice().buffer], { type: FILE_FORMATS[format].mime }),
        fileName,
        format,
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
