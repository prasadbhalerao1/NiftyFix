import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To resize an image, choose it, type the new width and height in pixels, percent, centimetres or inches, and download. Proportions are kept unless you choose otherwise, and if you change the shape you decide whether the edges are cropped, borders are added or the image is stretched. The new file is measured before you download it.',
  howTo: [
    'Choose an image (JPG, PNG, WebP, AVIF, BMP or GIF).',
    'Pick how to resize: pixels, percentage, centimetres or inches.',
    'Enter the new width or height; with Keep proportions on, the other side follows.',
    'Select "Resize image", check the report, then download.',
  ],
  options: [
    {
      name: 'Pixels, percentage, centimetres, inches',
      description:
        'Pixels are what screens and most upload forms use. Centimetres and inches are converted to pixels at the DPI you enter, and the DPI is written into JPG files so they print at that size.',
    },
    {
      name: 'Keep proportions',
      description:
        'On by default: change the width and the height follows, so nothing looks squashed. Turn it off to enter both sides yourself.',
    },
    {
      name: 'If the shape changes',
      description:
        'Fill and crop the edges keeps the centre and trims what does not fit. Fit inside adds white (or transparent) borders. Stretch squashes the image to the new shape.',
    },
    {
      name: 'Format',
      description:
        'Same as original keeps JPG, PNG and WebP. AVIF, BMP and GIF images become JPG, or PNG when they have transparent areas.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 4000 × 3000 px phone photo',
    settings: 'Pixels, width 1200, Keep proportions on',
    output: 'A 1200 × 900 px JPG, about a tenth of the original file size',
  },
  limits: [
    'Enlarging an image cannot add detail; the tool warns you when the result may look soft.',
    'The largest output is 50 megapixels, so browsers on phones do not run out of memory.',
    'Location and camera details (EXIF) are removed from the resized image.',
    'Animated GIFs become a single still image.',
  ],
  faqs: [
    {
      question: 'How do I resize an image without losing quality?',
      answer:
        'Making an image smaller keeps it sharp. Making it bigger cannot add detail that was never there, so enlarge only a little, and choose PNG if you want no compression at all.',
    },
    {
      question: 'How do I resize an image to 50 KB or 100 KB?',
      answer:
        'Resizing changes pixels, which changes KB only indirectly. For a KB limit use Compress Image with Target size, or the Form Photo Resizer when a form gives both pixels and KB.',
    },
    {
      question: 'Will resizing reduce the file size?',
      answer:
        'Making an image smaller in pixels usually makes the file much smaller too. If you need a specific KB limit, use Compress Image, which finds the best quality under your limit.',
    },
    {
      question: 'How do I get a photo at 3.5 × 4.5 cm?',
      answer:
        'Choose Centimetres, turn off Keep proportions, enter 3.5 and 4.5, and set the DPI your form asks for (often 200 or 300). Fill and crop keeps the centre of your photo. For exam forms with a KB range as well, the Form Photo Resizer does all of it in one step.',
    },
  ],
  variants: [
    {
      slug: 'resize-image-in-cm',
      preset: 'unit-cm',
      label: 'In cm',
      h1: 'Resize an image in centimetres',
      seoTitle: 'Resize image in cm online (photo size in cm), free | NiftyFix',
      seoDescription:
        'Resize a photo to an exact size in centimetres at the DPI you need, such as 3.5 × 4.5 cm at 300 DPI. Free, and nothing is uploaded.',
      intro:
        'Printed photos and some forms give sizes in centimetres. This page opens in centimetres: enter the width and height and the DPI, and the tool converts them to exact pixels and writes the DPI into the JPG so it prints at that size.',
      faqs: [
        {
          question: 'What DPI should I use?',
          answer:
            '300 DPI is the usual choice for printing. Some application forms ask for 200 DPI; use whatever your form states. The pixel size is shown before you resize.',
        },
      ],
    },
  ],
});
