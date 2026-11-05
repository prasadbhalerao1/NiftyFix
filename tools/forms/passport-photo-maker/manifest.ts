import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'forms.passport-photo-maker',
  version: 1,
  slug: 'passport-photo-maker',
  category: 'forms',
  status: 'live',
  name: 'Passport and Visa Photo Maker',
  h1: 'Make a passport or visa photo',
  tagline:
    'Turn a phone photo into a passport or visa photo at the exact official size for India, the US or the UK, with a guide for where your head goes.',
  seoTitle: 'Passport Photo Maker: India, US, UK sizes, free | NiftyFix',
  seoDescription:
    'Make a passport or visa photo at the official size: Indian passport 3.5 × 4.5 cm, Indian visa upload, US 2 × 2 inch, UK 35 × 45 mm. Free, nothing uploaded.',
  searchAliases: [
    'passport size photo',
    'passport photo maker',
    'passport size photo online',
    'visa photo maker',
    'indian passport photo size',
    '2x2 photo',
    '35x45 photo',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxPixels: { mobile: 50_000_000, desktop: 100_000_000 },
    maxFiles: 1,
  },
  output: { formats: ['jpeg'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: [
    'forms.photo-resizer',
    'forms.signature-resizer',
    'image.crop-image',
    'image.compress-image',
  ],
});
