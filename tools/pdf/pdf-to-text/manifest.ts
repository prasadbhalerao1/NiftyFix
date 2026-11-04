import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.pdf-to-text',
  version: 1,
  slug: 'pdf-to-text',
  category: 'pdf',
  status: 'live',
  name: 'Extract Text from PDF',
  h1: 'Extract text from a PDF',
  tagline:
    'Copy all the text out of a PDF into a plain .txt file, page by page — and find out which pages are scans that need OCR.',
  seoTitle: 'PDF to Text — extract text from PDF, free | NiftyFix',
  seoDescription:
    'Extract the text of a PDF into a plain TXT file, page by page, in reading order. Detects scanned pages. Free, private, nothing uploaded.',
  searchAliases: [
    'pdf to text',
    'extract text from pdf',
    'copy text from pdf',
    'pdf to txt',
    'get text out of pdf',
    'convert pdf to plain text',
  ],
  input: {
    kind: 'files',
    formats: ['pdf'],
    maxBytes: { mobile: 100 * MB, desktop: 250 * MB },
    maxFiles: 1,
  },
  output: { formats: ['txt'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'pdf',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: ['pdf.pdf-to-image', 'pdf.extract-pdf-pages', 'pdf.split-pdf'],
});
