import { allPages, combinePages, finishPdf, readPdf } from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineMultiFileProcessor } from '@niftyfix/tool-sdk';
import { MAX_FILES, MergePdfOptions, MIN_FILES } from './options';

export default defineMultiFileProcessor({
  options: MergePdfOptions,
  inputs: { min: MIN_FILES, max: MAX_FILES },
  async run(inputs, options, { signal, progress }) {
    const sources = [];
    for (const [index, input] of inputs.entries()) {
      signal.throwIfAborted();
      progress((index / inputs.length) * 0.6, `Reading ${index + 1} of ${inputs.length}`);
      const doc = await readPdf(input, input.name);
      sources.push({ doc, pages: allPages(doc.getPageCount()) });
    }
    progress(0.65, 'Merging pages');
    const merged = await combinePages(sources, signal);
    progress(0.85, 'Checking the merged file');
    const pages = sources.reduce((sum, source) => sum + source.pages.length, 0);
    const first = inputs[0]?.name ?? 'merged.pdf';
    return finishPdf(merged, {
      fileName: resolveOutputName(first, options.fileName, 'merged', 'pdf'),
      pages,
      inputBytes: inputs.reduce((sum, input) => sum + input.bytes, 0),
      facts: [{ label: 'Files merged', value: String(inputs.length) }],
    });
  },
});
