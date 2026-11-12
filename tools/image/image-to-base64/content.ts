import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To convert an image to Base64, choose or paste it and copy the result: a data URI, the bare Base64, a CSS background, an HTML img tag, a Markdown image or JSON. Several images can be converted at once, and each shows how big its Base64 is. To go the other way, paste a Base64 string or data URI: the image appears, its real format is detected, and you can download it with the right extension.',
  howTo: [
    'Choose "Image to Base64" or "Base64 to image".',
    'Choose or paste images, or paste the Base64 text.',
    'Pick the output (data URI, CSS, HTML and so on) or check the decoded image.',
    'Copy the text, or download the file.',
  ],
  options: [
    {
      name: 'Output as',
      description:
        'Data URI for src attributes and JSON APIs; Base64 only for systems that add the prefix themselves; CSS background-image, HTML img tag or Markdown to paste straight into code or docs.',
    },
    {
      name: 'Base64 to image',
      description:
        'Accepts data URIs and bare Base64, with line breaks, quotes, URL-safe letters (- and _) or missing = padding. The format is read from the data itself, not the label, so a mislabelled image still downloads correctly.',
    },
  ],
  example: {
    title: 'Example',
    input: 'logo.png, 4 KB',
    settings: 'Output as CSS background-image',
    output: 'background-image: url("data:image/png;base64,iVBORw0KGgo...");',
  },
  limits: [
    'Base64 is about a third larger than the file. Inline small images (icons, under about 100 KB); link bigger ones as files.',
  ],
  faqs: [
    {
      question: 'What is a Base64 image?',
      answer:
        'An image written as plain text, so it can sit inside HTML, CSS, JSON or an email without a separate file. A data URI adds the type in front: data:image/png;base64,...',
    },
    {
      question: 'Why does my Base64 not decode?',
      answer:
        'Usually it was cut off when copying, or contains a character that is not Base64. The tool says which character and where, and accepts the common variants (URL-safe letters, missing padding, line breaks).',
    },
    {
      question: 'Does converting to Base64 change the image?',
      answer:
        'No. Base64 is a lossless encoding of the exact file bytes; decoding gives back the identical file.',
    },
    {
      question: 'Is my image uploaded?',
      answer:
        'No. Encoding and decoding happen in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
  variants: [
    {
      slug: 'base64-to-image',
      preset: 'decode',
      label: 'Base64 to image',
      h1: 'Convert Base64 to an image',
      seoTitle: 'Base64 to Image: decode and download, free | NiftyFix',
      seoDescription:
        'Paste a Base64 string or data URI to see the image, detect its real format and download it as PNG, JPG, WebP, GIF, SVG or ICO. Free, nothing uploaded.',
      intro:
        'Paste Base64 text or a data URI from code, an API response or an email: the image appears at once with its real format, size and dimensions, ready to download with the correct extension. Broken input gets a precise reason, such as the character and position that is not Base64.',
      faqs: [
        {
          question: 'How do I convert Base64 to JPG or PNG?',
          answer:
            'Paste the text here and select Download: the file keeps the format the data actually contains. To change the format afterwards, use Convert Image.',
        },
      ],
    },
  ],
});
