/**
 * Every workspace, in navigation order. Each has a hub page listing all of its
 * tools, built or planned (see @niftyfix/registry PLANNED_TOOLS and
 * docs/tool-catalogue-v3.md).
 */
export const CATEGORIES = {
  forms: {
    name: 'Form-ready',
    h1: 'Get files ready for application forms',
    description:
      'Prepare photographs, signatures and documents to match the published upload requirements of exam, recruitment and government portals.',
  },
  pdf: {
    name: 'PDF',
    h1: 'PDF tools',
    description: 'Merge, split, organise, compress, edit, sign, secure and convert PDF files.',
  },
  documents: {
    name: 'Documents',
    h1: 'Document and ebook converters',
    description: 'Convert Word, Excel, PowerPoint, OpenDocument, ebooks and more.',
  },
  image: {
    name: 'Image',
    h1: 'Image tools',
    description:
      'Compress, resize, convert, crop, rotate and watermark images, or remove EXIF and GPS data. Free, in your browser, with no upload.',
  },
  video: {
    name: 'Video',
    h1: 'Video tools',
    description: 'Convert, compress, trim, merge, crop, rotate and record video.',
  },
  audio: {
    name: 'Audio',
    h1: 'Audio tools',
    description: 'Convert, trim, merge, boost, clean up and record audio.',
  },
  subtitles: {
    name: 'Subtitles',
    h1: 'Subtitle and transcript tools',
    description: 'Edit, convert, synchronise and fix subtitles and transcripts.',
  },
  ocr: {
    name: 'OCR & files',
    h1: 'OCR and file inspection',
    description: 'Extract text from images and scans, and find out what any file really is.',
  },
  text: {
    name: 'Text',
    h1: 'Text tools',
    description:
      'Count words and characters, change text case, and convert Krutidev to Unicode Hindi and back. Free, in your browser, with no upload.',
  },
  data: {
    name: 'Data',
    h1: 'Spreadsheet and data tools',
    description: 'View, clean, split and convert CSV, Excel, JSON, XML and YAML.',
  },
  archive: {
    name: 'Archive',
    h1: 'ZIP, archive and file tools',
    description: 'Create, extract, inspect and convert archives, and rename files in bulk.',
  },
  developer: {
    name: 'Developer',
    h1: 'Developer and security tools',
    description: 'Format, validate, encode, hash and inspect data for development work.',
  },
  generators: {
    name: 'Generators',
    h1: 'QR, barcode and generators',
    description: 'Create and scan QR codes and barcodes, and generate text and identifiers.',
  },
  design: {
    name: 'Colour & design',
    h1: 'Colour and design tools',
    description: 'Pick, convert and mix colours, build palettes, and create graphics.',
  },
  seo: {
    name: 'SEO & social',
    h1: 'SEO, publishing and social tools',
    description: 'Check meta tags, generate structured data and format social posts.',
  },
  creator: {
    name: 'Creator',
    h1: 'YouTube and creator tools',
    description: 'Thumbnails, chapters, links, playlists and captions for creators.',
  },
  calculators: {
    name: 'Calculators',
    h1: 'Calculators and converters',
    description: 'Maths, finance, date, unit, health, education and file-size calculators.',
  },
  utilities: {
    name: 'Utilities',
    h1: 'Browser and everyday utilities',
    description: 'Device testers, recorders, timers, typing tests and quick random tools.',
  },
} as const satisfies Record<string, { name: string; h1: string; description: string }>;

export type CategoryId = keyof typeof CATEGORIES;

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

export function isCategoryId(value: string): value is CategoryId {
  return Object.hasOwn(CATEGORIES, value);
}
