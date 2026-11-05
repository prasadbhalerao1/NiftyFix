import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'ocr.image-to-text',
  version: 1,
  slug: 'image-to-text',
  category: 'ocr',
  status: 'live',
  name: 'Image to Text (OCR)',
  h1: 'Copy text from an image',
  tagline:
    'Turn a photo, scan or screenshot into text you can copy and edit, in English, Hindi and Marathi. Read on your device; nothing is uploaded.',
  seoTitle: 'Image to Text: OCR in English, Hindi, Marathi, free | NiftyFix',
  seoDescription:
    'Extract text from photos, scans and screenshots with OCR in English, Hindi and Marathi. Copy or download it. Free, and your image never leaves your device.',
  searchAliases: [
    'image to text',
    'ocr',
    'photo to text',
    'jpg to text',
    'extract text from image',
    'copy text from image',
    'screenshot to text',
    'hindi ocr',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxPixels: { mobile: 50_000_000, desktop: 100_000_000 },
    maxFiles: 20,
  },
  output: { formats: ['txt'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'ocr',
  capabilities: { batch: true, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: ['pdf.pdf-to-text', 'image.crop-image', 'image.rotate-image', 'pdf.image-to-pdf'],
});
