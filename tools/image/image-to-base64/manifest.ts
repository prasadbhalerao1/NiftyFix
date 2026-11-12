import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'image.image-to-base64',
  version: 1,
  slug: 'image-to-base64',
  category: 'image',
  status: 'live',
  name: 'Image to Base64 and Back',
  h1: 'Convert an image to Base64, or Base64 back to an image',
  tagline:
    'Turn images into Base64 data URIs, CSS, HTML or Markdown snippets, and decode any Base64 string back into a downloadable image.',
  seoTitle: 'Image to Base64 Converter: data URI, CSS, HTML, free | NiftyFix',
  seoDescription:
    'Convert images to Base64 as a data URI, CSS, HTML img tag, Markdown or JSON, or decode Base64 back to an image. Several files at once; nothing uploaded.',
  searchAliases: [
    'image to base64',
    'base64 to image',
    'convert image to base64',
    'image to data uri',
    'png to base64',
    'base64 image decoder',
  ],
  input: { kind: 'interactive' },
  output: { formats: [] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'image',
  capabilities: {
    batch: false,
    cancellable: false,
    progress: 'determinate',
    verifiesOutput: false,
  },
  related: ['image.convert-image', 'image.compress-image', 'image.image-color-picker'],
});
