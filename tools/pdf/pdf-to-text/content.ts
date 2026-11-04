import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Copying text from a PDF viewer often scrambles lines and columns, and long documents take ages to select. This tool reads the text layer of every page and saves it as a plain .txt file in reading order, with an optional marker before each page. If some pages are scanned images with no text layer, the report names them, so you know they need OCR rather than silently getting blank pages.',
  howTo: [
    'Choose a PDF.',
    'Keep "All pages" or choose the pages you need.',
    'Choose whether to mark where each page starts.',
    'Select "Extract text", check the report, then download the .txt file.',
  ],
  options: [
    {
      name: 'Page markers',
      description:
        'Adds a line such as "--- Page 3 ---" before each page, so you can find where text came from.',
    },
    {
      name: 'Pages',
      description: 'Extract every page, or type pages and ranges such as 2-5, 9.',
    },
  ],
  limits: [
    'Scanned pages are pictures of text and contain no text layer; they come out empty and are listed in the report. Use OCR for those.',
    'Reading order follows the PDF. Complex layouts such as multi-column pages or tables may need tidying.',
    'Password-protected PDFs must be unlocked first.',
  ],
  faqs: [
    {
      question: 'Why is my extracted text empty?',
      answer:
        'The PDF is probably a scan: the pages are images, not text. The report lists such pages. Use an OCR tool to recognise the text.',
    },
    {
      question: 'Does it keep formatting such as bold or tables?',
      answer:
        'No. The result is plain text with line breaks. It is ideal for copying, searching and pasting into other documents.',
    },
  ],
});
