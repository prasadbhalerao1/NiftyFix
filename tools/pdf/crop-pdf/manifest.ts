import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.crop-pdf',
  version: 1,
  slug: 'crop-pdf',
  category: 'pdf',
  status: 'live',
  name: 'Crop and Resize PDF Pages',
  h1: 'Crop PDF margins or resize pages to A4',
  tagline:
    'Trim white margins off PDF pages with a live preview, or put every page on A4, Letter, A3 or A5 without distorting it.',
  seoTitle: 'Crop PDF and Resize PDF to A4 — free, private | NiftyFix',
  seoDescription:
    'Crop margins from PDF pages with a live preview, or resize every page to A4, Letter, A3 or A5 without distortion. Free, nothing uploaded.',
  searchAliases: [
    'crop pdf',
    'resize pdf to a4',
    'trim pdf margins',
    'change pdf page size',
    'pdf letter to a4',
    'remove white border from pdf',
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
  related: ['pdf.organize-pdf', 'pdf.rotate-pdf', 'pdf.merge-pdf'],
});
