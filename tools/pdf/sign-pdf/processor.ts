import {
  allPages,
  countPageXObjects,
  describePages,
  finishPdf,
  loadPdf,
  placeImage,
  readPdf,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import {
  defineProcessor,
  sniffFormat,
  ToolError,
  type VerificationCheck,
} from '@niftyfix/tool-sdk';
import { SignPdfOptions } from './options';

export default defineProcessor({
  options: SignPdfOptions,
  async run(input, options, { progress }) {
    if (sniffFormat(options.signature.subarray(0, 64)) !== 'png') {
      throw new ToolError(
        'INVALID_OPTIONS',
        'The signature image is not a PNG. Draw or upload it again.',
      );
    }
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    const count = doc.getPageCount();
    const pages = options.placeOn.mode === 'all' ? allPages(count) : [options.placeOn.page];
    if (pages.some((index) => index >= count)) {
      throw new ToolError('INVALID_OPTIONS', `This PDF has ${count} pages. Choose the page again.`);
    }
    const before = pages.map((index) => countPageXObjects(doc.getPage(index)));
    progress(0.4, 'Placing the signature');
    const image = await doc.embedPng(options.signature);
    for (const index of pages) placeImage(doc.getPage(index), image, options.rect);
    progress(0.7, 'Saving and checking');
    const result = await finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, 'signed', 'pdf'),
      pages: count,
      inputBytes: input.bytes,
      facts: [
        {
          label: 'Signed',
          value: pages.length === count ? 'Every page' : `Page ${describePages(pages)}`,
        },
      ],
    });

    // Read the saved file back: every target page must now carry the signature image.
    const reopened = await loadPdf(new Uint8Array(await result.blob.arrayBuffer()), {
      maxPages: 2000,
    });
    const missing = pages.filter(
      (index, i) => countPageXObjects(reopened.getPage(index)) <= (before[i] ?? 0),
    );
    const check: VerificationCheck = {
      id: 'signature',
      label: 'Signature on the chosen pages',
      required: `${pages.length} page${pages.length === 1 ? '' : 's'}`,
      actual:
        missing.length === 0
          ? `${pages.length} page${pages.length === 1 ? '' : 's'}`
          : `Missing on ${describePages(missing)}`,
      status: missing.length === 0 ? 'pass' : 'fail',
    };
    return { ...result, verification: [...result.verification, check] };
  },
});
