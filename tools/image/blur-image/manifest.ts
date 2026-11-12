import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.blur-image',
  version: 1,
  slug: 'blur-image',
  category: 'image',
  status: 'live',
  name: 'Blur and Redact Image',
  h1: 'Blur, pixelate or black out part of an image',
  tagline:
    'Hide faces, numbers, addresses and anything private in a photo or screenshot: draw boxes, choose black, blur or pixelate, done.',
  seoTitle: 'Blur Image: blur, pixelate or redact a photo, free | NiftyFix',
  seoDescription:
    'Blur, pixelate or black out parts of a photo or screenshot. Auto-mask Aadhaar numbers; removes location data. Free, and the image never leaves your device.',
  searchAliases: [
    'blur image',
    'blur part of image',
    'redact image',
    'pixelate image',
    'censor photo',
    'hide number in photo',
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
  related: ['image.crop-image', 'image.remove-exif', 'image.compress-image'],
});
