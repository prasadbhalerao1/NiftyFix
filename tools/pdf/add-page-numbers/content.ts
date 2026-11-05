import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Theses, reports, legal bundles and application packs usually need numbered pages, and merged documents rarely have them. This tool stamps a number on each page in the corner or centre you choose, in a plain style such as "3" or "Page 3 of 10". Numbers stay upright even on rotated pages, you can start from any number, and you can skip a cover page.',
  howTo: [
    'Choose a PDF.',
    'Pick where the number goes and its style.',
    'Optionally change the first number, or number only some pages (for example "2-" to skip the cover).',
    'Select "Add page numbers", check the report, then download.',
  ],
  options: [
    {
      name: 'Position',
      description:
        'Bottom or top of the page; left, centre or right. Margins are measured from the visible page edge.',
    },
    {
      name: 'Style',
      description:
        '"1", "Page 1", "1 of 10" or "Page 1 of 10". The total counts the numbered pages.',
    },
    {
      name: 'Start at',
      description:
        'The number shown on the first numbered page, useful when this file continues a longer document.',
    },
    {
      name: 'Pages',
      description:
        'Number every page, or only some. Typing "2-" leaves the cover page unnumbered and starts counting on page 2.',
    },
  ],
  limits: [
    'Numbers use a standard Latin font; numbering in other scripts is not supported yet.',
    'Numbers are added on top of the page; they do not move existing content out of the way.',
    'Password-protected PDFs must be unlocked first.',
  ],
  faqs: [
    {
      question: 'Can I skip the first page?',
      answer:
        'Yes. Choose "Choose pages" and type "2-". With "Start at" set to 1, page 2 is numbered 1; set it to 2 to keep the original page numbers.',
    },
    {
      question: 'Will the numbers be upright on landscape or rotated pages?',
      answer: 'Yes. The position and direction follow the page as you see it.',
    },
  ],
});
