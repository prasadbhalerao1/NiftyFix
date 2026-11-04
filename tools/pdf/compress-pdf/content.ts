import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Upload portals often cap documents at 1 MB, 500 KB or less, and scanned PDFs are usually far bigger. Almost all of that size is photos and scans, so this tool recompresses the images — shrinking oversized scans to a sensible resolution — while text and line drawings stay exactly as sharp as before. Choose a level, or type the limit your portal gives and the tool finds the gentlest setting that fits. It never gives you a file that is bigger, broken or missing pages.',
  howTo: [
    'Choose a PDF.',
    'Pick a level — Recommended suits most documents — or choose Target size and enter the limit.',
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
});
