import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.grayscale-pdf',
  version: 1,
  slug: 'grayscale-pdf',
  category: 'pdf',
  status: 'live',
  name: 'PDF to Black and White',
  h1: 'Convert a PDF to black and white or grayscale',
  tagline:
    'Turn a colour PDF into true grayscale or pure black and white for cheap printing, with text kept sharp and selectable.',
  seoTitle: 'PDF to Black and White: grayscale PDF converter, free | NiftyFix',
  seoDescription:
    'Convert a colour PDF to grayscale or pure black and white. Text stays sharp and selectable; choose brightness, contrast and threshold. Free, no upload.',
  searchAliases: [
    'pdf to black and white',
    'convert pdf to grayscale',
    'grayscale pdf',
    'black and white pdf converter',
    'remove colour from pdf',
    'pdf for black and white printing',
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
  related: ['pdf.compress-pdf', 'pdf.pages-per-sheet', 'pdf.extract-pdf-images'],
});
