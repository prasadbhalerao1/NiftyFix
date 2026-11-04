import { combinePages, describePages, finishPdf, readPdf, selectPages } from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor } from '@niftyfix/tool-sdk';
import { ExtractPagesOptions } from './options';

export default defineProcessor({
  options: ExtractPagesOptions,
  async run(input, options, { progress, signal }) {
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    const pages = selectPages({ mode: 'custom', ranges: options.ranges }, doc.getPageCount());
    progress(0.4, 'Copying pages');
    const out = await combinePages([{ doc, pages }], signal);
    progress(0.7, 'Saving and checking');
    return finishPdf(out, {
      fileName: resolveOutputName(input.name, options.fileName, 'pages', 'pdf'),
      pages: pages.length,
      inputBytes: input.bytes,
      facts: [
        { label: 'Extracted', value: `Pages ${describePages(pages)} of ${doc.getPageCount()}` },
      ],
    });
  },
});
