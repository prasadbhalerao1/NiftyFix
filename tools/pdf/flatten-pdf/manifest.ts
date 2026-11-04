import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.flatten-pdf',
  version: 1,
  slug: 'flatten-pdf',
  category: 'pdf',
  status: 'live',
  name: 'Flatten PDF',
  h1: 'Flatten a PDF form',
  tagline:
    'Turn filled-in form fields into ordinary page content, so the answers can no longer be changed and look the same in every viewer.',
  seoTitle: 'Flatten PDF — lock filled form fields, free | NiftyFix',
  seoDescription:
    'Flatten a filled PDF form so its answers become part of the page and cannot be edited. Looks the same everywhere. Free and private.',
  searchAliases: [
    'flatten pdf form',
    'make pdf form non editable',
    'lock pdf form fields',
    'flatten fillable pdf',
    'pdf form not showing answers',
    'remove form fields from pdf',
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
  related: ['pdf.merge-pdf', 'pdf.watermark-pdf', 'pdf.add-page-numbers'],
});
