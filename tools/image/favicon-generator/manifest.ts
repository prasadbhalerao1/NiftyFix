import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'image.favicon-generator',
  version: 1,
  slug: 'favicon-generator',
  category: 'image',
  status: 'live',
  name: 'Favicon Generator',
  h1: 'Favicon generator: every icon your site needs',
  tagline:
    'Turn a logo, SVG, text or emoji into favicon.ico, Apple touch and Android icons, a web app manifest and the HTML to paste.',
  seoTitle: 'Favicon Generator: ICO, Apple and Android icons, free | NiftyFix',
  seoDescription:
    'Make favicon.ico, PNG, Apple touch, Android and maskable icons plus site.webmanifest from a logo, SVG or text. Preview and copy the HTML. Free, no upload.',
  searchAliases: [
    'favicon generator',
    'favicon maker',
    'png to ico',
    'svg to favicon',
    'apple touch icon generator',
    'text to favicon',
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
    verifiesOutput: true,
  },
  related: ['image.resize-image', 'image.make-square', 'image.image-to-base64'],
});
