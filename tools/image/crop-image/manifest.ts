import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.crop-image',
  version: 1,
  slug: 'crop-image',
  category: 'image',
  status: 'live',
  name: 'Crop Image',
  h1: 'Crop an image',
  tagline:
    'Cut an image down to the part you need, freely or to a fixed shape such as square or passport photo, without losing sharpness.',
  seoTitle: 'Crop Image online: square, 4:3, 16:9 or free, free | NiftyFix',
  seoDescription:
    'Crop a JPG, PNG or WebP freely or to square, 4:3, 16:9 or passport-photo shape. Kept pixels are not resampled. Free, nothing uploaded.',
  searchAliases: [
    'crop image',
    'crop photo',
    'image cropper',
    'crop picture online',
    'crop image to square',
    'cut photo',
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
    'image.resize-image',
    'image.rotate-image',
    'forms.photo-resizer',
    'image.compress-image',
  ],
});
