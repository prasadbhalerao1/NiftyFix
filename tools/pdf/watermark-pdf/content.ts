import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'A watermark says what a document is for. Marking a copy of your ID "Only for bank KYC, 2026" limits how it can be misused, and "DRAFT" or "CONFIDENTIAL" tells readers how to treat a report. This tool draws your text across the centre of each page, sized so it always fits, at the transparency and colour you choose.',
  howTo: [
    'Choose a PDF.',
    'Type the watermark text, for example "Copy for passport application only".',
    'Choose diagonal or horizontal, the colour and how see-through it should be.',
    'Select "Add watermark", check the report, then download.',
  ],
  options: [
    {
      name: 'Text',
      description:
        'Up to 100 characters. Long text is made smaller automatically so it never runs off the page.',
    },
    {
      name: 'Opacity',
      description:
        'How solid the text is. Around 20–30% keeps the page readable while the watermark stays visible.',
    },
    {
      name: 'Layout',
      description: 'Diagonal across the page, or horizontal through the middle.',
    },
  ],
  limits: [
    'The watermark uses a standard Latin font; text in other scripts is not supported yet.',
    'The watermark is drawn on top of the page content. It deters misuse but can be removed by someone with PDF editing software.',
    'Image and logo watermarks are not supported yet.',
  ],
  faqs: [
    {
      question: 'Should I watermark copies of my ID documents?',
      answer:
        'It is a sensible habit: writing the purpose and date on the copy makes it much harder to reuse for something else.',
    },
    {
      question: 'Can the watermark be removed?',
      answer:
        'Someone with PDF editing tools could remove it. For stronger protection, print the watermarked file to a new PDF, which flattens it into the page.',
    },
  ],
});
