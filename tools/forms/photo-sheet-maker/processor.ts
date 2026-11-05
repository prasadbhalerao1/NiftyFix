import { createCanvas, decodeImage, renderCropped } from '@niftyfix/engine-image/browser';
import { exportImage, readSafeHeader, verifyImageOutput } from '@niftyfix/engine-image/pipeline';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, formatBytesExact, ToolError, type OutputFact } from '@niftyfix/tool-sdk';
import { bestLayout, mmToPx } from './layout';
import manifest from './manifest';
import { PhotoSheetOptions, SHEET_DPI } from './options';

const mmLabel = (size: { width: number; height: number }): string =>
  `${Math.round(size.width * 10) / 10} × ${Math.round(size.height * 10) / 10} mm`;

export default defineProcessor({
  options: PhotoSheetOptions,
  async run(input, options, context) {
    const layout = bestLayout(options.sheet, options.photo);
    const count = Math.min(options.copies, layout.positions.length);
    if (count === 0) {
      throw new ToolError('INVALID_OPTIONS', 'This photo size does not fit on the chosen sheet.', {
        hint: 'Choose a larger sheet or a smaller photo size.',
      });
    }
    context.progress(0.05, 'Reading photo');
    await readSafeHeader(input.blob, manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY);
    const bitmap = await decodeImage(input.blob);
    try {
      context.progress(0.2, 'Placing photos');
      const px = (mm: number): number => mmToPx(mm, SHEET_DPI);
      const photo = renderCropped(
        bitmap,
        options.crop,
        px(options.photo.width),
        px(options.photo.height),
        '#ffffff',
      );
      const sheet = createCanvas(px(layout.sheet.width), px(layout.sheet.height));
      const ctx = sheet.getContext('2d') as
        OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
      if (ctx === null) {
        throw new ToolError('ENGINE_CRASHED', 'Your browser could not create an image canvas.', {
          retryable: true,
        });
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sheet.width, sheet.height);
      ctx.strokeStyle = '#b5b5b5';
      ctx.lineWidth = 1;
      for (const { x, y } of layout.positions.slice(0, count)) {
        ctx.drawImage(photo, px(x), px(y));
        // A hairline just outside each photo marks where to cut.
        if (options.cutLines)
          ctx.strokeRect(px(x) - 1.5, px(y) - 1.5, photo.width + 3, photo.height + 3);
      }
      if (context.signal.aborted) throw new DOMException('Cancelled', 'AbortError');

      context.progress(0.6, 'Saving');
      const exported = await exportImage(sheet, {
        format: 'jpeg',
        range: {},
        dpi: SHEET_DPI,
        quality: 0.95,
        qualityFloor: 0.95,
        subject: 'sheet',
        signal: context.signal,
      });

      context.progress(0.9, 'Verifying');
      const fileName = resolveOutputName(input.name, options.fileName, 'photo-sheet', 'jpg');
      const verification = await verifyImageOutput(exported.bytes, {
        width: sheet.width,
        height: sheet.height,
        format: 'jpeg',
        range: {},
        dpi: SHEET_DPI,
        fileName,
      });
      const facts: OutputFact[] = [
        { label: 'Photos', value: `${count} at ${mmLabel(options.photo)}` },
        { label: 'Sheet', value: `${mmLabel(layout.sheet)} at ${SHEET_DPI} DPI` },
        {
          label: 'File',
          value: `${sheet.width} × ${sheet.height} px · ${formatBytesExact(exported.bytes.length)}`,
        },
      ];
      const warnings =
        count < options.copies
          ? [`Only ${count} photos fit on this sheet, so ${count} were placed.`]
          : [];

      context.progress(1, 'Done');
      return {
        blob: new Blob([exported.bytes.slice().buffer], { type: 'image/jpeg' }),
        fileName,
        format: 'jpeg',
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
