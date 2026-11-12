import { readImageHeader } from '@niftyfix/engine-image';
import { encodeCanvas, writePixels } from '@niftyfix/engine-image/browser';
import { extractImages, readPdf, selectPages } from '@niftyfix/engine-pdf';
import { readZip, sanitizeBaseName, zipFiles } from '@niftyfix/runtime';
import {
  defineProcessor,
  formatBytes,
  ToolError,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import { ExtractImagesOptions, MAX_CANVAS_PIXELS, MAX_IMAGES } from './options';

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

async function digest(data: Uint8Array | Uint8ClampedArray): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data as BufferSource));
  return Array.from(hash, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default defineProcessor({
  options: ExtractImagesOptions,
  async run(input, options, { progress, signal }) {
    progress(0.02, 'Reading the PDF');
    const doc = await readPdf(input);
    const pages = selectPages(options.pages, doc.getPageCount());
    progress(0.1, 'Finding images');
    const report = extractImages(doc, { minSide: options.minSide, pages }, signal);

    if (report.images.length === 0) {
      const reasons = [
        report.tiny > 0
          ? plural(report.tiny, 'small image was', 'small images were') + ' skipped'
          : '',
        report.unsupported > 0
          ? plural(report.unsupported, 'image is', 'images are') +
            ' in a format this tool cannot convert'
          : '',
      ].filter(Boolean);
      throw new ToolError(
        'INVALID_OPTIONS',
        reasons.length > 0
          ? `No images to save: ${reasons.join(', and ')}.`
          : 'No images were found on the chosen pages.',
        {
          hint:
            report.tiny > 0
              ? 'Set "Skip small images" to "Keep all" and try again.'
              : 'Scanned or drawn pages may not store separate pictures. Use PDF to JPG to save whole pages as images.',
        },
      );
    }
    if (report.images.length > MAX_IMAGES) {
      throw new ToolError(
        'INVALID_OPTIONS',
        `This PDF has ${report.images.length} images; up to ${MAX_IMAGES} can be saved at once.`,
        { hint: 'Choose fewer pages, for example 1-50.' },
      );
    }

    const stem = options.fileName.trim() || sanitizeBaseName(input.name);
    const files: { name: string; blob: Blob }[] = [];
    const seen = new Set<string>();
    const perPage = new Map<number, number>();
    let duplicates = 0;
    let tooLarge = 0;
    let wrongSize = 0;
    for (const [order, image] of report.images.entries()) {
      signal.throwIfAborted();
      progress(
        0.15 + (0.75 * order) / report.images.length,
        `Image ${order + 1} of ${report.images.length}`,
      );
      // The same picture stored twice (a logo on every page) is saved once.
      const hash = await digest(image.kind === 'jpeg' ? image.bytes : image.rgba);
      if (seen.has(hash)) {
        duplicates += 1;
        continue;
      }
      seen.add(hash);
      let blob: Blob;
      if (image.kind === 'jpeg') {
        // Original bytes: no re-encoding, no quality loss.
        blob = new Blob([image.bytes as BlobPart], { type: 'image/jpeg' });
      } else if (image.width * image.height > MAX_CANVAS_PIXELS) {
        tooLarge += 1;
        continue;
      } else {
        const { rgba: data, width, height } = image;
        blob = await encodeCanvas(writePixels({ data, width, height }), 'png', 1);
      }
      // Measure the saved file itself, not the size the PDF claims.
      const header = readImageHeader(new Uint8Array(await blob.slice(0, 256 * 1024).arrayBuffer()));
      if (header?.width !== image.width || header.height !== image.height) wrongSize += 1;
      const number = (perPage.get(image.page) ?? 0) + 1;
      perPage.set(image.page, number);
      const extension = image.kind === 'jpeg' ? 'jpg' : 'png';
      files.push({ name: `${stem}-page-${image.page + 1}-image-${number}.${extension}`, blob });
    }

    const warnings = [
      report.unsupported > 0
        ? `${plural(report.unsupported, 'image was', 'images were')} not saved: stored in a format this tool cannot convert faithfully (such as CMYK or JPEG 2000). PDF to JPG can save those pages as pictures.`
        : '',
      tooLarge > 0
        ? `${plural(tooLarge, 'very large image was', 'very large images were')} not saved: too big to convert safely in a browser.`
        : '',
    ].filter(Boolean);
    const facts = [
      { label: 'Images', value: String(files.length) },
      ...(duplicates > 0 ? [{ label: 'Repeats skipped', value: String(duplicates) }] : []),
      ...(report.tiny > 0 ? [{ label: 'Small images skipped', value: String(report.tiny) }] : []),
    ];
    const sizeCheck: VerificationCheck = {
      id: 'dimensions',
      label: 'Each image keeps its original pixel size',
      required: 'As stored in the PDF',
      actual: wrongSize === 0 ? 'As stored in the PDF' : `${wrongSize} image(s) differ`,
      status: wrongSize === 0 ? 'pass' : 'fail',
    };

    if (files.length === 0) {
      throw new ToolError('UNSUPPORTED_FORMAT', warnings.join(' ') || 'No image could be saved.');
    }
    if (files.length === 1) {
      const [only] = files;
      if (!only) throw new ToolError('UNKNOWN', 'No image was saved.');
      const format = only.name.endsWith('.jpg') ? 'jpeg' : 'png';
      return {
        blob: only.blob,
        fileName: only.name,
        format,
        bytes: only.blob.size,
        facts: [...facts, { label: 'Size', value: formatBytes(only.blob.size) }],
        verification: [sizeCheck],
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
      facts: [...facts, { label: 'ZIP size', value: formatBytes(zip.size) }],
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
  },
});
