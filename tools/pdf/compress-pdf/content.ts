import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Upload portals often cap documents at 1 MB, 500 KB or less, and scanned PDFs are usually far bigger. Almost all of that size is photos and scans, so this tool recompresses the images (shrinking oversized scans to a sensible resolution) while text and line drawings stay exactly as sharp as before. Choose a level, or type the limit your portal gives and the tool finds the gentlest setting that fits. It never gives you a file that is bigger, broken or missing pages.',
  howTo: [
    'Choose a PDF.',
    'Pick a level (Recommended suits most documents) or choose Target size and enter the limit.',
    'Select "Compress PDF", check the report, then download.',
  ],
  options: [
    {
      name: 'Less, Recommended, Strong',
      description:
        'How much images are reduced. Less keeps photos close to the original; Strong makes the smallest files, still readable on screen and for most printing.',
    },
    {
      name: 'Target size',
      description:
        'Enter a limit in KB or MB. The tool tries gentle settings first and stops at the first one that fits, so quality is reduced only as much as needed.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 6 MB phone scan of a 4-page marksheet bundle',
    settings: 'Target size: 1 MB',
    output: 'About 700–900 KB, every page still readable',
  },
  limits: [
    'PDFs that are mostly text are already small; they cannot shrink much and the tool will say so.',
    'Images in print colour (CMYK) and some special image types are left unchanged to avoid colour errors.',
    'Strong compression and small targets reduce image detail. Check fine print in scans before you submit.',
    'Password-protected PDFs must be unlocked first.',
  ],
  faqs: [
    {
      question: 'Will the text become blurry?',
      answer:
        'No. Only images are recompressed. Real text and vector drawings are not touched, so they stay sharp at any zoom.',
    },
    {
      question: 'What if my PDF cannot reach the size I need?',
      answer:
        'The tool tells you the smallest size it can reach without making pages unreadable. Removing pages you do not need, or splitting the file, usually solves it.',
    },
    {
      question: 'Is 1 MB 1000 KB or 1024 KB?',
      answer:
        'Portals use both. The tool counts 1 KB as 1000 bytes and 1 MB as 1,000,000 bytes, the smaller of the two, so a file that fits here also passes a portal that counts in 1024s.',
    },
  ],
  variants: [
    {
      slug: 'compress-pdf-to-100kb',
      preset: 'target-100kb',
      label: '100 KB',
      h1: 'Compress a PDF to 100 KB',
      seoTitle: 'Compress PDF to 100KB: reduce PDF size below 100 KB | NiftyFix',
      seoDescription:
        'Reduce a PDF to under 100 KB for strict upload forms. Text stays sharp; only images shrink. Free, and your file never leaves your device.',
      intro:
        'To compress a PDF to 100 KB, choose it below: the target is already set, and the tool tries gentle settings first, stopping at the first that gets the file below 100 KB. It is one of the tightest limits forms use; one or two scanned pages usually fit, while longer scans may need splitting.',
      faqs: [
        {
          question: 'How do I reduce a PDF below 100 KB on my phone?',
          answer:
            'Open this page in Chrome or Safari on the phone, choose the PDF from your files or downloads, and select Compress PDF. Everything runs on the phone itself, so the document is never uploaded, and the smaller PDF is saved to your downloads.',
        },
        {
          question: 'Can any PDF be made smaller than 100 KB?',
          answer:
            'Not always. A single scanned page normally fits; ten scanned pages rarely do without becoming unreadable. If the tool cannot reach 100 KB it says how small it got, and you can remove pages you do not need or split the file and try again.',
        },
      ],
    },
    {
      slug: 'compress-pdf-to-200kb',
      preset: 'target-200kb',
      label: '200 KB',
      h1: 'Compress a PDF to 200 KB',
      seoTitle: 'Compress PDF to 200KB: reduce PDF size below 200 KB | NiftyFix',
      seoDescription:
        'Shrink a PDF to under 200 KB for application and exam forms. Text stays sharp, only images are reduced. Free and private: nothing is uploaded.',
      intro:
        'To compress a PDF to 200 KB, choose it below: the target is already set, and the tool reduces images only as much as needed to get under 200 KB, so certificates and ID scans stay readable. Many online application forms cap each document at this size.',
      faqs: [
        {
          question: 'My file is 2 MB. Will it really fit in 200 KB?',
          answer:
            'Usually, for a few scanned pages: phone scans are stored at far higher resolution than a form needs. The result shows the exact final size, and if a file cannot fit without losing readability, the tool tells you instead of handing over an unreadable PDF.',
        },
      ],
    },
    {
      slug: 'compress-pdf-to-300kb',
      preset: 'target-300kb',
      label: '300 KB',
      h1: 'Compress a PDF to 300 KB',
      seoTitle: 'Compress PDF to 300KB: reduce PDF size below 300 KB | NiftyFix',
      seoDescription:
        'Get a PDF under 300 KB without blurring its text. Images are recompressed only as far as needed. Free, private, works on phones.',
      intro:
        'To compress a PDF to 300 KB, choose it below: the target is already set, and the tool picks the lightest compression that fits. A 300 KB limit leaves room for several scanned pages at a comfortable reading quality.',
      faqs: [
        {
          question: 'How many pages fit in 300 KB?',
          answer:
            'Roughly three to six scanned pages stay easy to read, depending on how detailed they are. PDFs made from typed text are far smaller per page, so they fit many more.',
        },
      ],
    },
    {
      slug: 'compress-pdf-to-500kb',
      preset: 'target-500kb',
      label: '500 KB',
      h1: 'Compress a PDF to 500 KB',
      seoTitle: 'Compress PDF to 500KB: reduce PDF size under 500 KB | NiftyFix',
      seoDescription:
        'Reduce a PDF to under 500 KB for upload portals and email. Text stays crisp; only photos and scans shrink. Free, nothing is uploaded.',
      intro:
        'To compress a PDF to 500 KB, choose it below: the target is already set, and the tool keeps as much image quality as fits under 500 KB. It is a common cap for documents on government, bank and university portals, and multi-page scans usually stay easy to read.',
      faqs: [
        {
          question: 'How do I make a PDF less than 500 KB without losing quality?',
          answer:
            'Text and line drawings are never changed, so only photos and scans lose detail, and only as much as the limit needs. Starting from a clean scan rather than a tilted phone photo of the page also helps: it compresses further with less visible change.',
        },
      ],
    },
    {
      slug: 'compress-pdf-to-1mb',
      preset: 'target-1mb',
      label: '1 MB',
      h1: 'Compress a PDF to 1 MB',
      seoTitle: 'Compress PDF to 1MB: reduce PDF size below 1 MB, free | NiftyFix',
      seoDescription:
        'Make a PDF smaller than 1 MB with almost no visible change. Only images are recompressed. Free, private, and nothing leaves your device.',
      intro:
        'To compress a PDF to 1 MB, choose it below: the target is already set, and the tool applies the gentlest setting that gets the file below 1 MB. That rarely needs heavy compression, because most large PDFs are big only because of a few full-resolution photos or scans.',
      faqs: [
        {
          question: 'My PDF is 5 MB. Can it get under 1 MB?',
          answer:
            'Usually, when the size comes from scans or photos: they are stored at far higher resolution than a screen or printer needs. A long report full of photos may not fit; the tool then tells you the smallest readable size it reached, and splitting the file usually solves it.',
        },
        {
          question: 'How do I turn photos into a PDF under 1 MB?',
          answer:
            'Put the photos into one PDF with the Image to PDF tool, then open that PDF here. The target is already 1 MB, so the photos are reduced only as much as needed.',
        },
      ],
    },
    {
      slug: 'compress-pdf-to-2mb',
      preset: 'target-2mb',
      label: '2 MB',
      h1: 'Compress a PDF to 2 MB',
      seoTitle: 'Compress PDF to 2MB: reduce PDF size under 2 MB, free | NiftyFix',
      seoDescription:
        'Bring a large PDF under 2 MB for email attachments and upload limits, keeping photos looking good. Free and private: no upload.',
      intro:
        'To compress a PDF to 2 MB, choose it below: the target is already set, and the tool reduces only what it must to get under 2 MB. The limit is generous, so photos and scans keep nearly all of their detail, even in a long report with many pictures.',
      faqs: [
        {
          question: 'Can this make a PDF bigger, up to 2 MB?',
          answer:
            'No. It only makes files smaller, and NiftyFix never pads a file to make it bigger, because the extra bytes add nothing a reviewer can see. If a portal really asks for a minimum size, scan the document again at a higher resolution, such as 300 DPI.',
        },
      ],
    },
  ],
});
