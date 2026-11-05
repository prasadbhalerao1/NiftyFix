import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Retyping text from a photo of a notice, a certificate or a screenshot is slow and error-prone. This tool reads the text for you (OCR) in English, Hindi and Marathi, and gives it back to copy, edit or save as a text file. Recognition runs in your browser, so documents with personal details never leave your device. Lines the reader is unsure of are listed, so you know what to check.',
  howTo: [
    'Choose an image: a photo, scan or screenshot (JPG, PNG, WebP, AVIF, BMP or GIF), or up to 20 at once.',
    'Tick every language in the image. English and Hindi are selected to start with.',
    'Select "Read text". The first time, each language is downloaded once and then kept on your device.',
    'Copy the text, or download it as a .txt file. Check any lines listed as unsure.',
  ],
  options: [
    {
      name: 'Languages',
      description:
        'English, Hindi and Marathi. Tick all that appear: a Hindi notice with English names reads best with both ticked. Hindi and Marathi share the Devanagari script but have their own words, so pick the right one.',
    },
    {
      name: 'Confidence',
      description:
        'For each line the reader reports how sure it is. Lines below 60% are listed after reading so you can compare them with the image.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A phone photo of a printed Hindi certificate, slightly tilted',
    settings: 'Hindi and English',
    output: 'The full text, with about 97 of every 100 characters right on our test documents',
  },
  limits: [
    'Printed text reads best. Handwriting is often misread; a higher-accuracy AI reader for handwriting is planned for this tool.',
    'Small, blurry or very dark text needs a sharper photo, taken straight on in even light. Crop away anything that is not text for a faster, cleaner result.',
    'Tables and columns come out as plain lines of text, without the layout.',
    'The first use of each language downloads its data (1 to 3 MB). After that it is read from your device.',
  ],
  faqs: [
    {
      question: 'Is my image uploaded to read the text?',
      answer:
        'No. The text reader runs inside your browser. The image and the text stay on your device; our servers never receive them.',
    },
    {
      question: 'How accurate is it?',
      answer:
        'On our printed test documents, 99 to 100 of every 100 characters were right on clean scans, and about 97 on a tilted, soft phone photo of Hindi text. Accuracy drops with blur, poor light and handwriting, so always check names and numbers.',
    },
    {
      question: 'Can I get text from a scanned PDF?',
      answer:
        'Turn the PDF pages into images with PDF to JPG, then read them here. Reading scanned PDFs directly is planned.',
    },
  ],
  variants: [
    {
      slug: 'hindi-image-to-text',
      preset: 'hin',
      label: 'Hindi',
      h1: 'Hindi image to text (OCR)',
      seoTitle: 'Hindi OCR: Hindi image to text online, free | NiftyFix',
      seoDescription:
        'Copy Hindi text from a photo, scan or screenshot. Devanagari OCR with English for mixed text. Free, and the image never leaves your device.',
      intro:
        'Read Hindi text from a photo of a notice, certificate or letter and get it as editable Unicode text you can paste anywhere. This page opens with Hindi and English selected, so names and numbers in English are read too.',
      faqs: [
        {
          question: 'Will the text work in Word and WhatsApp?',
          answer:
            'Yes. The result is standard Unicode Devanagari, the same as typing with a Hindi keyboard, so it pastes correctly into any app.',
        },
      ],
    },
    {
      slug: 'marathi-image-to-text',
      preset: 'mar',
      label: 'Marathi',
      h1: 'Marathi image to text (OCR)',
      seoTitle: 'Marathi OCR: Marathi image to text online, free | NiftyFix',
      seoDescription:
        'Copy Marathi text from a photo, scan or screenshot with Devanagari OCR. Free, and your image never leaves your device.',
      intro:
        'Read Marathi text from a photo of a document, notice or page and get editable Unicode text. This page opens with Marathi and English selected.',
      faqs: [
        {
          question: 'Why choose Marathi instead of Hindi?',
          answer:
            'Both use Devanagari, but the Marathi model knows Marathi words and letters such as ळ, so it makes fewer mistakes on Marathi text.',
        },
      ],
    },
  ],
});
