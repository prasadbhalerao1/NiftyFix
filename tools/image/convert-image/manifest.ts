import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.convert-image',
  version: 1,
  slug: 'convert-image',
  category: 'image',
  status: 'live',
  name: 'Convert Image',
  h1: 'Convert an image to JPG, PNG or WebP',
  tagline:
    'Change an image to JPG, PNG or WebP, from JPG, PNG, WebP, AVIF, BMP or GIF, and get a file checked to really be in that format.',
  seoTitle: 'Image Converter: PNG, JPG, WebP, AVIF, free | NiftyFix',
  seoDescription:
    'Convert images between JPG, PNG and WebP, including AVIF, BMP and GIF input. Adjustable quality. Free, in your browser, nothing uploaded.',
  searchAliases: [
    'image converter',
    'convert image',
    'png to jpg',
    'jpg to png',
    'webp to jpg',
    'jpeg to png',
    'convert photo to jpg',
    'change image format',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxPixels: { mobile: 50_000_000, desktop: 100_000_000 },
    maxFiles: 50,
  },
  output: { formats: ['jpeg', 'png', 'webp'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: { batch: true, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: ['image.compress-image', 'image.resize-image', 'pdf.image-to-pdf', 'pdf.pdf-to-image'],
});
