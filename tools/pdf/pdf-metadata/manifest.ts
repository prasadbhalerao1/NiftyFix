import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.pdf-metadata',
  version: 1,
  slug: 'pdf-metadata',
  category: 'pdf',
  status: 'live',
  name: 'PDF Metadata Editor',
  h1: 'Edit or remove PDF metadata',
  tagline:
    'See and change the hidden title, author, subject and keywords of a PDF — or remove them all before you share the file.',
  seoTitle: 'PDF Metadata Editor — edit or remove, free | NiftyFix',
  seoDescription:
    'View and edit PDF title, author, subject and keywords, or remove all metadata including hidden XMP data. Free, private, nothing uploaded.',
  searchAliases: [
    'edit pdf metadata',
    'remove pdf metadata',
    'change pdf title',
    'change pdf author',
    'pdf properties editor',
    'remove author name from pdf',
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
  related: ['pdf.flatten-pdf', 'pdf.watermark-pdf', 'pdf.merge-pdf'],
});
