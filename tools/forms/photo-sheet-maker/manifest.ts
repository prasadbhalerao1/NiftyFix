import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'forms.photo-sheet-maker',
  version: 1,
  slug: 'photo-sheet-maker',
  category: 'forms',
  status: 'live',
  name: 'ID and Photo Sheet Maker',
  h1: 'Print passport photos on one sheet',
  tagline:
    'Put 8 passport photos on 4 × 6 inch photo paper, or up to 30 on A4, with cutting guides, ready to print at a shop or at home.',
  seoTitle: 'Passport photo sheet: 8 on 4x6, 30 on A4, free | NiftyFix',
  seoDescription:
    'Make a printable sheet of passport size photos: 8 copies of 3.5 × 4.5 cm on 4 × 6 inch paper or 30 on A4, with cutting guides. Free, nothing uploaded.',
  searchAliases: [
    'passport photo sheet',
    'passport size photo print sheet',
    'passport photo a4 sheet',
    '8 passport photos 4x6',
    'print passport photos at home',
    'multiple passport photos on one page',
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
    'forms.passport-photo-maker',
    'forms.photo-resizer',
    'image.crop-image',
    'pdf.image-to-pdf',
  ],
});
