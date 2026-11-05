import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.organize-pdf',
  version: 1,
  slug: 'organize-pdf',
  category: 'pdf',
  status: 'live',
  name: 'Organize PDF Pages',
  h1: 'Organize PDF pages: reorder, rotate and delete',
  tagline:
    'See every page as a thumbnail, then drag pages into order, turn the sideways ones and remove the ones you do not need.',
  seoTitle: 'Organize PDF: reorder, rotate, delete pages | NiftyFix',
  seoDescription:
    'Rearrange PDF pages with live thumbnails: drag to reorder, rotate, and delete pages, then save. Free, private, nothing is uploaded.',
  searchAliases: [
    'reorder pdf pages',
    'rearrange pdf pages',
    'delete pages from pdf',
    'remove pages from pdf',
    'sort pdf pages',
    'move pages in pdf',
  ],
  input: {
    kind: 'files',
    formats: ['pdf'],
    maxBytes: { mobile: 100 * MB, desktop: 250 * MB },
    maxFiles: 1,
  },
  output: { formats: ['pdf'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'pdf',
  capabilities: { batch: false, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: ['pdf.rotate-pdf', 'pdf.extract-pdf-pages', 'pdf.merge-pdf', 'pdf.split-pdf'],
});
