import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.watermark-image',
  version: 1,
  slug: 'watermark-image',
  category: 'image',
  status: 'live',
  name: 'Watermark Image',
  h1: 'Add a text watermark to an image',
  tagline:
    'Put your name, a copyright line or "For verification only" on a photo or document image: in a corner, across the centre or repeated.',
  seoTitle: 'Watermark Image: add text to a photo online, free | NiftyFix',
  seoDescription:
    'Add a text watermark to a JPG, PNG or WebP: a corner credit, a centred mark or text repeated across the image. Free, nothing uploaded.',
  searchAliases: [
    'watermark image',
    'add watermark to photo',
    'add text to image',
    'watermark photo online',
    'copyright watermark',
    'for verification only watermark',
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
  related: ['pdf.watermark-pdf', 'image.compress-image', 'image.remove-exif', 'image.crop-image'],
});
