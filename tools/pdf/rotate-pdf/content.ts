import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To rotate a PDF and save it, choose the file, pick a direction for all pages or only the ones you list, and download. Scanned forms and phone scans often come out sideways or upside down, and many viewers only rotate the page on screen without saving it. This tool turns the pages inside the file itself, so they open the right way up everywhere, in email, on a portal and when printed. Choose all pages or just the ones that need it; the rest stay exactly as they were.',
  howTo: [
    'Choose a PDF.',
    'Pick the direction: right (90° clockwise), upside down (180°) or left (90° anticlockwise).',
    'Keep "All pages" or choose specific pages, such as 2, 5-7.',
    'Select "Rotate PDF", check the report, then download.',
  ],
  options: [
    {
      name: 'Direction',
      description:
        'Rotation is added to how each page is currently turned, so rotating a sideways page right twice makes it upside down.',
    },
    {
      name: 'Pages',
      description:
        'Rotate every page, or type pages and ranges separated by commas. "8-" means page 8 to the end.',
    },
  ],
  limits: [
    'Password-protected PDFs must be unlocked first.',
    'Rotation is lossless: page content is not re-drawn or re-compressed.',
    'Up to 2000 pages and 250 MB on a computer, 100 MB on a phone.',
  ],
  faqs: [
    {
      question: 'How do I rotate a PDF and save it permanently?',
      answer:
        'Rotate it here and download the result. The rotation is written into the PDF itself, not just the view, so it stays the right way up in every viewer, on every device and after upload.',
    },
    {
      question: 'How do I rotate only one page of a PDF?',
      answer:
        'Type that page number in Pages, for example 3, and choose the direction. Only that page turns. To fix several pages in different directions, Organize PDF lets you turn each page separately.',
    },
    {
      question: 'Is the rotation permanent?',
      answer:
        'Yes. The rotation is saved in the downloaded PDF, so it opens the right way in every viewer.',
    },
    {
      question: 'Does rotating reduce quality?',
      answer: 'No. Only the page orientation changes; text and images are untouched.',
    },
  ],
});
