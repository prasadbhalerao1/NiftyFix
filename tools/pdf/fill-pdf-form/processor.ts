import {
  fillForm,
  finishPdf,
  flattenForm,
  loadPdf,
  readFormValues,
  readPdf,
  refreshAppearances,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, ToolError, type VerificationCheck } from '@niftyfix/tool-sdk';
import { FillFormOptions } from './options';

export default defineProcessor({
  options: FillFormOptions,
  async run(input, options, { progress }) {
    progress(0.1, 'Reading the form');
    const doc = await readPdf(input);
    if (doc.getForm().getFields().length === 0) {
      throw new ToolError('INVALID_OPTIONS', 'This PDF has no fillable fields.', {
        hint: 'It may be a scanned or flat form. Use a PDF editor to place text on it.',
      });
    }
    progress(0.3, 'Filling in');
    const { filled, skipped, applied, shortened } = fillForm(doc, options.values);
    await refreshAppearances(doc);
    if (options.flatten) flattenForm(doc);
    progress(0.6, 'Saving and checking');
    const result = await finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, 'filled', 'pdf'),
      pages: doc.getPageCount(),
      inputBytes: input.bytes,
      facts: [
        { label: 'Fields filled', value: String(filled.length) },
        { label: 'Answers locked', value: options.flatten ? 'Yes (flattened)' : 'No' },
      ],
      warnings: [
        ...(shortened.length > 0 ? [`Shortened to fit the field: ${shortened.join(', ')}.`] : []),
        ...(skipped.length > 0
          ? [`Not changed (read-only or not in this form): ${skipped.join(', ')}.`]
          : []),
      ],
    });

    // Read the saved file back: answers must be there, or the form must be fully flattened.
    const reopened = await loadPdf(new Uint8Array(await result.blob.arrayBuffer()), {
      maxPages: 2000,
    });
    let check: VerificationCheck;
    if (options.flatten) {
      const left = reopened.getForm().getFields().length;
      check = {
        id: 'flattened',
        label: 'Answers locked into the pages',
        required: '0 editable fields',
        actual: `${left} editable field${left === 1 ? '' : 's'}`,
        status: left === 0 ? 'pass' : 'fail',
      };
    } else {
      const saved = readFormValues(reopened, filled);
      const wrong = filled.filter((name) => saved[name] !== applied[name]);
      check = {
        id: 'answers',
        label: 'Answers saved in the file',
        required: `${filled.length}`,
        actual: `${filled.length - wrong.length}`,
        status: wrong.length === 0 ? 'pass' : 'fail',
        ...(wrong.length > 0 ? { note: `Differ: ${wrong.join(', ')}` } : {}),
      };
    }
    return { ...result, verification: [...result.verification, check] };
  },
});
