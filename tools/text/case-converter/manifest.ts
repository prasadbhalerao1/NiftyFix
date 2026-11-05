import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'text.case-converter',
  version: 1,
  slug: 'case-converter',
  category: 'text',
  status: 'live',
  name: 'Case Converter',
  h1: 'Change text to upper, lower, title or sentence case',
  tagline:
    'Convert text to UPPER CASE, lower case, Title Case, Sentence case, or camelCase and snake_case for code, in one click.',
  seoTitle: 'Case Converter: uppercase, lowercase, title case, free | NiftyFix',
  seoDescription:
    'Change text to uppercase, lowercase, title case, sentence case, camelCase, snake_case or kebab-case instantly. Free, and nothing you type is sent anywhere.',
  searchAliases: [
    'case converter',
    'uppercase to lowercase',
    'lowercase to uppercase',
    'title case converter',
    'sentence case',
    'capitalize words',
    'camelcase converter',
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
