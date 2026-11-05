import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'text.word-counter',
  version: 1,
  slug: 'word-counter',
  category: 'text',
  status: 'live',
  name: 'Word Counter',
  h1: 'Word and character counter',
  tagline:
    'Count words, characters, sentences and paragraphs as you type, with reading time, in English, Hindi and any other language.',
  seoTitle: 'Word Counter: words, characters and reading time, free | NiftyFix',
  seoDescription:
    'Count words and characters (with and without spaces), sentences, paragraphs and reading time as you type, in any language. Free, private.',
  searchAliases: [
    'word counter',
    'character counter',
    'word count',
    'letter counter',
    'count characters',
    'reading time calculator',
    'hindi word counter',
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
  related: ['ocr.image-to-text', 'pdf.pdf-to-text'],
});
