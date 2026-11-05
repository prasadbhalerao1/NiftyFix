import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'text.krutidev-to-unicode',
  version: 1,
  slug: 'krutidev-to-unicode',
  category: 'text',
  status: 'live',
  name: 'Krutidev to Unicode Converter',
  h1: 'Krutidev to Unicode converter (and Unicode to Krutidev)',
  tagline:
    'Turn Kruti Dev 010 text like "Hkkjr" into Unicode Hindi (भारत) you can share anywhere, or convert Unicode Hindi back to Kruti Dev for typing tests and office files.',
  seoTitle: 'Krutidev to Unicode Converter, and Unicode to Krutidev | NiftyFix',
  seoDescription:
    'Convert Kruti Dev 010 to Unicode Hindi and back with correct reph, short i matra and conjuncts. Flags English words Kruti Dev cannot show. Free, private.',
  searchAliases: [
    'krutidev to unicode',
    'kruti dev to unicode converter',
    'unicode to krutidev',
    'kruti dev 010 converter',
    'hindi font converter',
    'mangal to krutidev',
    'krutidev to mangal',
  ],
  input: { kind: 'interactive' },
  output: { formats: [] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'text',
  capabilities: {
    batch: false,
    cancellable: false,
    progress: 'determinate',
    verifiesOutput: false,
  },
  related: ['text.word-counter', 'ocr.image-to-text'],
});
