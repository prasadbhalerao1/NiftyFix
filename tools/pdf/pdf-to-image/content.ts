import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Some upload forms accept only images, and some apps cannot show a PDF at all. This tool draws each page of your PDF as an image — JPG for small files, PNG for perfectly crisp text — at the resolution you pick. One page downloads as a single image; several come together in a ZIP, named in page order. Each image is checked for its exact pixel size before you download.',
  howTo: [
    'Choose a PDF.',
    'Pick JPG or PNG and the resolution: 72 DPI for screens, 150 for most uses, 300 for printing.',
    'Keep "All pages" or choose the pages you need.',
    'Select "Convert to images", check the report, then download.',
  ],
  options: [
    {
      name: 'Format',
      description:
        'JPG makes much smaller files and suits photos and scans. PNG is lossless: best for text, diagrams and screenshots.',
    },
    {
      name: 'Resolution (DPI)',
      description:
        'Dots per inch of the page. An A4 page at 150 DPI is about 1240 × 1754 pixels; at 300 DPI it is about 2480 × 3508.',
    },
    {
      name: 'Pages',
      description: 'Convert every page, or type pages and ranges such as 1, 3-5.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 2-page marksheet PDF',
    settings: 'JPG, 150 DPI, page 1',
    output: 'One JPG of about 1240 × 1754 pixels',
  },
  limits: [
    'Very large pages are drawn at a lower resolution so they fit in memory; the report says when this happens.',
    'Password-protected PDFs must be unlocked first.',
    'Rare colour effects that need a full browser page (transfer functions) are skipped, so a few unusual PDFs may show slightly different colours.',
  ],
  faqs: [
    {
      question: 'Which resolution should I choose?',
      answer:
        '150 DPI is sharp on screens and fine for most uploads. Use 300 DPI only for printing; the files are about four times larger.',
    },
    {
      question: 'Is my PDF uploaded?',
      answer:
        'No. Pages are drawn in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
});
