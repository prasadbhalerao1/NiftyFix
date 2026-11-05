import { decodeImage, hasTransparency, renderCropped } from '@niftyfix/engine-image/browser';
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
import { ConvertImageOptions } from './options';

const throwIfCancelled = (context: ProcessingContext): void => {
  if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
};

export default defineProcessor({
  options: ConvertImageOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading image');
    const header = await readSafeHeader(
      input.blob,
      manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY,
    );
    const bitmap = await decodeImage(input.blob);
    try {
      throwIfCancelled(context);
      const size = { width: bitmap.width, height: bitmap.height };
      const { format } = options;
      const warnings: string[] = [];
      if (format === 'jpeg' && hasTransparency(bitmap)) {
        warnings.push(
          `JPG has no transparency, so see-through areas were filled with ${options.background === '#ffffff' ? 'white' : options.background}.`,
        );
      }
      if (header.format === 'gif') {
        warnings.push('Only the first frame of an animated GIF is converted.');
      }

      context.progress(0.3, 'Converting');
      const canvas = renderCropped(
        bitmap,
        { x: 0, y: 0, ...size },
        size.width,
        size.height,
        format === 'jpeg' ? options.background : null,
      );
      throwIfCancelled(context);
      const exported = await exportImage(canvas, {
        format,
        range: {},
        quality: options.quality,
        qualityFloor: options.quality,
        subject: 'image',
        signal: context.signal,
      });
      throwIfCancelled(context);

      context.progress(0.9, 'Verifying');
      const fileName = resolveOutputName(
        input.name,
        options.fileName,
        '',
        FILE_FORMATS[format].extensions[0],
      );
      const verification = await verifyImageOutput(exported.bytes, {
        ...size,
        format,
        range: {},
        fileName,
      });

      const facts: OutputFact[] = [
        {
          label: 'Original',
          value: `${FILE_FORMATS[header.format].label} · ${size.width} × ${size.height} px · ${formatBytes(input.bytes)}`,
        },
        {
          label: 'Converted',
          value: `${FILE_FORMATS[format].label} · ${size.width} × ${size.height} px · ${formatBytesExact(exported.bytes.length)}`,
        },
      ];
      if (exported.quality !== null)
        facts.push({ label: 'Quality', value: `${Math.round(exported.quality * 100)}%` });

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
