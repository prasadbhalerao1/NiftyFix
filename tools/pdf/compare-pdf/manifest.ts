import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'pdf.compare-pdf',
  version: 1,
  slug: 'compare-pdf',
  category: 'pdf',
  status: 'live',
  name: 'Compare PDFs',
  h1: 'Compare two PDFs and see every difference',
  tagline:
    'See exactly what changed between two versions of a PDF: every added and removed word highlighted, and a page-by-page visual overlay.',
  seoTitle: 'Compare PDF Online: find differences in two PDFs, free | NiftyFix',
  seoDescription:
    'Compare two PDF files: every added and removed word highlighted, plus a visual overlay of each page to catch layout and image changes. Free, no upload.',
  searchAliases: [
    'compare pdf',
    'compare two pdf files',
    'pdf diff',
    'find differences between two pdfs',
    'compare pdf documents',
    'pdf compare online',
  ],
  input: { kind: 'interactive' },
  output: { formats: [] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'pdf',
  capabilities: {
    batch: false,
    cancellable: false,
    progress: 'determinate',
    verifiesOutput: false,
  },
  related: ['pdf.pdf-to-text', 'pdf.merge-pdf', 'pdf.organize-pdf'],
});
