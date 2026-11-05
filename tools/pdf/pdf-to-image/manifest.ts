import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.pdf-to-image',
  version: 1,
  slug: 'pdf-to-image',
  category: 'pdf',
  status: 'live',
  name: 'PDF to JPG / PNG',
  h1: 'Convert PDF pages to JPG or PNG images',
  tagline:
    'Turn each PDF page into a sharp JPG or PNG image at the resolution you choose, one page or the whole document.',
  seoTitle: 'PDF to JPG: convert PDF pages to images, free | NiftyFix',
  seoDescription:
    'Convert PDF pages to high-quality JPG or PNG images at 72, 150 or 300 DPI. Pick pages, download a ZIP. Free, and nothing is uploaded.',
  searchAliases: [
    'pdf to jpg',
    'pdf to png',
    'convert pdf to image',
    'save pdf page as image',
    'pdf to jpeg high quality',
    'extract pdf page as picture',
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
  related: ['pdf.image-to-pdf', 'pdf.split-pdf', 'pdf.extract-pdf-pages'],
});
