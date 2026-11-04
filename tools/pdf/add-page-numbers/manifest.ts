import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.add-page-numbers',
  version: 1,
  slug: 'add-page-numbers',
  category: 'pdf',
  status: 'live',
  name: 'Add Page Numbers',
  h1: 'Add page numbers to a PDF',
  tagline:
    'Number the pages of a PDF in the position and style you choose — including "Page 3 of 10" — without changing anything else.',
  seoTitle: 'Add Page Numbers to PDF — free, no upload | NiftyFix',
  seoDescription:
    'Add page numbers to a PDF: choose position, style such as "Page 1 of 10", starting number and which pages. Free, private, no watermark.',
  searchAliases: [
    'number pdf pages',
    'insert page numbers in pdf',
    'pdf page numbering',
    'page 1 of n pdf',
    'add page numbers skip first page',
    'paginate pdf',
  ],
  input: {
    kind: 'files',
    formats: ['pdf'],
    maxBytes: { mobile: 100 * MB, desktop: 250 * MB },
    maxFiles: 1,
  },
  output: { formats: ['pdf'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'pdf',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: ['pdf.merge-pdf', 'pdf.watermark-pdf', 'pdf.rotate-pdf'],
});
