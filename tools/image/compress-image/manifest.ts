import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.compress-image',
  version: 1,
  slug: 'compress-image',
  category: 'image',
  status: 'live',
  name: 'Compress Image',
  h1: 'Compress an image to a smaller size',
  tagline:
    'Make a JPG, PNG or WebP smaller: pick a level, or enter the KB limit your form asks for and get a file that fits.',
  seoTitle: 'Compress Image: reduce photo size in KB, free | NiftyFix',
  seoDescription:
    'Reduce JPG, PNG and WebP file size, or compress a photo to a limit such as 50 KB or 100 KB. Free, and your image never leaves your device.',
  searchAliases: [
    'compress image',
    'compress jpeg',
    'compress photo',
    'reduce image size',
    'reduce photo size in kb',
    'image size reducer',
    'photo compressor',
    'compress png',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxPixels: { mobile: 50_000_000, desktop: 100_000_000 },
    maxFiles: 1,
  },
  output: { formats: ['jpeg', 'webp', 'png'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: [
    'forms.photo-resizer',
    'forms.signature-resizer',
    'pdf.image-to-pdf',
    'pdf.compress-pdf',
  ],
});
