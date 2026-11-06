import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.pages-per-sheet',
  version: 1,
  slug: 'pages-per-sheet',
  category: 'pdf',
  status: 'live',
  name: 'Pages per Sheet and Booklet',
  h1: 'Print multiple PDF pages on one sheet',
  tagline:
    'Put 2, 4, 6 or 9 PDF pages on each sheet to save paper when printing notes, or turn a PDF into a booklet that folds in order.',
  seoTitle: 'Multiple PDF Pages per Sheet (2, 4, 6) and Booklet | NiftyFix',
  seoDescription:
    'Put 2, 4, 6 or 9 PDF pages on one A4 sheet, or make a fold-in-half booklet. Text stays sharp. Free, in your browser, nothing uploaded.',
  searchAliases: [
    'multiple pages per sheet pdf',
    '2 pages per sheet pdf',
    '4 pages per sheet pdf',
    'n-up pdf',
    'pdf booklet',
    'booklet maker',
    'print notes to save paper',
    'combine pdf pages on one page',
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
  related: ['pdf.organize-pdf', 'pdf.crop-pdf', 'pdf.merge-pdf', 'pdf.compress-pdf'],
});
