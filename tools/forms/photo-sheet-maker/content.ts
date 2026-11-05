import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Forms, admissions, SIM cards and ID cards often want several printed passport photos. Instead of paying a studio again, put many copies on one sheet and print it at any photo shop or at home. The tool fits as many photos as the paper allows, turning the sheet sideways when that fits more, and adds thin guides to cut along.',
  howTo: [
    'Choose a photo. For the best result, make it in the Passport Photo Maker first so the head size is right.',
    'Pick the photo size and the paper: 4 × 6 inch photo paper, 5 × 7 inch, or A4.',
    'Frame the photo; every copy uses the same frame. Change the number of copies if you need fewer.',
    'Select "Make sheet", download it, and print at 100% (actual size), not "fit to page".',
  ],
  options: [
    {
      name: 'Photo size',
      description:
        '3.5 × 4.5 cm for Indian and UK passports, or 2 × 2 inch for US passports and visas, the sizes we verified on the official sources.',
    },
    {
      name: 'Paper',
      description:
        '4 × 6 inch is the standard photo print that shops print cheaply and fits 8 passport photos. A4 fits 30 and suits a home printer with photo paper.',
    },
    {
      name: 'Cutting guides',
      description:
        'A light grey line just outside each photo, so you can cut straight without trimming into the photo.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A passport photo made with the Passport Photo Maker',
    settings: '3.5 × 4.5 cm on 4 × 6 inch paper, 8 copies',
    output: 'A 1800 × 1200 px JPG at 300 DPI with 8 photos in two rows',
  },
  limits: [
    'The sheet is made at 300 DPI, the usual resolution for photo prints.',
    'A US 2 × 2 inch photo fits only 2 times on 4 × 6 paper, because 3 would leave no margin for the printer; A4 fits more.',
    'Some home printers cannot print right to the edge; a 3 mm margin is left on every side.',
  ],
  faqs: [
    {
      question: 'Why are my printed photos the wrong size?',
      answer:
        'The print settings scaled the sheet. Choose 100%, "actual size" or "no scaling" in the print dialog, and tell the shop to print 4 × 6 without cropping. Measure one photo afterwards with a ruler.',
    },
    {
      question: 'Is my photo uploaded?',
      answer:
        'No. The sheet is made in your browser, on your device. Nothing is sent to our servers.',
    },
  ],
  variants: [
    {
      slug: 'passport-photo-a4-sheet',
      preset: 'a4',
      label: 'A4 sheet',
      h1: 'Print 30 passport photos on one A4 sheet',
      seoTitle: 'Passport size photos on A4 sheet (30 photos), free | NiftyFix',
      seoDescription:
        'Make an A4 sheet of 30 passport size photos (3.5 × 4.5 cm) with cutting guides, ready for your home printer. Free, nothing uploaded.',
      intro:
        'An A4 page holds 30 passport photos of 3.5 × 4.5 cm in five columns and six rows. This page opens with A4 chosen; print on photo paper at 100% scale and cut along the guides.',
      faqs: [
        {
          question: 'What paper should I use at home?',
          answer:
            'Glossy or matte photo paper gives a proper photo finish. Plain paper is usually not accepted for official photos.',
        },
      ],
    },
  ],
});
