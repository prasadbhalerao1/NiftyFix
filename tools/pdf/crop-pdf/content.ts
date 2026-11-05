import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Two common fixes for awkward PDFs. Crop trims the white margins off scanned or exported pages, with a live preview so you see exactly what stays. Resize puts every page on a standard paper size (A4 for India and most of the world, Letter for the US), scaling the content to fit without stretching it, and keeping links working.',
  howTo: [
    'Choose a PDF.',
    'Pick Crop margins or Resize pages.',
    'For Crop, enter the margin to remove on each side in millimetres and check the preview. For Resize, pick the paper size.',
    'Choose all pages or only some, then select the button, check the report and download.',
  ],
  options: [
    {
      name: 'Crop margins (mm)',
      description:
        'Measured on the page as you see it, so "top" is always the top, even on pages stored sideways. The preview shades what will be cut.',
    },
    {
      name: 'Resize to',
      description:
        'A4, US Letter, US Legal, A3 or A5. Each page keeps its orientation and is scaled evenly to fit, centred, with no stretching.',
    },
  ],
  limits: [
    'Cropping hides the trimmed area but does not delete it: the content is still in the file and can be uncropped. To remove sensitive information, use a redaction tool.',
    'Resizing to a smaller paper size makes text smaller; resizing to a larger one adds white space around the page.',
    'Password-protected PDFs must be unlocked first.',
  ],
  faqs: [
    {
      question: 'How do I change a PDF from Letter to A4?',
      answer:
        'Choose Resize pages, select A4 and save. Each page is scaled to fit A4 and centred, without distortion.',
    },
    {
      question: 'Is cropped content really gone?',
      answer:
        'No. PDF cropping only changes the visible area. Anyone can restore it with a PDF editor. Never rely on cropping to hide private details.',
    },
  ],
  variants: [
    {
      slug: 'resize-pdf-to-a4',
      preset: 'resize-a4',
      label: 'Resize to A4',
      h1: 'Resize a PDF to A4',
      seoTitle: 'Resize PDF to A4 online, free | NiftyFix',
      seoDescription:
        'Fit every page of a PDF onto A4 paper (letter-size, legal or odd-sized scans) without cropping or stretching. Free, nothing is uploaded.',
      intro:
        'Portals and printers often expect A4, but PDFs arrive as US Letter, Legal or whatever size a phone scanner chose. This page opens with Resize to A4 selected: each page is scaled to fit A4 and centred, keeping its proportions, so nothing is cut off or stretched.',
      faqs: [
        {
          question: 'Will resizing to A4 make the text smaller?',
          answer:
            'Only if the page was bigger than A4 or a different shape. Content is scaled to fit and never stretched; a Letter-size page shrinks very slightly and gains a thin margin.',
        },
      ],
    },
  ],
});
