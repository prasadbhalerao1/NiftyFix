import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.resize-image',
  version: 1,
  slug: 'resize-image',
  category: 'image',
  status: 'live',
  name: 'Resize Image',
  h1: 'Resize an image to any size',
  tagline:
    'Change the width and height of a JPG, PNG or WebP in pixels, percent, centimetres or inches, keeping its proportions.',
  seoTitle: 'Resize Image: change photo size in pixels or cm, free | NiftyFix',
  seoDescription:
    'Resize a JPG, PNG or WebP to exact pixels, a percentage, or centimetres at any DPI. Keeps proportions or crops to fit. Free, nothing uploaded.',
  searchAliases: [
    'resize image',
    'resize photo',
    'image resizer',
    'change image size',
    'resize image in pixels',
    'photo resize in cm',
    'resize image without losing quality',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxPixels: { mobile: 50_000_000, desktop: 100_000_000 },
    maxFiles: 1,
  },
  output: { formats: ['jpeg', 'png', 'webp'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: [
    'image.compress-image',
    'forms.photo-resizer',
    'forms.signature-resizer',
    'pdf.image-to-pdf',
  ],
});
