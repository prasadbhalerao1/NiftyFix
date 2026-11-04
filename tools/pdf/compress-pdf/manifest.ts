import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.compress-pdf',
  version: 1,
  slug: 'compress-pdf',
  category: 'pdf',
  status: 'beta',
  name: 'Compress PDF',
  h1: 'Compress a PDF to a smaller size',
  tagline:
    'Make a PDF smaller by recompressing its photos and scans — pick a level, or enter the size limit your portal asks for.',
  seoTitle: 'Compress PDF — reduce PDF size to KB or MB, free | NiftyFix',
  seoDescription:
    'Reduce PDF file size by recompressing images, or compress to a target such as 1 MB or 200 KB. Text stays sharp. Free, nothing uploaded.',
  searchAliases: [
    'compress pdf',
    'reduce pdf size',
    'compress pdf to 1mb',
    'compress pdf to 200kb',
    'pdf size reducer',
    'make pdf smaller for upload',
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
  related: ['pdf.organize-pdf', 'pdf.split-pdf', 'pdf.image-to-pdf', 'pdf.merge-pdf'],
});
