import {
  chunkPages,
  combinePages,
  describePages,
  finishPdf,
  readPdf,
  savePdf,
  selectPages,
  verifyPdfOutput,
} from '@niftyfix/engine-pdf';
import { readZip, resolveOutputName, sanitizeBaseName, zipFiles } from '@niftyfix/runtime';
import {
  defineProcessor,
  formatBytes,
  ToolError,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import { MAX_PARTS, SplitPdfOptions } from './options';

export default defineProcessor({
  options: SplitPdfOptions,
  async run(input, options, { progress, signal }) {
    progress(0.05, 'Reading the PDF');
    const doc = await readPdf(input);
    const count = doc.getPageCount();
    const parts =
      options.mode === 'every'
        ? chunkPages(count, options.size)
        : options.ranges
            .split(',')
            .filter((range) => range.trim() !== '')
            .map((range) => selectPages({ mode: 'custom', ranges: range }, count));
    if (parts.length === 0) throw new ToolError('INVALID_OPTIONS', 'Enter at least one range.');
    if (parts.length > MAX_PARTS) {
      throw new ToolError(
        'INVALID_OPTIONS',
        `That makes ${parts.length} files; the limit is ${MAX_PARTS}. Use bigger parts.`,
      );
    }

    const stem = options.fileName.trim() || sanitizeBaseName(input.name);
    if (parts.length === 1) {
      const [only = []] = parts;
      const out = await combinePages([{ doc, pages: only }], signal);
      return finishPdf(out, {
        fileName: resolveOutputName(
          input.name,
          options.fileName,
          `pages-${describePages(only).replaceAll(', ', '_')}`,
          'pdf',
        ),
        pages: only.length,
        inputBytes: input.bytes,
        facts: [{ label: 'Parts', value: '1' }],
      });
    }

    // Build and verify every part before packaging; a single bad part fails the whole job.
    const files: { name: string; blob: Blob }[] = [];
    const failures: string[] = [];
    for (const [index, pages] of parts.entries()) {
      signal.throwIfAborted();
      progress(0.1 + (0.75 * index) / parts.length, `Part ${index + 1} of ${parts.length}`);
      const part = await combinePages([{ doc, pages }], signal);
      const bytes = await savePdf(part);
      const name = `${stem}-pages-${describePages(pages).replaceAll(', ', '_')}.pdf`;
      const { checks } = await verifyPdfOutput(bytes, { pages: pages.length, fileName: name });
      if (checks.some((check) => check.status === 'fail')) failures.push(name);
      files.push({ name, blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }) });
    }

    progress(0.9, 'Packaging the ZIP');
    const zip = await zipFiles(files);
    const reread = await readZip(zip);
    const fileName = `${stem}-split.zip`;
    const verification: VerificationCheck[] = [
      {
        id: 'parts',
        label: 'Files in ZIP',
        required: String(parts.length),
        actual: String(reread.length),
        status: reread.length === parts.length ? 'pass' : 'fail',
      },
      {
        id: 'parts-valid',
        label: 'Every part opens with the right pages',
        required: 'All parts',
        actual: failures.length === 0 ? 'All parts' : `${failures.length} failed`,
        status: failures.length === 0 ? 'pass' : 'fail',
      },
      {
        id: 'format',
        label: 'Format',
        required: 'ZIP',
        actual: 'ZIP',
        status: 'pass',
      },
    ];
    return {
      blob: zip,
      fileName,
      format: 'zip',
      bytes: zip.size,
      facts: [
        { label: 'Parts', value: String(parts.length) },
        { label: 'Pages in the original', value: String(count) },
        { label: 'ZIP size', value: formatBytes(zip.size) },
      ],
      verification,
      warnings: [],
    };
  },
});
