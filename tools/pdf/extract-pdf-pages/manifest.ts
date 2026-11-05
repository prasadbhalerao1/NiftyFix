import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.extract-pdf-pages',
  version: 1,
  slug: 'extract-pdf-pages',
  category: 'pdf',
  status: 'live',
  name: 'Extract PDF Pages',
  h1: 'Extract pages from a PDF',
  tagline:
    'Save only the pages you need as a new PDF, in the order you type them. The original file is not changed.',
  seoTitle: 'Extract PDF Pages: save selected pages, free | NiftyFix',
  seoDescription:
    'Pull selected pages out of a PDF into a new file, in any order. Type pages like 1-3, 5. Free, private, nothing is uploaded.',
  searchAliases: [
    'extract pages from pdf',
    'save one page of pdf',
    'select pages from pdf',
    'remove pages from pdf keep some',
    'pdf page extractor',
    'take pages out of pdf',
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
  related: ['pdf.split-pdf', 'pdf.merge-pdf', 'pdf.rotate-pdf'],
});
