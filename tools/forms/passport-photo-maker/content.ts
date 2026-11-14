import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To make a passport photo online, choose the document, take or pick a photo against a plain light wall, and fit your head into the guide. Passport and visa photos are rejected for small reasons: the wrong print size, a head that is too big or too small, or a file outside the upload limits. The tool makes the photo at the exact size from the official requirements, which we read from the government source and list with the date we checked it.',
  howTo: [
    'Choose the document: Indian passport, Indian visa, US passport or visa, or UK passport.',
    'Choose a recent, sharp photo of your face against a plain light wall, taken from about 1.5 metres away.',
    'Move and zoom the frame until your head fills the dashed oval: top of the hair at its top, chin at its bottom.',
    'Select "Make photo", check the report, then download. For printed photos, print at 100% (no "fit to page").',
  ],
  options: [
    {
      name: 'Indian passport (printed)',
      description:
        '3.5 cm wide by 4.5 cm high, in colour, on a plain white background, as stated in the Passport Seva application instruction booklet. Needed only for applications not made at a Passport Seva Kendra.',
    },
    {
      name: 'Indian visa (online upload)',
      description:
        'A square JPG between 350 and 1000 pixels a side and between 10 KB and 300 KB, as stated in the photo guide on indianvisaonline.gov.in. The tool makes a 600 × 600 px file inside that range.',
    },
    {
      name: 'US passport or visa',
      description:
        '2 × 2 inches (51 × 51 mm), with the head 1 to 1 3/8 inches (25 to 35 mm) from the chin to the top of the head, as stated by the US State Department.',
    },
    {
      name: 'UK passport (printed)',
      description:
        '35 mm wide by 45 mm high, with 29 to 34 mm from the chin to the crown of the head, on a plain cream or light grey background, as stated on GOV.UK.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 3000 × 4000 px phone photo taken against a white wall',
    settings: 'Indian passport (printed), head fitted to the guide',
    output: 'An 827 × 1063 px JPG at 600 DPI, which prints at exactly 3.5 × 4.5 cm',
  },
  limits: [
    'The background is not changed or removed. Use a plain light wall and even light, with no shadows behind you.',
    'Lighting, expression, glasses and head covering cannot be checked automatically. Compare with the official rules.',
    'Only these four documents are offered, because we list a size only after reading it on the official source. For other sizes, use the Form Photo Resizer.',
    'Requirements change. Each one shows the date we checked it; confirm on the official site before you apply.',
  ],
  faqs: [
    {
      question: 'What size is a passport photo in the US, UK and India?',
      answer:
        'US: 2 x 2 inches (51 x 51 mm). UK: 35 x 45 mm. India: 35 x 45 mm (3.5 x 4.5 cm). Choose the country here and the tool sets the size and where your head goes.',
    },
    {
      question: 'Can I take a passport photo at home with my phone?',
      answer:
        'Yes. Stand facing the camera in front of a plain light wall, in even daylight with no shadows, and have someone take the photo from about 1.5 m away at head height. Then choose it here and fit your head into the guide.',
    },
    {
      question: 'How do I print it at the right size?',
      answer:
        'The file carries its DPI, so it prints at the correct size when printed at 100% (actual size). Photo shops can print it on a 4 × 6 inch sheet; the ID and Photo Sheet Maker will put several copies on one sheet.',
    },
    {
      question: 'Is my photo uploaded?',
      answer:
        'No. The photo is made in your browser, on your device. Nothing is sent to our servers.',
    },
    {
      question: 'Do I need a photo for my Indian passport application at a Passport Seva Kendra?',
      answer:
        'The official instruction booklet says a photograph is not required for applications submitted at a Passport Seva Kendra or Post Office Passport Seva Kendra, where your photo is taken. Printed photos are for applications submitted elsewhere.',
    },
  ],
  variants: [
    {
      slug: 'indian-passport-photo',
      preset: 'india-passport-photo-print',
      label: 'Indian passport',
      h1: 'Make an Indian passport photo (3.5 × 4.5 cm)',
      seoTitle: 'Indian passport photo 3.5 × 4.5 cm online, free | NiftyFix',
      seoDescription:
        'Make an Indian passport size photo at 3.5 × 4.5 cm with a white background guide, ready to print. Free, and nothing is uploaded.',
      intro:
        'The Passport Seva instruction booklet asks for a recent colour photo, 4.5 cm long by 3.5 cm wide, on a plain white background, with your head in the centre and both ears visible. This page opens with that size chosen and makes a print-ready file at 600 DPI.',
      faqs: [
        {
          question: 'What background is allowed?',
          answer:
            'Plain white, as the booklet states. The dress should be in a dark colour, and black-and-white photos are not accepted.',
        },
      ],
    },
    {
      slug: 'indian-visa-photo',
      preset: 'india-visa-photo-online',
      label: 'Indian visa',
      h1: 'Make an Indian visa photo for online upload',
      seoTitle: 'Indian visa photo: square JPG 10 to 300 KB, free | NiftyFix',
      seoDescription:
        'Make a square Indian visa photo between 350 and 1000 pixels and 10 to 300 KB, as the online visa form requires. Free, nothing uploaded.',
      intro:
        'The official Indian visa photo guide requires a JPEG whose height and width are equal, between 350 and 1000 pixels, and between 10 KB and 300 KB. This page opens with those rules set and checks every one on the finished file.',
      faqs: [
        {
          question: 'Does this also work for the Indian e-Visa?',
          answer:
            'The guide we checked covers the regular online visa form. The e-Visa may state different limits; check its upload page before you apply.',
        },
      ],
    },
    {
      slug: 'us-passport-photo-2x2',
      preset: 'us-passport-photo',
      label: 'US 2 × 2 inch',
      h1: 'Make a US passport or visa photo (2 × 2 inch)',
      seoTitle: 'US passport photo 2x2 inch online, free | NiftyFix',
      seoDescription:
        'Make a 2 × 2 inch US passport or visa photo with the head 1 to 1 3/8 inches tall, ready to print. Free, and nothing is uploaded.',
      intro:
        'US passport photos must be 2 × 2 inches, in colour, with the head between 1 inch and 1 3/8 inches from the bottom of the chin to the top of the head. This page opens with that size and shows a guide for the head height.',
      faqs: [
        {
          question: 'How recent must the photo be?',
          answer:
            'Taken within the last 6 months, in colour, and printed on photo quality paper, as the State Department states. Snapshots, magazine photos, low quality phone photos and full-length photos are not accepted, so use a sharp, evenly lit photo.',
        },
      ],
    },
    {
      slug: 'uk-passport-photo',
      preset: 'uk-passport-photo-print',
      label: 'UK passport',
      h1: 'Make a UK passport photo (35 × 45 mm)',
      seoTitle: 'UK passport photo 35 × 45 mm online, free | NiftyFix',
      seoDescription:
        'Make a printed UK passport photo at 35 × 45 mm with the head 29 to 34 mm tall, on a cream or light grey background. Free, nothing uploaded.',
      intro:
        'GOV.UK asks for printed photos 45 mm high by 35 mm wide, with 29 to 34 mm from the chin to the crown of the head, against a plain cream or light grey background. This page opens with that size and a guide for the head height.',
      faqs: [
        {
          question: 'Is this for the online UK passport application?',
          answer:
            'No. The online application has its own digital photo rules on a separate GOV.UK page. This makes the printed photo used for paper applications.',
        },
      ],
    },
  ],
});
