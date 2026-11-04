import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'forms.photo-resizer',
  version: 1,
  slug: 'photo-resizer',
  category: 'forms',
  status: 'live',
  name: 'Form Photo Resizer',
  h1: 'Resize a photo for an application form',
  tagline:
    'Crop, resize and compress your photo to exact pixel dimensions and a file-size range, then check the result against each requirement.',
  seoTitle: 'Form Photo Resizer — exact pixels and KB size | NiftyFix',
  seoDescription:
    'Resize a photo to exact pixel dimensions and a minimum/maximum KB size for exam and government forms. Runs on your device; every requirement is verified.',
  searchAliases: [
    'photo resize for exam form',
    'resize photo to 20kb to 50kb',
    'passport size photo resizer',
    'compress photo for online application',
    'photo size kb reducer',
    'resize image to exact pixels',
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
  related: [],
});
