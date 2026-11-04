import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.split-pdf',
  version: 1,
  slug: 'split-pdf',
  category: 'pdf',
  status: 'live',
  name: 'Split PDF',
  h1: 'Split a PDF into separate files',
  tagline:
    'Split a PDF into single pages, into parts of a set length, or by your own page ranges — downloaded together as a ZIP.',
  seoTitle: 'Split PDF — separate pages into files, free | NiftyFix',
  seoDescription:
    'Split a PDF into one file per page, every few pages, or by custom ranges, and download them as a ZIP. Free and private: nothing is uploaded.',
  searchAliases: [
    'split pdf into pages',
    'separate pdf pages',
    'split pdf into multiple files',
    'pdf splitter',
    'break pdf into parts',
    'split pdf by page range',
  ],
  input: {
    kind: 'files',
    formats: ['pdf'],
    maxBytes: { mobile: 100 * MB, desktop: 250 * MB },
    maxFiles: 1,
  },
  output: { formats: ['pdf', 'zip'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'pdf',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: ['pdf.extract-pdf-pages', 'pdf.merge-pdf', 'pdf.rotate-pdf'],
});
