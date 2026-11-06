import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.make-square',
  version: 1,
  slug: 'make-square',
  category: 'image',
  status: 'live',
  name: 'Make Square / Add Border',
  h1: 'Make a photo square without cropping, or add a border',
  tagline:
    'Fit the whole photo into a square for a WhatsApp DP, Instagram or a product listing, on white, black, any colour or a blurred background.',
  seoTitle: 'Make Photo Square Without Cropping, or Add Border | NiftyFix',
  seoDescription:
    'Fit a whole photo into a square for WhatsApp DP, Instagram or Meesho, with a white, colour or blurred background, or add a border. Free, private.',
  searchAliases: [
    'make photo square',
    'square photo without cropping',
    'no crop',
    'add border to photo',
    'add white border to image',
    'whatsapp dp without crop',
    'instagram no crop',
    'blur background square',
    'photo frame border',
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
  related: [
    'image.crop-image',
    'image.resize-image',
    'image.combine-images',
    'image.compress-image',
  ],
});
