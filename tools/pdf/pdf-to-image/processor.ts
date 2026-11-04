import { readImageHeader } from '@niftyfix/engine-image';
import { encodeCanvas } from '@niftyfix/engine-image/browser';
import { selectPages } from '@niftyfix/engine-pdf/pages';
import { openForRendering, renderPage } from '@niftyfix/engine-pdf/render';
import { readZip, sanitizeBaseName, zipFiles } from '@niftyfix/runtime';
import {
  defineProcessor,
  formatBytes,
  ToolError,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import { MAX_IMAGES, PdfToImageOptions } from './options';

export default defineProcessor({
  options: PdfToImageOptions,
  async run(input, options, { progress, signal }) {
    progress(0.02, 'Reading the PDF');
    const { doc, close } = await openForRendering(new Uint8Array(await input.blob.arrayBuffer()), {
      assetOrigin: globalThis.location.origin,
    });
    try {
      const pages = selectPages(options.pages, doc.numPages);
      if (pages.length > MAX_IMAGES) {
        throw new ToolError(
          'INVALID_OPTIONS',
          `That is ${pages.length} pages; up to ${MAX_IMAGES} can be converted at once.`,
          { hint: 'Choose fewer pages, for example 1-150.' },
        );
      }
      const stem = options.fileName.trim() || sanitizeBaseName(input.name);
      const extension = options.format === 'jpeg' ? 'jpg' : 'png';
      const files: { name: string; blob: Blob }[] = [];
      let wrongSize = 0;
      let reduced = 0;
      for (const [order, index] of pages.entries()) {
        signal.throwIfAborted();
        progress(
          0.05 + (0.85 * order) / pages.length,
          `Page ${index + 1} (${order + 1} of ${pages.length})`,
        );
        const page = await renderPage(doc, index, options.dpi / 72);
        if (page.scaledDown) reduced += 1;
        const blob = await encodeCanvas(page.canvas, options.format, 0.9);
        // Measure the encoded file itself, not the canvas we asked for.
        const header = readImageHeader(
          new Uint8Array(await blob.slice(0, 256 * 1024).arrayBuffer()),
        );
        if (header?.width !== page.width || header.height !== page.height) wrongSize += 1;
        files.push({ name: `${stem}-page-${index + 1}.${extension}`, blob });
      }

      const warnings =
        reduced > 0
          ? [
              `${reduced} very large page${reduced === 1 ? ' was' : 's were'} drawn at a lower resolution to fit in memory.`,
            ]
          : [];
      const sizeCheck: VerificationCheck = {
        id: 'dimensions',
        label: 'Image size matches the page',
        required: `${options.dpi} DPI`,
        actual: wrongSize === 0 ? `${options.dpi} DPI` : `${wrongSize} image(s) differ`,
        status: wrongSize === 0 ? 'pass' : 'fail',
      };

      if (files.length === 1) {
        const [only] = files;
        if (!only) throw new ToolError('UNKNOWN', 'No page was converted.');
        return {
          blob: only.blob,
          fileName: only.name,
          format: options.format,
          bytes: only.blob.size,
          facts: [{ label: 'Page', value: String((pages[0] ?? 0) + 1) }],
          verification: [
            sizeCheck,
            {
              id: 'format',
              label: 'Format',
              required: options.format.toUpperCase(),
              actual: options.format.toUpperCase(),
              status: 'pass',
            },
          ],
          warnings,
        };
      }

      progress(0.93, 'Packaging the ZIP');
      const zip = await zipFiles(files);
      const entries = await readZip(zip);
      return {
        blob: zip,
        fileName: `${stem}-images.zip`,
        format: 'zip',
        bytes: zip.size,
        facts: [
          { label: 'Images', value: String(files.length) },
          { label: 'Resolution', value: `${options.dpi} DPI` },
          { label: 'ZIP size', value: formatBytes(zip.size) },
        ],
        verification: [
          sizeCheck,
          {
            id: 'parts',
            label: 'Images in ZIP',
            required: String(files.length),
            actual: String(entries.length),
            status: entries.length === files.length ? 'pass' : 'fail',
          },
        ],
        warnings,
      };
    } finally {
      await close();
    }
  },
});
