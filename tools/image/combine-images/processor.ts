import { createCanvas, decodeImage } from '@niftyfix/engine-image/browser';
import { exportImage, readSafeHeader, verifyImageOutput } from '@niftyfix/engine-image/pipeline';
import { resolveOutputName } from '@niftyfix/runtime';
import {
  defineMultiFileProcessor,
  formatBytesExact,
  ToolError,
  type OutputFact,
} from '@niftyfix/tool-sdk';
import { planLayout, PRINT_DPI, type Size } from './layout';
import { CombineImagesOptions, MAX_IMAGES, MIN_IMAGES } from './options';

const ARRANGEMENT_LABEL: Record<CombineImagesOptions['arrangement'], string> = {
  vertical: 'One under another',
  horizontal: 'Side by side',
  grid: 'Grid',
  'id-a4': 'ID cards on A4',
};

/**
 * Images are decoded twice: once to learn their upright size, then one at a
 * time to draw. Holding every decoded image at once would run a phone out of
 * memory with a handful of camera photos.
 */
export default defineMultiFileProcessor({
  options: CombineImagesOptions,
  inputs: { min: MIN_IMAGES, max: MAX_IMAGES },
  async run(inputs, options, { progress, signal }) {
    const sizes: Size[] = [];
    for (const [index, input] of inputs.entries()) {
      signal.throwIfAborted();
      progress((index / inputs.length) * 0.3, `Reading ${index + 1} of ${inputs.length}`);
      await readSafeHeader(input.blob, options.maxPixels);
      const bitmap = await decodeImage(input.blob);
      sizes.push({ width: bitmap.width, height: bitmap.height });
      bitmap.close();
    }

    const layout = planLayout(sizes, options);
    const canvas = createCanvas(layout.width, layout.height);
    const ctx = canvas.getContext('2d') as
      OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
    if (ctx === null) {
      throw new ToolError(
        'OUT_OF_MEMORY',
        'There is not enough memory to draw the combined image.',
        {
          hint: 'Combine fewer or smaller images.',
        },
      );
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (options.format === 'jpeg' || options.arrangement === 'id-a4') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, layout.width, layout.height);
    }

    for (const [index, input] of inputs.entries()) {
      signal.throwIfAborted();
      progress(0.3 + (index / inputs.length) * 0.4, `Placing ${index + 1} of ${inputs.length}`);
      const placed = layout.placements[index];
      if (!placed) continue;
      const bitmap = await decodeImage(input.blob);
      try {
        ctx.drawImage(bitmap, placed.x, placed.y, placed.width, placed.height);
      } finally {
        bitmap.close();
      }
      if (options.arrangement === 'id-a4' && options.cutLines) {
        ctx.strokeStyle = '#b5b5b5';
        ctx.lineWidth = 1;
        ctx.strokeRect(placed.x - 1.5, placed.y - 1.5, placed.width + 3, placed.height + 3);
      }
    }

    progress(0.75, 'Saving');
    const dpi =
      options.arrangement === 'id-a4' && options.format === 'jpeg' ? PRINT_DPI : undefined;
    const exported = await exportImage(canvas, {
      format: options.format,
      range: {},
      dpi,
      quality: 0.92,
      qualityFloor: 0.92,
      subject: 'image',
      signal,
    });

    progress(0.9, 'Verifying');
    const extension = options.format === 'jpeg' ? 'jpg' : 'png';
    const fileName = resolveOutputName(
      inputs[0]?.name ?? 'images',
      options.fileName,
      'combined',
      extension,
    );
    const verification = await verifyImageOutput(exported.bytes, {
      width: layout.width,
      height: layout.height,
      format: options.format,
      range: {},
      dpi,
      fileName,
    });
    const facts: OutputFact[] = [
      { label: 'Images', value: String(inputs.length) },
      { label: 'Layout', value: ARRANGEMENT_LABEL[options.arrangement] },
      {
        label: 'File',
        value: `${layout.width} × ${layout.height} px · ${formatBytesExact(exported.bytes.length)}`,
      },
    ];
    const warnings =
      layout.scale < 1
        ? [
            `The combined image was scaled to ${Math.round(layout.scale * 100)}% so it opens on phones too. Combine fewer images for full resolution.`,
          ]
        : [];

    progress(1, 'Done');
    return {
      blob: new Blob([exported.bytes.slice().buffer], {
        type: options.format === 'jpeg' ? 'image/jpeg' : 'image/png',
      }),
      fileName,
      format: options.format,
      bytes: exported.bytes.length,
      facts,
      verification,
      warnings,
    };
  },
});
