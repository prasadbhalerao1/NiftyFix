import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.rotate-image',
  version: 1,
  slug: 'rotate-image',
  category: 'image',
  status: 'live',
  name: 'Rotate and Flip Image',
  h1: 'Rotate or flip an image',
  tagline:
    'Turn a sideways or upside-down photo the right way, or mirror it, and save it so it stays that way in every app.',
  seoTitle: 'Rotate Image: turn or flip a photo online, free | NiftyFix',
  seoDescription:
    'Rotate a JPG, PNG or WebP by 90 or 180 degrees, or flip it horizontally or vertically, with a live preview. Free, nothing uploaded.',
  searchAliases: [
    'rotate image',
    'rotate photo',
    'flip image',
    'mirror image',
    'flip photo horizontally',
    'rotate picture 90 degrees',
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
  related: ['image.resize-image', 'image.compress-image', 'pdf.rotate-pdf', 'image.convert-image'],
});
