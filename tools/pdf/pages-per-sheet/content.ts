import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To print several PDF pages on one sheet, choose the PDF, pick 2, 4, 6 or 9 pages per sheet, and download a PDF that prints that way on any printer. Printing a 200-page set of notes or previous year papers one page per sheet costs a lot at a print shop. With several pages on every sheet, in reading order, it prints on a fraction of the paper. Or make a booklet: pages are reordered so that a double-sided print folds in half and reads in order. The pages are placed as they are, not turned into pictures, so text stays sharp and searchable.',
  howTo: [
    'Choose a PDF.',
    'Pick how many pages go on each sheet, or "Booklet".',
    'Choose A4 or US Letter, and whether to draw a thin frame around each page.',
    'Select the button, check the report, then download and print at 100% scale.',
  ],
  options: [
    {
      name: 'Pages per sheet',
      description:
        'The sheet turns to landscape or portrait automatically, whichever shows your pages largest. 2 per sheet keeps text easy to read; 4 is common for notes; 6 and 9 suit slides.',
    },
    {
      name: 'Booklet',
      description:
        'Two pages on each side of the paper in fold order, with blank pages added at the end if needed. Print double-sided with "flip on short edge", stack, and fold in half.',
    },
    {
      name: 'Thin frame',
      description: 'A light grey line around each page, which helps when pages have white edges.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 120-page PDF of class notes',
    settings: '4 pages per sheet, A4',
    output: 'A 30-sheet PDF: a quarter of the paper, text still sharp',
  },
  limits: [
    'One PDF at a time, up to 250 MB on a computer and 100 MB on a phone.',
    'Links and fillable form fields do not carry over to the new sheets; the page content does.',
    'The orientation is chosen from the first page. Pages of other shapes are scaled to fit their space without stretching.',
    'Password-protected PDFs cannot be opened.',
  ],
  faqs: [
    {
      question: 'How do I print 2 pages per sheet from a PDF?',
      answer:
        'Choose 2 pages per sheet and download. The new PDF already has two pages on each sheet, so print it normally at 100% or Fit, double-sided if you like, from any printer or print shop.',
    },
    {
      question: 'Will the text still be readable at 4 pages per sheet?',
      answer:
        'Each page is shrunk to about half its width, like a printer\'s "4 pages per sheet" setting. Normal 11 to 12 point text stays readable; small footnotes get tiny. Try 2 per sheet if in doubt.',
    },
    {
      question: 'How do I print the booklet?',
      answer:
        'Print the whole file double-sided and choose "flip on short edge" (sometimes called "short-edge binding"). Keep the sheets in order, fold the stack in half, and staple along the fold.',
    },
    {
      question: 'Is my PDF uploaded?',
      answer:
        'No. The pages are arranged in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
  variants: [
    {
      slug: 'pdf-booklet',
      preset: 'booklet',
      label: 'PDF booklet',
      h1: 'Make a booklet from a PDF',
      seoTitle: 'PDF Booklet Maker: print and fold in order, free | NiftyFix',
      seoDescription:
        'Turn a PDF into a booklet: pages reordered 2 per side so a double-sided print folds in half and reads in order. Free, nothing uploaded.',
      intro:
        'A booklet needs its pages in a special order: on the first sheet, the last page sits next to page 1, and so on. This page does that for you. It puts two pages on each side of the paper, adds blank pages at the end if the count is not a multiple of 4, and keeps the text sharp. Print double-sided with "flip on short edge", fold the stack in half and staple along the fold: a programme, a small magazine, a wedding card insert or a study booklet.',
      faqs: [
        {
          question: 'Why were blank pages added?',
          answer:
            'Each folded sheet holds 4 pages, so a booklet needs a multiple of 4. Up to 3 blank pages are added at the end to make it fold evenly.',
        },
      ],
    },
  ],
});
