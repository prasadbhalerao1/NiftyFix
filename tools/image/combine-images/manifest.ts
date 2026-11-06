import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.combine-images',
  version: 1,
  slug: 'combine-images',
  category: 'image',
  status: 'live',
  name: 'Combine Images',
  h1: 'Combine images into one',
  tagline:
    'Join photos one under another, side by side or in a grid, or put the front and back of an Aadhaar or ID card on one A4 page to print.',
  seoTitle: 'Combine Images: join photos into one, free | NiftyFix',
  seoDescription:
    'Join 2 to 20 photos vertically, side by side or in a grid, or print Aadhaar front and back on one A4 page. Free, in your browser, nothing uploaded.',
  searchAliases: [
    'combine images',
    'merge images',
    'join photos',
    'stitch images',
    'combine two photos into one',
    'photo collage',
    'aadhar card front and back on one page',
    'id card front and back in one page',
    'merge photos vertically',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxPixels: { mobile: 50_000_000, desktop: 100_000_000 },
    maxFiles: 20,
  },
  output: { formats: ['jpeg', 'png'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: [
    'pdf.image-to-pdf',
    'forms.photo-sheet-maker',
    'image.crop-image',
    'image.compress-image',
  ],
});
