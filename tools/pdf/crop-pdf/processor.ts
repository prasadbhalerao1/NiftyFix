import {
  cropPage,
  describePages,
  finishPdf,
  fitPageToPaper,
  PAPER_SIZES,
  PT_PER_MM,
  readPdf,
  selectPages,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, ToolError } from '@niftyfix/tool-sdk';
import { CropPdfOptions } from './options';

export default defineProcessor({
  options: CropPdfOptions,
  async run(input, options, { progress }) {
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    const count = doc.getPageCount();
    const pages = selectPages(options.pages, count);
    const which = pages.length === count ? 'All pages' : `Pages ${describePages(pages)}`;
    progress(0.4, options.mode === 'crop' ? 'Cropping' : 'Resizing');

    if (options.mode === 'crop') {
      const margins = {
        top: options.margins.top * PT_PER_MM,
        right: options.margins.right * PT_PER_MM,
        bottom: options.margins.bottom * PT_PER_MM,
        left: options.margins.left * PT_PER_MM,
      };
      const tooSmall = pages.filter((index) => !cropPage(doc.getPage(index), margins));
      if (tooSmall.length > 0) {
        throw new ToolError(
          'INVALID_OPTIONS',
          `Those margins leave almost nothing of page${tooSmall.length === 1 ? '' : 's'} ${describePages(tooSmall)}.`,
          { hint: 'Use smaller margins.' },
        );
      }
      progress(0.7, 'Saving and checking');
      return finishPdf(doc, {
        fileName: resolveOutputName(input.name, options.fileName, 'cropped', 'pdf'),
        pages: count,
        inputBytes: input.bytes,
        facts: [
          { label: 'Cropped', value: which },
          {
            label: 'Margins (top, right, bottom, left)',
            value: `${options.margins.top}, ${options.margins.right}, ${options.margins.bottom}, ${options.margins.left} mm`,
          },
        ],
        warnings: [
          'Cropping hides the trimmed area; it is still inside the file. Do not use cropping to remove private information.',
        ],
      });
    }

    const paper = PAPER_SIZES[options.paper];
    for (const index of pages) fitPageToPaper(doc.getPage(index), paper);
    progress(0.7, 'Saving and checking');
    return finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, options.paper, 'pdf'),
      pages: count,
      inputBytes: input.bytes,
      facts: [{ label: 'Resized to', value: `${paper.label}: ${which}` }],
    });
  },
});
