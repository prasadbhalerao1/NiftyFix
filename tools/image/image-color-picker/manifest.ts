import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'image.image-color-picker',
  version: 1,
  slug: 'image-color-picker',
  category: 'image',
  status: 'live',
  name: 'Image Colour Picker and Palette',
  h1: 'Pick colours from an image and get its palette',
  tagline:
    'Tap any spot of a photo or screenshot to get its HEX, RGB, HSL and CMYK code, and extract the main colours as a ready-to-use palette.',
  seoTitle: 'Color Picker from Image: get HEX and RGB from a photo | NiftyFix',
  seoDescription:
    'Pick colors from any image or screenshot with a zoom loupe: HEX, RGB, HSL, CMYK and contrast. Extract a palette as CSS or Tailwind. Free, no upload.',
  searchAliases: [
    'color picker from image',
    'hex color picker from image',
    'get color from image',
    'color palette from image',
    'colour picker from photo',
    'eyedropper online',
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
  related: ['image.convert-image', 'image.crop-image', 'image.remove-exif'],
});
