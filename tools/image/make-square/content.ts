import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    "To make a photo square without cropping, choose it and pick a background: the whole picture fits inside the square. WhatsApp, Instagram and shopping sites show photos as squares, so a tall or wide photo gets its head or edges cut off. This tool keeps the whole photo and fills the empty space instead: plain white, black, any colour, or a soft blurred copy of the photo itself. Or keep the photo's shape and add an even border around it. Nothing is cropped or stretched.",
  howTo: [
    'Choose an image, or several: each gets the same settings.',
    'Pick "Make square" or "Add border", and how much space to add.',
    'Choose the background: white, black, blurred or your own colour.',
    'Select "Save image", check the report, then download.',
  ],
  options: [
    {
      name: 'Make square',
      description:
        'The longer side stays as it is and the shorter side is padded, so the whole photo fits in a square. Add extra space if you want a margin all round.',
    },
    {
      name: 'Add border',
      description:
        "Keeps the photo's shape and adds an even frame on every side, sized as a percentage of the longer side so it looks the same on any photo.",
    },
    {
      name: 'Background',
      description:
        'White suits product photos and documents. "Blurred" fills the space with a soft copy of your photo, the look Instagram users call "no crop".',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 3000 x 4000 portrait photo for a WhatsApp profile picture',
    settings: 'Make square, no extra space, blurred background',
    output: 'A 4000 x 4000 square with the whole photo in the middle',
  },
  limits: [
    'Up to 50 images at once, 60 MB each on a computer and 30 MB on a phone.',
    'Very large results are scaled down to about 16 megapixels so they open on phones; you will see a note when this happens.',
    'Transparent PNG areas are filled with the background you choose. Animated GIFs use their first frame.',
  ],
  faqs: [
    {
      question: 'How do I post a full photo on Instagram without cropping?',
      answer:
        'Make it square here with a white or blurred background, then post it. Instagram shows the whole picture, with nothing cut off at the edges.',
    },
    {
      question: 'How do I put a full photo as my WhatsApp DP without cropping?',
      answer:
        'Choose the photo, keep "Make square" with a white or blurred background, and save. WhatsApp then shows the whole photo instead of cutting the top and bottom.',
    },
    {
      question: 'Will this make my photo blurry?',
      answer:
        'No. Your photo keeps its full resolution; only the background fill is blurred when you choose "Blurred".',
    },
    {
      question: 'Are my photos uploaded?',
      answer:
        'No. Everything happens in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
  variants: [
    {
      slug: 'add-border-to-photo',
      preset: 'border',
      label: 'Add border to photo',
      h1: 'Add a border to a photo',
      seoTitle: 'Add Border to Photo: white or colour frame, free | NiftyFix',
      seoDescription:
        'Add an even white, black or colour border around any photo, keeping its shape and full quality. Several photos at once. Free, nothing uploaded.',
      intro:
        "Add an even frame around a photo for printing, posting or a cleaner look. The border is a percentage of the photo's longer side, so it looks the same on every photo in a batch, and the photo itself is not cropped, stretched or recompressed more than needed. Choose white, black or any colour.",
      faqs: [
        {
          question: 'How wide should a white border be?',
          answer:
            'Around 3 to 5% looks like a classic photo print; 10% or more gives a gallery-style mat. You can see it in the preview before saving.',
        },
      ],
    },
  ],
});
