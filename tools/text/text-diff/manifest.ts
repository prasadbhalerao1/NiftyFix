import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'text.text-diff',
  version: 1,
  slug: 'text-diff',
  category: 'text',
  status: 'live',
  name: 'Text Diff Checker',
  h1: 'Diff checker: compare two texts and see what changed',
  tagline:
    'Paste two versions of any text, code or JSON and see every added, removed and changed line, with the changed words highlighted.',
  seoTitle: 'Diff Checker: compare text and code online, free | NiftyFix',
  seoDescription:
    'Compare two texts, code files or JSON side by side or unified, with changed words highlighted. Ignore case or spaces, download a .patch. Private and free.',
  searchAliases: [
    'diff checker',
    'compare text',
    'text compare',
    'code diff',
    'json diff',
    'find difference between two texts',
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
  related: ['pdf.compare-pdf', 'text.word-counter', 'text.case-converter'],
});
