import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'text.remove-line-breaks',
  version: 1,
  slug: 'remove-line-breaks',
  category: 'text',
  status: 'live',
  name: 'Text Cleaner',
  h1: 'Remove line breaks and clean up text',
  tagline:
    'Fix text copied from PDFs, emails and websites: join broken lines, remove extra spaces, curly quotes, HTML, emoji and invisible characters.',
  seoTitle: 'Remove Line Breaks: clean up copied text online, free | NiftyFix',
  seoDescription:
    'Remove line breaks from text copied from PDFs and emails, keeping paragraphs. Also removes extra spaces, HTML, emoji and invisible characters. Free.',
  searchAliases: [
    'remove line breaks',
    'remove extra spaces',
    'fix text copied from pdf',
    'text cleaner',
    'remove html tags from text',
    'remove invisible characters',
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
  related: ['text.case-converter', 'text.word-counter', 'pdf.pdf-to-text'],
});
