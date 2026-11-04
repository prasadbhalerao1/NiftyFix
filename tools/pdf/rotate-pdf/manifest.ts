import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.rotate-pdf',
  version: 1,
  slug: 'rotate-pdf',
  category: 'pdf',
  status: 'live',
  name: 'Rotate PDF',
  h1: 'Rotate PDF pages',
  tagline:
    'Turn sideways or upside-down pages the right way up — all pages or only the ones you choose. Runs on your device.',
  seoTitle: 'Rotate PDF — turn pages permanently, free | NiftyFix',
  seoDescription:
    'Rotate all or selected pages of a PDF by 90, 180 or 270 degrees and save it permanently. Free, no upload, no watermark.',
  searchAliases: [
    'rotate pdf pages',
    'turn pdf sideways',
    'fix upside down pdf',
    'rotate pdf and save',
    'rotate one page in pdf',
    'pdf rotate 90 degrees',
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
  related: ['pdf.merge-pdf', 'pdf.extract-pdf-pages', 'pdf.add-page-numbers'],
});
