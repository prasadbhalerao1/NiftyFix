import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To split a PDF, choose it, then cut it every N pages (N = 1 gives one file per page) or type the page ranges you want. Some portals accept one document per upload, and a single scan of all your certificates will not do. Every part is opened again to check its pages, and all parts download together as a ZIP named in page order.',
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
      question: 'How do I split a PDF into separate pages?',
      answer:
        'Choose the PDF, pick Every N pages and set N to 1. Every page becomes its own PDF, numbered in page order, and they all download in one ZIP.',
    },
    {
      question: 'How do I split a PDF into two files?',
      answer:
        'Choose By ranges and type two ranges, for example 1-5, 6- (6- means page 6 to the end). You get two PDFs. To save only some pages as one new file, Extract PDF Pages is quicker.',
    },
    {
      question: 'Can I split a PDF without Adobe Acrobat?',
      answer:
        'Yes. Splitting here is free, runs in any modern browser on Windows, Mac, iPhone or Android, and never uploads your file.',
    },
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
