import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.fill-pdf-form',
  version: 1,
  slug: 'fill-pdf-form',
  category: 'pdf',
  status: 'live',
  name: 'Fill PDF Form',
  h1: 'Fill in a PDF form online',
  tagline:
    'Type your answers into a fillable PDF form (text boxes, tick boxes, choices) and save a completed copy, optionally locked.',
  seoTitle: 'Fill PDF Form: type into fillable PDFs, free | NiftyFix',
  seoDescription:
    'Fill in fillable PDF forms: text, check boxes, radio buttons and drop-downs. Optionally flatten to lock answers. Free and private, no upload.',
  searchAliases: [
    'fill pdf form',
    'fill in pdf online',
    'type on pdf form',
    'complete fillable pdf',
    'pdf form filler',
    'fill application form pdf',
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
  related: ['pdf.flatten-pdf', 'pdf.merge-pdf', 'pdf.pdf-metadata'],
});
