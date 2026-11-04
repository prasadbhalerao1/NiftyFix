import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.merge-pdf',
  version: 1,
  slug: 'merge-pdf',
  category: 'pdf',
  status: 'beta',
  name: 'Merge PDF',
  h1: 'Merge PDF files into one',
  tagline:
    'Combine several PDFs into a single file in the order you choose. Files are merged on your device and never uploaded.',
  seoTitle: 'Merge PDF — combine PDF files online, free | NiftyFix',
  seoDescription:
    'Combine multiple PDF files into one PDF in any order. Free, no sign-up, no watermark, and your files never leave your device.',
  searchAliases: [
    'combine pdf',
    'join pdf files',
    'merge pdf files into one',
    'pdf merger',
    'add pdf to pdf',
    'combine pdfs offline',
  ],
  input: {
    kind: 'files',
    formats: ['pdf'],
    maxBytes: { mobile: 100 * MB, desktop: 250 * MB },
    maxFiles: 50,
  },
  output: { formats: ['pdf'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'pdf',
  capabilities: { batch: true, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: [],
});
