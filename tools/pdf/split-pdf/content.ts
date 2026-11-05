import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Some portals accept one document per upload, and a single scan of all your certificates will not do. Split PDF turns one file into several: one per page, one per fixed number of pages, or one per range you type. Every part is opened again to check its pages, and all parts download together as a ZIP named in page order.',
  howTo: [
    'Choose a PDF.',
    'Choose how to split: every few pages (1 = every page on its own), or by ranges.',
    'For ranges, type each part separated by commas, for example 1-2, 3, 4-6 makes three files.',
    'Select "Split PDF", check the report, then download the ZIP.',
  ],
  options: [
    {
      name: 'Every N pages',
      description:
        'Cuts the document into parts of N pages. With N = 1 you get one PDF per page; the last part may be shorter.',
    },
    {
      name: 'By ranges',
      description:
        'Each comma-separated item becomes its own file: "1-3, 4, 5-" makes three PDFs. "5-" means page 5 to the end.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 6-page scan: application form (pages 1-2), marksheet (3), ID (4-6)',
    settings: 'By ranges: 1-2, 3, 4-6',
    output: 'A ZIP with three PDFs of 2, 1 and 3 pages',
  },
  limits: [
    'At most 500 parts per split.',
    'Password-protected PDFs must be unlocked first.',
    'Each part keeps its pages exactly; bookmarks and form fields are not carried over.',
  ],
  faqs: [
    {
      question: 'How are the files named?',
      answer:
        'After your file and the pages each part contains, for example "scan-pages-1-2.pdf", so they sort in order.',
    },
    {
      question: 'I only need one part. Do I still get a ZIP?',
      answer: 'No. When the split produces a single file, you download that PDF directly.',
    },
  ],
});
