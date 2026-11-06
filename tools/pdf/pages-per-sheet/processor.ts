import {
  finishPdf,
  PAPER_SIZES,
  placePagesOnSheets,
  readPdf,
  type SheetSlot,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor } from '@niftyfix/tool-sdk';
import { bookletOrder, cellOrigin, chooseGrid, type Size } from './layout';
import { PagesPerSheetOptions } from './options';

/** The first page's shape as the reader sees it, which decides the sheet orientation. */
function shownSize(page: { getCropBox(): Size; getRotation(): { angle: number } }): Size {
  const box = page.getCropBox();
  return page.getRotation().angle % 180 === 0
    ? { width: box.width, height: box.height }
    : { width: box.height, height: box.width };
}

export default defineProcessor({
  options: PagesPerSheetOptions,
  async run(input, options, { progress, signal }) {
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    const count = doc.getPageCount();
    const paper = PAPER_SIZES[options.paper];
    const perSheet = options.mode === 'booklet' ? 2 : options.perSheet;
    const grid = chooseGrid(perSheet, shownSize(doc.getPage(0)), paper);
    const order: (number | null)[] =
      options.mode === 'booklet' ? bookletOrder(count) : Array.from({ length: count }, (_, i) => i);

    const sheets: { width: number; height: number; slots: SheetSlot[] }[] = [];
    for (let start = 0; start < order.length; start += perSheet) {
      sheets.push({
        ...grid.sheet,
        slots: order.slice(start, start + perSheet).map((page, index) => ({
          page,
          ...cellOrigin(grid, index),
          ...grid.cell,
        })),
      });
    }

    progress(0.4, options.mode === 'booklet' ? 'Arranging the booklet' : 'Placing pages');
    const out = await placePagesOnSheets(doc, sheets, { frame: options.frame }, signal);
    progress(0.8, 'Saving and checking');
    const blanks = order.filter((page) => page === null).length;
    return finishPdf(out, {
      fileName: resolveOutputName(
        input.name,
        options.fileName,
        options.mode === 'booklet' ? 'booklet' : `${perSheet}-per-sheet`,
        'pdf',
      ),
      pages: sheets.length,
      inputBytes: input.bytes,
      facts: [
        { label: 'Original pages', value: String(count) },
        {
          label: 'Layout',
          value:
            options.mode === 'booklet'
              ? `Booklet, 2 pages per side on ${paper.label}`
              : `${perSheet} per sheet (${grid.columns} x ${grid.rows}) on ${paper.label}`,
        },
      ],
      warnings: [
        ...(options.mode === 'booklet'
          ? [
              `Print double-sided and choose "flip on short edge", then fold the stack in half.${blanks > 0 ? ` ${blanks} blank page${blanks === 1 ? ' was' : 's were'} added so the booklet folds evenly.` : ''}`,
            ]
          : []),
        'Links and fillable form fields do not carry over to the new sheets.',
      ],
    });
  },
});
