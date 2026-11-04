import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'pdf.image-to-pdf',
  version: 1,
  slug: 'image-to-pdf',
  category: 'pdf',
  status: 'beta',
  name: 'JPG to PDF',
  h1: 'Convert JPG and other images to PDF',
  tagline:
    'Turn photos and scans into one PDF, one image per page, in the order you choose. JPEG and PNG keep their full quality.',
  seoTitle: 'JPG to PDF — convert images to PDF, free | NiftyFix',
  seoDescription:
    'Convert JPG, PNG, WebP and other images into one PDF, one per page, on A4, Letter or the image size. Free, no upload, no watermark.',
  searchAliases: [
    'jpg to pdf',
    'image to pdf',
    'photo to pdf',
    'png to pdf',
    'convert images into one pdf',
    'scan photos to pdf',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp', 'avif', 'bmp', 'gif'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxPixels: { mobile: 50_000_000, desktop: 100_000_000 },
    maxFiles: 100,
  },
  output: { formats: ['pdf'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'pdf',
  capabilities: { batch: true, cancellable: true, progress: 'determinate', verifiesOutput: true },
  related: ['pdf.merge-pdf', 'pdf.rotate-pdf', 'forms.photo-resizer'],
});
