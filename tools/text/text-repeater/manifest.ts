import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'text.text-repeater',
  version: 1,
  slug: 'text-repeater',
  category: 'text',
  status: 'live',
  name: 'Text Repeater',
  h1: 'Text repeater: repeat any text or emoji many times',
  tagline:
    'Repeat a word, message or emoji up to 100,000 times, on new lines, with spaces or your own separator, ready to copy into WhatsApp or anywhere.',
  seoTitle: 'Text Repeater: repeat text or emoji 1000 times, free | NiftyFix',
  seoDescription:
    'Repeat any text or emoji up to 100,000 times with new lines, spaces or a custom separator, numbered if you like. Copy for WhatsApp in one tap. Free.',
  searchAliases: [
    'text repeater',
    'repeat text',
    'emoji repeater',
    'text repeater for whatsapp',
    'repeat word 1000 times',
    'copy paste text multiple times',
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
  related: ['text.word-counter', 'text.case-converter', 'text.sort-lines'],
});
