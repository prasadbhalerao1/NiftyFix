import {
  addTextWatermark,
  describePages,
  finishPdf,
  readPdf,
  selectPages,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor } from '@niftyfix/tool-sdk';
import { COLOURS, WatermarkOptions } from './options';

export default defineProcessor({
  options: WatermarkOptions,
  async run(input, options, { progress }) {
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    const count = doc.getPageCount();
    const pages = selectPages(options.pages, count);
    progress(0.4, 'Adding the watermark');
    await addTextWatermark(doc, {
      text: options.text,
      opacity: options.opacity,
      fontSize: 72,
      layout: options.layout,
      color: COLOURS[options.colour],
      pages,
    });
    progress(0.7, 'Saving and checking');
    return finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, 'watermarked', 'pdf'),
      pages: count,
      inputBytes: input.bytes,
      facts: [
        { label: 'Watermark', value: `"${options.text}"` },
        {
          label: 'On',
          value: pages.length === count ? 'All pages' : `Pages ${describePages(pages)}`,
        },
      ],
    });
  },
});
