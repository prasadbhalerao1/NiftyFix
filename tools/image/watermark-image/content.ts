import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'A watermark says who a picture belongs to, or limits what a copy can be used for. Photographers add a small credit in a corner; people sharing an ID or certificate add "For verification only" across it so the copy cannot be reused elsewhere. This tool adds text in a corner, in the centre, or repeated across the whole image, at the size and strength you choose.',
  howTo: [
    'Choose an image (JPG, PNG, WebP, AVIF, BMP or GIF), or up to 50 at once: each gets the same settings, and they download together as a ZIP.',
    'Type the text and pick where it goes.',
    'Adjust the colour, size and opacity.',
    'Select "Add watermark", check the report, then download.',
  ],
  options: [
    {
      name: 'Position',
      description:
        'A corner for a discreet credit, the centre for a single clear mark, or repeated across the image so it cannot be cropped out.',
    },
    {
      name: 'Text size',
      description:
        "A percentage of the image's shorter side, so the watermark looks the same on small and large images.",
    },
    {
      name: 'Opacity',
      description:
        'How solid the text is. Around 25 to 35% keeps the picture readable underneath; 60% or more for a corner credit.',
    },
    {
      name: 'Colour',
      description:
        'White suits most photos and black suits scans on white paper. Every colour has a faint outline in the opposite tone, so it stays readable on busy backgrounds.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A photo of an Aadhaar or PAN card to send to a landlord',
    settings: '"For rental agreement only, 5 Nov 2026", repeated, grey, 30%',
    output: 'The same image with the purpose written across it, so the copy is hard to misuse',
  },
  limits: [
    'A watermark discourages misuse; it cannot make a copy impossible to edit.',
    "Text uses your device's fonts. Hindi, Marathi and other scripts work when your device has a font for them, as most phones and computers do.",
    'Location and camera details (EXIF) are removed from the watermarked image.',
  ],
  faqs: [
    {
      question: 'Should I watermark ID copies I send to others?',
      answer:
        'It is a common precaution: write who the copy is for, the purpose and the date across it. If the copy is misused, the watermark shows it was given for something else.',
    },
    {
      question: 'Is my image uploaded?',
      answer: 'No. The watermark is added in your browser, on your device.',
    },
  ],
});
