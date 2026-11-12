import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'text.sort-lines',
  version: 1,
  slug: 'sort-lines',
  category: 'text',
  status: 'live',
  name: 'Sort and Remove Duplicate Lines',
  h1: 'Sort lines and remove duplicates from a list',
  tagline:
    'Clean up any list: remove duplicate and empty lines, sort A to Z or by number, shuffle, reverse or number it, instantly.',
  seoTitle: 'Sort Lines and Remove Duplicates from a List, free | NiftyFix',
  seoDescription:
    'Remove duplicate lines, sort a list alphabetically or by number, shuffle, reverse and number lines. Instant, private, works with huge lists. Free.',
  searchAliases: [
    'remove duplicate lines',
    'sort lines alphabetically',
    'sort list',
    'remove duplicates from list',
    'alphabetize list',
    'shuffle list',
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
  related: ['text.text-diff', 'text.case-converter', 'text.word-counter'],
});
