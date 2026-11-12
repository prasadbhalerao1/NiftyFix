import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To blur part of an image, choose it, drag a box over what you want to hide, and pick black, white, pixelate or blur. You see the real result as you go, and can move, resize or remove any box. Black boxes are the safe choice for numbers and text, because blur and pixelation can sometimes be undone. The tool can also find Aadhaar numbers by itself and hide the first eight digits. The saved image has no location or camera data, and it never leaves your device.',
  howTo: [
    'Choose a photo or screenshot.',
    'Drag on the picture to draw a box over each private part. Pick black, white, pixelate or blur.',
    'For an Aadhaar card, select "Find and cover Aadhaar numbers", then check the boxes.',
    'Select "Save image" and download it.',
  ],
  options: [
    {
      name: 'Black and white boxes',
      description:
        'Replace everything under the box with solid colour. Nothing can be recovered, so use these for card numbers, addresses, passwords and signatures.',
    },
    {
      name: 'Pixelate and blur',
      description:
        'Soften faces, number plates and backgrounds while keeping the picture natural. Strength sets how coarse or soft the effect is; stronger hides more.',
    },
    {
      name: 'Find and cover Aadhaar numbers',
      description:
        'Reads the text in the image and covers every 12-digit Aadhaar number (and 16-digit Virtual ID): either the first eight digits, like the masked Aadhaar UIDAI issues, or all of them.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A phone photo of an Aadhaar card',
    settings: 'Find and cover Aadhaar numbers, first 8 digits; black box over the QR code',
    output: 'A copy showing only the last four digits, safe to share as ID proof',
  },
  limits: [
    'Faces are not found automatically yet; draw a box over each one.',
    'The number finder reads printed digits. Check its boxes, and draw your own if a number is handwritten, tilted or blurry.',
  ],
  faqs: [
    {
      question: 'Is blurring enough to hide text or numbers?',
      answer:
        'Not always. Researchers have recovered blurred and pixelated text, especially numbers. Black or white boxes replace the pixels completely, so nothing can be recovered from them.',
    },
    {
      question: 'Can someone remove the box later?',
      answer:
        'No. The box is part of the picture itself, not a layer on top, and the saved file is checked to make sure nothing shows through.',
    },
    {
      question: 'Does it remove hidden data such as location?',
      answer:
        'Yes. The saved image contains only the picture: GPS location, camera details and other EXIF data are dropped.',
    },
    {
      question: 'Is my image uploaded?',
      answer:
        'No. Everything, including the number finder, runs in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
  variants: [
    {
      slug: 'mask-aadhaar',
      preset: 'aadhaar',
      label: 'Masked Aadhaar',
      h1: 'Masked Aadhaar: hide the first 8 digits of your Aadhaar',
      seoTitle: 'Masked Aadhaar: hide first 8 digits on your Aadhaar photo, free',
      seoDescription:
        'Make a masked Aadhaar from any Aadhaar photo or scan: the first 8 digits are found and covered automatically. Free, and the image stays on your device.',
      intro:
        'A masked Aadhaar shows only the last four digits of your Aadhaar number, so a copy you share cannot be misused. UIDAI offers a masked e-Aadhaar download; if you already have a photo or scan of your card, choose it here and the first eight digits are found and covered with solid black automatically. Draw an extra box over the QR code too, since it also holds the number.',
      faqs: [
        {
          question: 'Is a masked Aadhaar valid as ID proof?',
          answer:
            'UIDAI issues masked e-Aadhaar for exactly this purpose: it still shows your name, photo and address with only the last four digits. Some services insist on the full number, so check what yours asks for.',
        },
        {
          question: 'Should I also hide the QR code?',
          answer:
            'Yes, if you want the number fully hidden. The QR code on Aadhaar holds your details, including the number; draw a black box over it.',
        },
      ],
    },
  ],
});
