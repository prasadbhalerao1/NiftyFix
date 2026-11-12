import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'This tool converts a colour PDF to true grayscale or black and white, so print shops charge the black-and-white rate and printers use only black ink. Unlike tools that turn each page into a picture, it changes the colours inside the PDF itself: text stays sharp, selectable and searchable, drawings stay crisp, and the file usually gets smaller. Every kind of colour is converted, including spot colours, gradients, form fields and comments, and the saved file is checked so that no colour is left.',
  howTo: [
    'Choose a PDF.',
    'Pick Grayscale, Black text or Black & white, and watch the preview of page 1.',
    'Adjust brightness, contrast or the gray formula if you like.',
    'Select "Convert PDF", check the report, then download.',
  ],
  options: [
    {
      name: 'Mode',
      description:
        'Grayscale keeps every shade of gray. Black text makes all text solid black (best for printing notes and forms) and keeps pictures in gray. Black & white makes everything pure black or white, like a photocopy: smallest files, crisp scans.',
    },
    {
      name: 'Gray from',
      description:
        'How colours become gray. Luminance matches how bright colours look. The red channel makes red ink, stamps and margin lines disappear on white paper; the blue channel does the same for blue pen.',
    },
    {
      name: 'Brightness and contrast',
      description:
        'Lighten pale scans or darken faint text. They apply to text, drawings and images alike, and the preview shows the result.',
    },
    {
      name: 'Black below (Black & white)',
      description:
        'The gray level where black starts. Raise it to keep faint lines and pencil; lower it to drop background shading.',
    },
    {
      name: 'Dither photos (Black & white)',
      description:
        'Shows photos as fine dots, like a newspaper, instead of solid black and white areas.',
    },
    {
      name: 'PDF password',
      description:
        'Opens a password-protected PDF. The converted copy is protected with the same password. It is used only in this browser tab and never stored or sent anywhere.',
    },
    {
      name: 'Colour removed (Grayscale)',
      description:
        '100% is true grayscale. Lower values keep a little colour, for a softer, ink-saving look.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 20-page colour lecture PDF with red headings and coloured charts',
    settings: 'Black text, luminance',
    output: 'A PDF with solid black text and gray charts, ready for black-and-white printing',
  },
  limits: [
    'Images over 100 megapixels are too large to convert in a browser tab; they are listed in the report and kept as they were.',
  ],
  faqs: [
    {
      question: 'Will the print shop still charge for colour?',
      answer:
        'No colour is left: the saved file is opened again and every page, drawing, gradient and image is checked. Printers and shop software see a black-and-white document.',
    },
    {
      question: 'Does the text stay selectable?',
      answer:
        'Yes. Only colour instructions change; text, fonts and links stay exactly as they were, so you can still search and copy.',
    },
    {
      question: 'Why is my file smaller now?',
      answer:
        'Colour photos store three colour channels; gray photos store one. Black & white images use one bit per pixel, which is smaller still.',
    },
    {
      question: 'How do I remove a red stamp or red lines?',
      answer:
        'Set "Gray from" to the red channel. Red marks become as light as the paper while black text stays black.',
    },
    {
      question: 'Is my PDF uploaded?',
      answer:
        'No. Everything runs in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
});
