import {
  decodeImage,
  hasTransparency,
  renderCropped,
  sameFormatAs,
  webpOrPng,
  type EncodableFormat,
} from '@niftyfix/engine-image/browser';
import { exportImage, readSafeHeader } from '@niftyfix/engine-image/pipeline';
import { readImageHeader } from '@niftyfix/engine-image';
import { readZip, sanitizeBaseName, zipFiles } from '@niftyfix/runtime';
import { defineProcessor, FILE_FORMATS, formatBytes, ToolError } from '@niftyfix/tool-sdk';
import { gridOf, planTiles } from './layout';
import manifest from './manifest';
import { SplitImageOptions } from './options';

/** Page margin for posters, in points (10 mm): most printers cannot print to the edge. */
const POSTER_MARGIN = 28.35;

export default defineProcessor({
  options: SplitImageOptions,
  async run(input, options, context) {
    context.progress(0.02, 'Reading image');
    const header = await readSafeHeader(
      input.blob,
      manifest.input.maxPixels?.desktop ?? Number.POSITIVE_INFINITY,
    );
    const bitmap = await decodeImage(input.blob);
    try {
      const layout = { ...options, overlap: options.overlap / 100 };
      const tiles = planTiles({ width: bitmap.width, height: bitmap.height }, layout);
      if (tiles.some((tile) => tile.width < 1 || tile.height < 1)) {
        throw new ToolError('INVALID_OPTIONS', 'The image is too small for that many pieces.', {
          hint: 'Choose fewer rows or columns.',
        });
      }
      const poster = options.mode === 'poster';
      // Posters go into a PDF (JPEG or PNG only); tiles keep the image's own format.
      let format: EncodableFormat = sameFormatAs(
        header.format,
        () => hasTransparency(bitmap),
        false,
      );
      if (poster && format === 'webp') format = 'png';
      const stem = options.fileName.trim() || sanitizeBaseName(input.name);
      const files: { name: string; bytes: Uint8Array; tile: (typeof tiles)[number] }[] = [];
      for (const [index, tile] of tiles.entries()) {
        context.signal.throwIfAborted();
        context.progress(
          0.05 + (0.8 * index) / tiles.length,
          `Piece ${index + 1} of ${tiles.length}`,
        );
        const canvas = renderCropped(
          bitmap,
          { x: tile.x, y: tile.y, width: tile.width, height: tile.height },
          tile.outWidth,
          tile.outHeight,
          format === 'jpeg' ? '#ffffff' : null,
        );
        const tileFormat = format === 'webp' ? await webpOrPng(canvas) : format;
        const exported = await exportImage(canvas, {
          format: tileFormat,
          range: {},
          quality: 0.95,
          qualityFloor: 0.95,
          subject: 'image',
          signal: context.signal,
        });
        const label =
          options.mode === 'instagram'
            ? `post-${String(tile.order).padStart(2, '0')}`
            : poster
              ? `page-${tile.order}`
              : `row-${tile.row + 1}-col-${tile.col + 1}`;
        files.push({
          name: `${stem}-${label}.${FILE_FORMATS[tileFormat].extensions[0]}`,
          bytes: exported.bytes,
          tile,
        });
      }
      // Each piece must be exactly the size planned for it.
      const wrong = files.filter(({ bytes, tile }) => {
        const header = readImageHeader(bytes.subarray(0, 256 * 1024));
        return header?.width !== tile.outWidth || header.height !== tile.outHeight;
      }).length;
      const sizeCheck = {
        id: 'pieces',
        label: 'Every piece has its planned size',
        required: `${files.length} pieces`,
        actual: wrong === 0 ? `${files.length} pieces` : `${wrong} wrong`,
        status: wrong === 0 ? ('pass' as const) : ('fail' as const),
      };
      const { rows, cols } = gridOf(options);
      const grid = `${rows} × ${cols}`;

      if (poster) {
        context.progress(0.9, 'Making the poster PDF');
        // The PDF engine loads only for posters; grids never need it.
        const { addImagePages, createPdf, finishPdf } = await import('@niftyfix/engine-pdf');
        const doc = await createPdf();
        await addImagePages(
          doc,
          files.map(({ bytes }) => ({ bytes, format: format === 'jpeg' ? 'jpeg' : 'png' })),
          { pageSize: options.paper, orientation: 'auto', margin: POSTER_MARGIN },
          context.signal,
        );
        const result = await finishPdf(doc, {
          fileName: `${stem}-poster.pdf`,
          pages: files.length,
          inputBytes: input.bytes,
          facts: [
            { label: 'Pages', value: `${grid} on ${options.paper === 'a4' ? 'A4' : 'Letter'}` },
            { label: 'Overlap', value: `${options.overlap}%` },
          ],
        });
        return { ...result, verification: [...result.verification, sizeCheck] };
      }

      context.progress(0.92, 'Packaging the ZIP');
      const zip = await zipFiles(
        files.map(({ name, bytes }) => ({ name, blob: new Blob([bytes as BlobPart]) })),
      );
      const entries = await readZip(zip);
      return {
        blob: zip,
        fileName: `${stem}-${options.mode === 'instagram' ? 'instagram-grid' : options.mode === 'carousel' ? 'carousel' : 'grid'}.zip`,
        format: 'zip',
        bytes: zip.size,
        facts: [
          { label: 'Pieces', value: `${files.length} (${grid})` },
          {
            label: 'Each piece',
            value:
              options.mode === 'grid'
                ? 'Original pixels, uncropped'
                : `${tiles[0]?.outWidth} × ${tiles[0]?.outHeight} px`,
          },
          ...(options.mode === 'instagram'
            ? [{ label: 'Posting order', value: 'post-01 first, top-left last' }]
            : []),
          { label: 'ZIP size', value: formatBytes(zip.size) },
        ],
        verification: [
          sizeCheck,
          {
            id: 'zip',
            label: 'Pieces in ZIP',
            required: String(files.length),
            actual: String(entries.length),
            status: entries.length === files.length ? 'pass' : 'fail',
          },
        ],
        warnings: [],
      };
    } finally {
      bitmap.close();
    }
  },
});
