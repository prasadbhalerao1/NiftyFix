import type { ByteRange } from '@niftyfix/constraints';
import {
  decodeImage,
  encodeCanvas,
  hasTransparency,
  renderCropped,
  sameFormatAs,
  webpOrPng,
  type Canvas,
  type EncodableFormat,
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
import { CompressImageOptions, LEVELS, TARGET_QUALITY_FLOOR } from './options';

/** Never shrink below this long side to reach a size: the result would be useless. */
const MIN_SIDE = 64;

const throwIfCancelled = (context: ProcessingContext): void => {
  if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
};

export default defineProcessor({
  options: CompressImageOptions,
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
      const longSide = Math.max(source.width, source.height);
      const level = options.mode === 'level' ? LEVELS[options.level] : null;
      const range: ByteRange = options.mode === 'target' ? { maxBytes: options.maxBytes } : {};
      let format: EncodableFormat =
        options.format === 'auto'
          ? sameFormatAs(header.format, () => hasTransparency(bitmap), true)
          : options.format;

      const render = (scale: number): { canvas: Canvas; width: number; height: number } => {
        const width = Math.max(1, Math.round(source.width * scale));
        const height = Math.max(1, Math.round(source.height * scale));
        const background = format === 'jpeg' ? '#ffffff' : null;
        const canvas = renderCropped(bitmap, { x: 0, y: 0, ...source }, width, height, background);
        return { canvas, width, height };
      };

      context.progress(0.1, 'Compressing');
      let scale = Math.min(1, (level?.maxSide ?? longSide) / longSide);
      let frame = render(scale);
      if (options.format === 'auto' && format === 'webp') format = await webpOrPng(frame.canvas);

      // A target that the lowest allowed quality still misses makes the image smaller.
      // One quick encode per step estimates how much: file size grows with pixel count.
      if (options.mode === 'target') {
        for (let step = 1; ; step += 1) {
          throwIfCancelled(context);
          const probe = await encodeCanvas(frame.canvas, format, TARGET_QUALITY_FLOOR);
          if (probe.size <= options.maxBytes) break;
          const next =
            scale * Math.min(0.95, Math.max(0.3, Math.sqrt(options.maxBytes / probe.size) * 0.95));
          if (longSide * next < MIN_SIDE) {
            throw new ToolError(
              'TARGET_UNREACHABLE',
              `This image cannot be made smaller than ${formatBytes(options.maxBytes)} while staying usable.`,
              { hint: 'Choose a larger size limit, or crop the image to the part you need first.' },
            );
          }
          scale = next;
          frame = render(scale);
          context.progress(Math.min(0.5, 0.1 + step * 0.08), 'Making the image smaller to fit');
        }
      }

      context.progress(
        0.55,
        options.mode === 'target' ? 'Finding the best quality for your size limit' : 'Compressing',
      );
      const exported = await exportImage(frame.canvas, {
        format,
        range,
        quality: level?.quality ?? 0.8,
        qualityFloor: TARGET_QUALITY_FLOOR,
        subject: 'image',
        signal: context.signal,
        onAttempt: (attempt) =>
          context.progress(
            Math.min(0.85, 0.55 + attempt * 0.04),
            'Finding the best quality for your size limit',
          ),
      });
      throwIfCancelled(context);

      const size = { width: frame.width, height: frame.height };
      const resized = size.width !== source.width || size.height !== source.height;
      const warnings: string[] = [];
      let bytes = exported.bytes;
      let quality = exported.quality;
      // Never hand back a bigger file than the user gave us. If re-encoding did not help,
      // the original (same format, same pixels, within any limit) is the best answer.
      // (A photo rotated by its EXIF tag is stored sideways, so only an upright original qualifies.)
      const originalFits =
        (options.mode === 'level' || input.bytes <= options.maxBytes) &&
        header.width === source.width &&
        header.height === source.height;
      if (bytes.length >= input.bytes && header.format === format && !resized && originalFits) {
        bytes = new Uint8Array(await input.blob.arrayBuffer());
        quality = null;
        warnings.push(
          'Your image is already well compressed: re-encoding did not make it smaller, so this is your original file, unchanged.',
        );
      } else if (bytes.length >= input.bytes) {
        warnings.push(
          `The new file is not smaller than the original (${formatBytes(input.bytes)}), because it is now ${FILE_FORMATS[format].label}. Keep the original if you do not need the new format.`,
        );
      }
      if (resized) {
        warnings.push(
          `The image was made smaller to reach the size: ${source.width} × ${source.height} px became ${size.width} × ${size.height} px.`,
        );
      }

      context.progress(0.9, 'Verifying');
      const fileName = resolveOutputName(
        input.name,
        options.fileName,
        'compressed',
        FILE_FORMATS[format].extensions[0],
      );
      const verification = await verifyImageOutput(bytes, { ...size, format, range, fileName });

      const facts: OutputFact[] = [
        {
          label: 'Original',
          value: `${source.width} × ${source.height} px · ${formatBytes(input.bytes)}`,
        },
        {
          label: 'Compressed',
          value: `${size.width} × ${size.height} px · ${formatBytesExact(bytes.length)}`,
        },
        {
          label: 'Saved',
          value:
            bytes.length < input.bytes
              ? `${Math.round((1 - bytes.length / input.bytes) * 100)}%`
              : 'nothing',
        },
        { label: 'Format', value: FILE_FORMATS[format].label },
      ];
      if (quality !== null)
        facts.push({ label: 'Quality used', value: `${Math.round(quality * 100)}%` });

      context.progress(1, 'Done');
      return {
        blob: new Blob([bytes.slice().buffer], { type: FILE_FORMATS[format].mime }),
        fileName,
        format,
        bytes: bytes.length,
        facts,
        verification,
        warnings,
      };
    } finally {
      bitmap.close();
    }
  },
});
