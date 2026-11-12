import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.extract-pdf-images',
  version: 1,
  slug: 'extract-pdf-images',
  category: 'pdf',
  status: 'live',
  name: 'Extract Images from PDF',
  h1: 'Extract images from a PDF at original quality',
  tagline:
    'Save every photo and picture inside a PDF as its own file, exactly as stored: JPEGs untouched, other images as lossless PNG.',
  seoTitle: 'Extract Images from PDF: original quality, free | NiftyFix',
  seoDescription:
    'Save all photos inside a PDF as JPG or PNG at full original quality. Skip icons and repeats, pick the ones you want. Free, nothing uploaded.',
  searchAliases: [
    'extract images from pdf',
    'save images from pdf',
    'pdf image extractor',
    'get pictures out of pdf',
    'download images from pdf',
    'extract jpg from pdf',
  ],
  input: {
    kind: 'files',
    formats: ['pdf'],
    maxBytes: { mobile: 100 * MB, desktop: 250 * MB },
    maxFiles: 1,
  },
  output: { formats: ['jpeg', 'png', 'zip'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'pdf',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: ['pdf.pdf-to-image', 'pdf.extract-pdf-pages', 'image.compress-image'],
});
