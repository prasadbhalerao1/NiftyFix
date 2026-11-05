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
  ],
  variants: [
    {
      slug: 'compress-pdf-to-100kb',
      preset: 'target-100kb',
      label: '100 KB',
      h1: 'Compress a PDF to 100 KB',
      seoTitle: 'Compress PDF to 100KB online, free | NiftyFix',
      seoDescription:
        'Reduce a PDF to under 100 KB for strict upload forms. Text stays sharp; only images shrink. Free, and your file never leaves your device.',
      intro:
        '100 KB is one of the tightest limits forms use. The target is already set to 100 KB: choose your PDF and the tool tries gentle settings first, stopping at the first that fits. One or two scanned pages usually fit; longer scans may need splitting.',
      faqs: [
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
      seoTitle: 'Compress PDF to 200KB online, free | NiftyFix',
      seoDescription:
        'Shrink a PDF to under 200 KB for application and exam forms. Text stays sharp, only images are reduced. Free and private: nothing is uploaded.',
      intro:
        'Many online application forms cap each document at 200 KB. The target is already set: choose your PDF, and the tool reduces images only as much as needed to get under 200 KB, so certificates and ID scans stay readable.',
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
      seoTitle: 'Compress PDF to 300KB online, free | NiftyFix',
      seoDescription:
        'Get a PDF under 300 KB without blurring its text. Images are recompressed only as far as needed. Free, private, works on phones.',
      intro:
        'A 300 KB limit leaves room for several scanned pages at a comfortable reading quality. The target is already set to 300 KB; choose your PDF and the tool picks the lightest compression that fits.',
    },
    {
      slug: 'compress-pdf-to-500kb',
      preset: 'target-500kb',
      label: '500 KB',
      h1: 'Compress a PDF to 500 KB',
      seoTitle: 'Compress PDF to 500KB online, free | NiftyFix',
      seoDescription:
        'Reduce a PDF to under 500 KB for upload portals and email. Text stays crisp; only photos and scans shrink. Free, nothing is uploaded.',
      intro:
        '500 KB is a common cap for documents on government, bank and university portals. The target is already set: choose your PDF and the tool keeps as much image quality as fits under 500 KB, usually enough for multi-page scans to stay easy to read.',
    },
    {
      slug: 'compress-pdf-to-1mb',
      preset: 'target-1mb',
      label: '1 MB',
      h1: 'Compress a PDF to 1 MB',
      seoTitle: 'Compress PDF to 1MB online, free | NiftyFix',
      seoDescription:
        'Make a PDF smaller than 1 MB with almost no visible change. Only images are recompressed. Free, private, and nothing leaves your device.',
      intro:
        'Getting under 1 MB rarely needs heavy compression: most large PDFs are big because of a few full-resolution photos or scans. The target is already set to 1 MB, so choose your PDF and the tool applies the gentlest setting that fits.',
    },
    {
      slug: 'compress-pdf-to-2mb',
      preset: 'target-2mb',
      label: '2 MB',
      h1: 'Compress a PDF to 2 MB',
      seoTitle: 'Compress PDF to 2MB online, free | NiftyFix',
      seoDescription:
        'Bring a large PDF under 2 MB for email attachments and upload limits, keeping photos looking good. Free and private: no upload.',
      intro:
        'A 2 MB limit is generous, so photos and scans keep nearly all of their detail. The target is already set to 2 MB: choose your PDF (even a long report with many pictures) and the tool reduces only what it must.',
    },
  ],
});
