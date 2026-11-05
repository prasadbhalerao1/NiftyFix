import { combinePages, finishPdf, readPdf, rotatePages } from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, ToolError } from '@niftyfix/tool-sdk';
import { OrganizePdfOptions } from './options';

export default defineProcessor({
  options: OrganizePdfOptions,
  async run(input, options, { progress, signal }) {
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    const count = doc.getPageCount();
    if (options.pages.some((page) => page.index >= count)) {
      throw new ToolError(
        'INVALID_OPTIONS',
        'The page list does not match this PDF. Choose the file again.',
      );
    }
    progress(0.4, 'Arranging pages');
    const out = await combinePages(
      [{ doc, pages: options.pages.map((page) => page.index) }],
      signal,
    );
    // Expected rotation from the source page plus the user's change, independent of
    // the document being written, so the check on the saved file can actually fail.
    const rotations = new Map<number, number>();
    options.pages.forEach((page, position) => {
      if (page.rotation !== 0) rotatePages(out, [position], page.rotation);
      rotations.set(position, (doc.getPage(page.index).getRotation().angle + page.rotation) % 360);
    });
    const removed = count - new Set(options.pages.map((page) => page.index)).size;
    const moved = options.pages.some((page, position) => page.index !== position);
    const rotated = options.pages.filter((page) => page.rotation !== 0).length;
    progress(0.7, 'Saving and checking');
    return finishPdf(out, {
      fileName: resolveOutputName(input.name, options.fileName, 'organized', 'pdf'),
      pages: options.pages.length,
      rotations,
      inputBytes: input.bytes,
      facts: [
        { label: 'Removed pages', value: String(removed) },
        { label: 'Rotated pages', value: String(rotated) },
        { label: 'Order changed', value: moved ? 'Yes' : 'No' },
      ],
    });
  },
});
