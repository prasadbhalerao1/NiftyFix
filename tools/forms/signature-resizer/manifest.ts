import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'forms.signature-resizer',
  version: 1,
  slug: 'signature-resizer',
  category: 'forms',
  status: 'beta',
  name: 'Signature Resizer',
  h1: 'Resize and clean up a signature for an application form',
  tagline:
    'Turn a phone photo or scan of your signature into a clean image with exact pixel dimensions and a file-size range, and check every requirement before you upload.',
  seoTitle: 'Signature Resizer — clean background, exact KB size | NiftyFix',
  seoDescription:
    'Crop a signature photo, whiten the paper without losing pen strokes, and resize to exact pixels and a KB range. Runs on your device; every check is verified.',
  searchAliases: [
    'resize signature for exam form',
    'signature size 10kb to 20kb',
    'signature photo white background',
    'compress signature image kb',
    'scan signature online',
    'signature resizer for online application',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxPixels: { mobile: 50_000_000, desktop: 100_000_000 },
    maxFiles: 1,
  },
  output: { formats: ['jpeg', 'png'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: {
    batch: false,
    cancellable: true,
    progress: 'determinate',
    verifiesOutput: true,
  },
  related: ['forms.photo-resizer'],
});
