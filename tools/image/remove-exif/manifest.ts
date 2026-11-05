import { defineManifest } from '@niftyfix/tool-sdk';

const MB = 1_000_000;

export default defineManifest({
  id: 'image.remove-exif',
  version: 1,
  slug: 'remove-exif',
  category: 'image',
  status: 'live',
  name: 'Remove EXIF and GPS Data',
  h1: 'Remove location and EXIF data from a photo',
  tagline:
    'See the hidden details in a photo (location, camera, date) and remove them, without changing the picture.',
  seoTitle: 'Remove EXIF data and GPS location from photos, free | NiftyFix',
  seoDescription:
    'View and remove EXIF metadata, GPS location, camera and date from JPG, PNG and WebP photos. No quality loss. Free, nothing uploaded.',
  searchAliases: [
    'remove exif data',
    'exif remover',
    'remove gps from photo',
    'remove location from photo',
    'exif viewer',
    'photo metadata remover',
    'view photo metadata',
  ],
  input: {
    kind: 'files',
    formats: ['jpeg', 'png', 'webp'],
    maxBytes: { mobile: 30 * MB, desktop: 60 * MB },
    maxFiles: 50,
  },
  output: { formats: ['jpeg', 'png', 'webp'] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: { batch: true, cancellable: false, progress: 'determinate', verifiesOutput: true },
  related: ['image.compress-image', 'pdf.pdf-metadata', 'image.convert-image', 'image.crop-image'],
});
