import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.unlock-pdf',
  version: 1,
  slug: 'unlock-pdf',
  category: 'pdf',
  status: 'live',
  name: 'Remove PDF Password',
  h1: 'Remove the password from a PDF',
  tagline:
    'Unlock a PDF you have the password for, and lift print, copy and edit restrictions, so it opens anywhere without asking.',
  seoTitle: 'Remove Password from PDF: unlock PDF online, free | NiftyFix',
  seoDescription:
    'Remove the password from a PDF and lift print and copy restrictions. Type the password once; get a PDF that opens anywhere. Free, nothing uploaded.',
  searchAliases: [
    'remove password from pdf',
    'unlock pdf',
    'pdf password remover',
    'how to remove password from pdf',
    'remove pdf restrictions',
    'pdf password remove online',
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
  related: ['pdf.compress-pdf', 'pdf.merge-pdf', 'pdf.extract-pdf-images'],
});
