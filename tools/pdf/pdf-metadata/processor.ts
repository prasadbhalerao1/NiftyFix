import {
  finishPdf,
  hasXmpMetadata,
  loadPdf,
  readMetadata,
  readPdf,
  removeAllMetadata,
  writeMetadata,
} from '@niftyfix/engine-pdf';
import { resolveOutputName } from '@niftyfix/runtime';
import { defineProcessor, type VerificationCheck } from '@niftyfix/tool-sdk';
import { FIELDS, MetadataOptions } from './options';

const LABELS = {
  title: 'Title',
  author: 'Author',
  subject: 'Subject',
  keywords: 'Keywords',
  creator: 'Application',
} as const;

export default defineProcessor({
  options: MetadataOptions,
  async run(input, options, { progress }) {
    progress(0.1, 'Reading the PDF');
    const doc = await readPdf(input);
    const wanted =
      options.mode === 'edit'
        ? {
            ...options.fields,
            // pdf-lib stores keywords as a list; compare the way they read back.
            keywords: options.fields.keywords
              .split(',')
              .map((word) => word.trim())
              .filter(Boolean)
              .join(' '),
          }
        : { title: '', author: '', subject: '', keywords: '', creator: '' };
    if (options.mode === 'edit') writeMetadata(doc, options.fields);
    else removeAllMetadata(doc);
    progress(0.6, 'Saving and checking');
    const result = await finishPdf(doc, {
      fileName: resolveOutputName(input.name, options.fileName, 'metadata', 'pdf'),
      pages: doc.getPageCount(),
      inputBytes: input.bytes,
      stampProducer: options.mode === 'edit',
      facts: [
        {
          label: 'Change',
          value: options.mode === 'edit' ? 'Details edited' : 'All metadata removed',
        },
      ],
    });

    // Read the saved file back and compare every field with what was asked for.
    const reopened = await loadPdf(new Uint8Array(await result.blob.arrayBuffer()), {
      maxPages: 2000,
    });
    const actual = readMetadata(reopened);
    const checks: VerificationCheck[] = FIELDS.map((field) => {
      const got =
        field === 'keywords'
          ? actual.keywords
              .split(/[\s,]+/)
              .filter(Boolean)
              .join(' ')
          : actual[field];
      return {
        id: `meta-${field}`,
        label: LABELS[field],
        required: wanted[field] === '' ? '(empty)' : wanted[field],
        actual: got === '' ? '(empty)' : got,
        status: got === wanted[field] ? 'pass' : 'fail',
      };
    });
    if (options.mode === 'remove') {
      const xmp = hasXmpMetadata(reopened);
      checks.push({
        id: 'meta-xmp',
        label: 'Hidden XMP metadata',
        required: 'Removed',
        actual: xmp ? 'Still present' : 'Removed',
        status: xmp ? 'fail' : 'pass',
      });
    }
    return { ...result, verification: [...result.verification, ...checks] };
  },
});
