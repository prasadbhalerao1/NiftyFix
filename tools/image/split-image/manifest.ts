import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.split-image',
  version: 1,
  slug: 'split-image',
  category: 'image',
  status: 'live',
  name: 'Split Image into a Grid',
  h1: 'Split an image into a grid, Instagram tiles or poster pages',
  tagline:
    'Cut one picture into equal pieces: any grid, an Instagram profile grid, a seamless carousel, or a big poster printed on A4 pages.',
  seoTitle: 'Split Image: image splitter for grids and Instagram | NiftyFix',
  seoDescription:
    'Split an image into a grid of equal pieces, Instagram tiles numbered in posting order, carousel slides or A4 poster pages. Free, nothing uploaded.',
  searchAliases: [
    'split image',
    'image splitter',
    'split image into grid',
    'instagram grid maker',
    'split panorama for instagram carousel',
    'print image on multiple pages',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxPixels: { mobile: 50_000_000, desktop: 100_000_000 },
    maxFiles: 1,
  },
  output: { formats: ['zip', 'pdf'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: ['image.crop-image', 'image.combine-images', 'image.resize-image'],
});
