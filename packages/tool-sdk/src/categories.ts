export const CATEGORIES = {
  forms: {
    name: 'Form-ready',
    h1: 'Get files ready for application forms',
    description:
      'Prepare photographs, signatures and documents to match the published upload requirements of exam, recruitment and government portals.',
  },
  image: {
    name: 'Image',
    h1: 'Image tools',
    description: 'Compress, resize, crop and convert images on your device.',
  },
  pdf: {
    name: 'PDF',
    h1: 'PDF tools',
    description: 'Merge, split, organise and compress PDF files.',
  },
  video: {
    name: 'Video',
    h1: 'Video tools',
    description: 'Trim, compress and convert videos.',
  },
  audio: {
    name: 'Audio',
    h1: 'Audio tools',
    description: 'Convert, trim and extract audio.',
  },
  text: {
    name: 'Text',
    h1: 'Text tools',
    description: 'Count, compare and clean up text.',
  },
  developer: {
    name: 'Developer',
    h1: 'Developer tools',
    description: 'Format, encode and decode data for development work.',
  },
  generators: {
    name: 'Generators',
    h1: 'Generators',
    description: 'Create QR codes and other generated assets.',
  },
} as const satisfies Record<string, { name: string; h1: string; description: string }>;

export type CategoryId = keyof typeof CATEGORIES;

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export function isCategoryId(value: string): value is CategoryId {
  return Object.hasOwn(CATEGORIES, value);
}
