import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'A photo can look upright on your phone and still arrive sideways on a form or a computer, because phones often store the rotation as a separate tag that some software ignores. This tool turns the pixels themselves, so the image is the right way up everywhere. You can also mirror a selfie or flip an image top to bottom, and see the result before you save.',
  howTo: [
    'Choose an image (JPG, PNG, WebP, AVIF, BMP or GIF).',
    'Use Left or Right to turn it in 90° steps, and tick a flip if you need one. The preview shows the result.',
    'Select "Save image", check the report, then download.',
  ],
  options: [
    {
      name: 'Left and Right',
      description:
        'Each press turns the image a quarter turn. The preview starts at one turn to the right, the most common fix for a sideways phone photo.',
    },
    {
      name: 'Flip left to right',
      description:
        'Mirrors the image, as front cameras do. Useful when text in a selfie reads backwards.',
    },
    {
      name: 'Flip top to bottom',
      description: 'Turns the image upside down as a mirror, not a rotation.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 3000 × 4000 px document photo that shows up sideways on a form',
    settings: 'Right (90°)',
    output: 'A 4000 × 3000 px JPG that is upright in every app',
  },
  limits: [
    'JPG images are saved again at high quality (95%), so the file size may change slightly.',
    'Rotation is in 90° steps; straightening by a few degrees is not supported yet.',
    'Location and camera details (EXIF) are removed from the saved image.',
  ],
  faqs: [
    {
      question: 'Why does my photo look fine on my phone but sideways after upload?',
      answer:
        'Phones save the photo as the sensor captured it plus a tag saying how to turn it. Some portals and older software ignore the tag. Saving it here turns the actual pixels, so the tag is no longer needed.',
    },
    {
      question: 'Is my photo uploaded?',
      answer: 'No. Everything runs in your browser on your own device.',
    },
  ],
});
