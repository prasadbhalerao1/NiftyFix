import * as v from 'valibot';
import { finishPdf, flattenForm, readPdf } from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, FileNameSchema, ToolError } from '@niftyfix/tool-sdk';

export default defineProcessor({
  options: v.object({ fileName: FileNameSchema }),
  async run(input, options, { progress }) {
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    progress(0.4, 'Flattening form fields');
    let fields: number;
    try {
      fields = flattenForm(doc);
    } catch {
      throw new ToolError(
        'CORRUPT_INPUT',
        'Some form fields in this PDF are damaged and could not be flattened.',
        { hint: 'Open the form, re-save it from the app you filled it in with, and try again.' },
      );
    }
    progress(0.7, 'Saving and checking');
    return finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, 'flattened', 'pdf'),
      pages: doc.getPageCount(),
      inputBytes: input.bytes,
      facts: [{ label: 'Form fields flattened', value: String(fields) }],
      warnings:
        fields === 0
          ? ['This PDF has no form fields, so nothing needed flattening. The pages are unchanged.']
          : [],
    });
  },
});
