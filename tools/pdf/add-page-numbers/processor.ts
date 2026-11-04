import {
  addPageNumbers,
  describePages,
  finishPdf,
  readPdf,
  selectPages,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor } from '@niftyfix/tool-sdk';
import { PageNumberOptions, STYLES } from './options';

export default defineProcessor({
  options: PageNumberOptions,
  async run(input, options, { progress }) {
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    const count = doc.getPageCount();
    const pages = selectPages(options.pages, count);
    progress(0.4, 'Numbering pages');
    await addPageNumbers(doc, {
      position: options.position,
      template: STYLES[options.style],
      start: options.start,
      pages,
      fontSize: options.fontSize,
      margin: 28,
    });
    progress(0.7, 'Saving and checking');
    const last = options.start + pages.length - 1;
    return finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, 'numbered', 'pdf'),
      pages: count,
      inputBytes: input.bytes,
      facts: [
        {
          label: 'Numbered',
          value: `${pages.length === count ? 'All pages' : `Pages ${describePages(pages)}`} as ${options.start}–${last}`,
        },
      ],
    });
  },
});
