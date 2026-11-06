import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Offices, banks and colleges often want the front and back of a card on one page, and forms sometimes allow only one image where you have two. Add your photos, put them in order, and join them into a single image: one under another, side by side, or in a grid. The "ID card front and back on A4" layout places each image at the real size of an Aadhaar, PAN or driving licence card (85.6 x 54 mm) on an A4 page at 300 DPI, so it prints at the right size.',
  howTo: [
    'Choose 2 to 20 images. For a card, crop the front and back photos to the card edges first.',
    'Put them in order with the arrows.',
    'Choose how to arrange them, the space between them and the format.',
    'Select "Combine images", check the report, then download.',
  ],
  options: [
    {
      name: 'Arrange',
      description:
        '"One under another" matches every image to the narrowest width; "Side by side" matches them to the shortest height. "Grid" puts them in equal cells. Nothing is enlarged or stretched.',
    },
    {
      name: 'ID card front and back on A4',
      description:
        'Each image is fitted to 85.6 x 54 mm, the size of Aadhaar, PAN and most ID cards, and centred on an A4 page with optional cutting guides. Print at 100% scale, not "fit to page".',
    },
    {
      name: 'Format',
      description:
        'JPG keeps the file small for sharing and uploading. PNG keeps sharp text and transparent areas.',
    },
  ],
  example: {
    title: 'Example',
    input: 'Two phone photos: the front and back of an Aadhaar card, cropped to the card',
    settings: 'ID card front and back on A4, cutting guides on, JPG',
    output: 'One A4 page at 300 DPI with both sides at real card size, ready to print',
  },
  limits: [
    'From 2 to 20 images, 60 MB each on a computer and 30 MB on a phone.',
    'A very large result is scaled down to about 16 megapixels so it opens on phones; you will see a note when this happens.',
    'Animated GIFs use their first frame. iPhone HEIC photos are not supported yet; share them as JPEG instead.',
    'For a PDF with one image per page, use JPG to PDF instead.',
  ],
  faqs: [
    {
      question: 'How do I put the Aadhaar card front and back on one page?',
      answer:
        'Crop each side to the card edges with Crop Image, add both photos here, choose "ID card front and back on A4" and download. Print at 100% scale and both sides come out at the real card size.',
    },
    {
      question: 'Will my photos lose quality?',
      answer:
        'Images are never enlarged; larger ones are scaled down to match the smallest. JPG output is saved at high quality, and PNG is lossless.',
    },
    {
      question: 'Are my photos uploaded?',
      answer:
        'No. The images are combined in your browser, in an isolated frame that cannot connect to other sites. That matters for ID cards.',
    },
  ],
  variants: [
    {
      slug: 'aadhaar-front-back-one-page',
      preset: 'id-a4',
      label: 'Aadhaar front and back on one page',
      h1: 'Aadhaar card front and back on one page',
      seoTitle: 'Aadhaar front and back on one page (A4, print) | NiftyFix',
      seoDescription:
        'Put both sides of your Aadhaar, PAN or ID card on one A4 page at real card size, ready to print or photocopy. Free, private, nothing uploaded.',
      intro:
        'Banks, offices and colleges often ask for a copy of your Aadhaar with the front and back on the same page. Add a photo of each side, cropped to the card edges, and this page places both at the real card size (85.6 x 54 mm) on an A4 sheet at 300 DPI, one under the other with thin cutting guides. Print it at 100% scale. It works the same way for a PAN card, voter ID or driving licence. Your card photos stay on your device.',
      faqs: [
        {
          question: 'Why does my printed card come out too big or too small?',
          answer:
            'The printer is scaling the page. In the print dialog choose "Actual size" or 100% instead of "Fit to page".',
        },
        {
          question: 'Should I mask my Aadhaar number?',
          answer:
            'Where the full number is not needed, UIDAI recommends a masked Aadhaar, which shows only the last 4 digits. You can download it from the UIDAI website.',
        },
      ],
    },
  ],
});
