import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To pick a colour from an image, choose or paste it, then tap or click any spot: you get the exact HEX code with RGB, HSL and CMYK, the closest colour name, and how readable it is as text on white or black. A zoom loupe shows the pixels under your finger, and arrow keys move one pixel at a time. The tool also finds the main colours of the image and gives you the palette as HEX, CSS variables, Tailwind, JSON or a GIMP palette.',
  howTo: [
    'Choose an image, or paste a screenshot.',
    'Tap or click the spot you want. Use the loupe, or the arrow keys and Enter, for exact pixels.',
    'Copy the HEX, RGB, HSL or CMYK code.',
    'Scroll to the palette to copy or download the main colours.',
  ],
  options: [
    {
      name: 'Colour codes',
      description:
        'HEX and RGB for web and apps, HSL for adjusting shades, CMYK as a starting point for print. Each has its own copy button.',
    },
    {
      name: 'Contrast',
      description:
        'The WCAG contrast ratio of the colour on white and on black: 4.5:1 passes AA for normal text, 7:1 passes AAA.',
    },
    {
      name: 'Palette',
      description:
        'The 2 to 12 colours that cover most of the image, with how much of it each covers. Export as HEX, CSS variables, Tailwind colours, JSON or a GIMP/Inkscape .gpl palette.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A screenshot of a brand website',
    settings: 'Tap the logo; palette of 6',
    output: 'The logo colour #E8590C with RGB, HSL and CMYK, and a 6-colour CSS palette',
  },
  limits: [
    'Very large images are read at up to 4096 pixels on the longest side; every pixel you pick is a real pixel of that copy.',
    'CMYK values are a simple conversion; printers using colour profiles may print slightly differently.',
  ],
  faqs: [
    {
      question: 'How do I get the HEX code of a colour in an image?',
      answer:
        'Choose the image here and tap the colour. The HEX code shows at once with a copy button; RGB, HSL and CMYK are listed under it.',
    },
    {
      question: 'Can I pick a colour from my screen, outside the image?',
      answer:
        'In Chrome and Edge on a computer, "Pick from anywhere on screen" lets you pick from any window. In other browsers, take a screenshot and paste it here.',
    },
    {
      question: 'How is the palette chosen?',
      answer:
        'The pixels of the image are grouped into the number of colours you ask for (k-means clustering), and the average of each group is one swatch. The same image always gives the same palette.',
    },
    {
      question: 'Is my image uploaded?',
      answer:
        'No. It is read in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
  variants: [
    {
      slug: 'color-palette-from-image',
      preset: 'palette',
      label: 'Color palette from image',
      h1: 'Color palette from an image',
      seoTitle: 'Color Palette from Image: extract colors as CSS, free | NiftyFix',
      seoDescription:
        'Extract a color palette from any photo or screenshot: up to 12 main colors with their share, as HEX, CSS, Tailwind, JSON or GIMP. Free, no upload.',
      intro:
        'Turn any photo, artwork or screenshot into a colour palette. The main colours are found automatically (8 to start, 2 to 12 if you like) with how much of the image each covers, ready to copy as HEX codes, CSS variables, Tailwind colours, JSON or a GIMP palette.',
      faqs: [
        {
          question: 'How many colours should a palette have?',
          answer:
            'Five to eight is typical for a brand or design. Fewer gives the dominant mood; more picks up accents and shadows.',
        },
      ],
    },
  ],
});
