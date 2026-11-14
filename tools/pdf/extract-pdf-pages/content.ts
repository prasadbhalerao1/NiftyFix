import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To extract pages from a PDF, choose it, type the pages you want (for example 1, 4-6) and download them as a new PDF. When a portal wants only your marksheet but it sits on page 4 of a 20-page document, you need just that page as its own PDF. The tool copies exactly those pages into a new file, in the order you typed them, so it can also reorder pages. Text stays selectable and nothing is re-compressed.',
  howTo: [
    'Choose a PDF.',
    'Type the pages to keep, separated by commas, for example 4, or 1-3, 7.',
    'Select "Extract pages", check the report, then download the new PDF.',
  ],
  options: [
    {
      name: 'Pages',
      description:
        'Single pages (5), ranges (2-4), and open ranges ("8-" means 8 to the end, "-3" means 1 to 3). Pages appear in the order you type, so "3, 1, 2" reorders them.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 12-page certificate bundle',
    settings: 'Pages: 4, 9-10',
    output: 'A 3-page PDF containing pages 4, 9 and 10',
  },
  limits: [
    'A page listed twice is included once.',
    'Password-protected PDFs must be unlocked first.',
    'Bookmarks and form fields are not carried over.',
  ],
  faqs: [
    {
      question: 'How do I extract pages from a PDF to make a new PDF?',
      answer:
        'Type the pages in Pages, in the order you want them, and download. You get a new PDF with only those pages; the original file is not changed.',
    },
    {
      question: 'Is my original PDF changed?',
      answer: 'No. You download a new file; the original stays exactly as it was.',
    },
    {
      question: 'How is this different from Split PDF?',
      answer:
        'Extract makes one new PDF from the pages you pick. Split makes several PDFs at once (one per range, or one per page) and gives you a ZIP.',
    },
  ],
});
