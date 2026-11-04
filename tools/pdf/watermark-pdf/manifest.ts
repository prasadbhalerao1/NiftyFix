import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.watermark-pdf',
  version: 1,
  slug: 'watermark-pdf',
  category: 'pdf',
  status: 'live',
  name: 'Watermark PDF',
  h1: 'Add a watermark to a PDF',
  tagline:
    'Stamp text such as "CONFIDENTIAL" or "COPY" across your PDF pages, with the opacity, colour and angle you choose.',
  seoTitle: 'Watermark PDF — add text watermark, free | NiftyFix',
  seoDescription:
    'Add a text watermark like CONFIDENTIAL, DRAFT or COPY to all or selected PDF pages. Choose opacity, colour and angle. Free, nothing uploaded.',
  searchAliases: [
    'add watermark to pdf',
    'pdf watermark text',
    'stamp confidential on pdf',
    'mark pdf as copy',
    'draft watermark pdf',
    'watermark id proof pdf',
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
  related: ['pdf.add-page-numbers', 'pdf.merge-pdf', 'pdf.flatten-pdf'],
});
