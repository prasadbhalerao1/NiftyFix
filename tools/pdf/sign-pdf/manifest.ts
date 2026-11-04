import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.sign-pdf',
  version: 1,
  slug: 'sign-pdf',
  category: 'pdf',
  status: 'live',
  name: 'Sign PDF',
  h1: 'Sign a PDF online',
  tagline:
    'Draw your signature or upload a photo of it, drag it into place on the page, and save the signed PDF — all on your device.',
  seoTitle: 'Sign PDF — add your signature to a PDF, free | NiftyFix',
  seoDescription:
    'Draw your signature or upload a photo, place it anywhere on a PDF page, and download the signed file. Free, private, nothing uploaded.',
  searchAliases: [
    'sign pdf',
    'add signature to pdf',
    'put signature on pdf',
    'esign pdf free',
    'sign document online',
    'insert signature in pdf',
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
  related: ['pdf.fill-pdf-form', 'forms.signature-resizer', 'pdf.flatten-pdf'],
});
