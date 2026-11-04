import { describePages, finishPdf, readPdf, rotatePages, selectPages } from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor } from '@niftyfix/tool-sdk';
import { RotatePdfOptions } from './options';

export default defineProcessor({
  options: RotatePdfOptions,
  async run(input, options, { progress }) {
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    const count = doc.getPageCount();
    const pages = selectPages(options.pages, count);
    const before = doc.getPages().map((page) => page.getRotation().angle);
    rotatePages(doc, pages, options.angle);
    // Every page's expected rotation, so the check also proves untouched pages stayed put.
    const rotations = new Map(
      before.map((angle, index) => [
        index,
        pages.includes(index) ? (angle + options.angle) % 360 : angle,
      ]),
    );
    progress(0.6, 'Saving and checking');
    return finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, 'rotated', 'pdf'),
      pages: count,
      rotations,
      inputBytes: input.bytes,
      facts: [
        {
          label: 'Rotated',
          value: `${pages.length === count ? 'All pages' : `Pages ${describePages(pages)}`} by ${options.angle}°`,
        },
      ],
    });
  },
});
