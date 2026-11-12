import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'This tool saves the photos and pictures stored inside a PDF as separate image files, without taking screenshots of pages. JPEG photos come out as the exact bytes in the PDF, so there is no quality loss; other images are saved as lossless PNG, keeping any transparency. Icons and repeated logos are skipped, and you can tick only the images you want before downloading.',
  howTo: [
    'Choose a PDF.',
    'Choose which small images to skip, and keep "All pages" or choose the pages you need.',
    'Select "Extract images" and look through the thumbnails.',
    'Download all of them as a ZIP, or tick the ones you want and download only those.',
  ],
  options: [
    {
      name: 'Skip small images',
      description:
        'Leaves out images narrower or shorter than the size you pick: "Under 50 px" drops icons, bullets and lines; "Under 150 px" keeps only real photos and figures. "Keep all" saves everything.',
    },
    {
      name: 'Pages',
      description: 'Look on every page, or type pages and ranges such as 1, 3-5.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 12-page brochure PDF with 9 photos and a logo on every page',
    settings: 'Skip images under 50 px, all pages',
    output: 'A ZIP with 9 photos and the logo once, named brochure-page-1-image-1.jpg and so on',
  },
  limits: [
    'Only pictures stored inside the PDF are found. A scanned PDF is one picture per page; text and drawn shapes are not images. To save whole pages as pictures, use PDF to JPG.',
    'Images stored as CMYK, JPEG 2000, JBIG2 or fax are not converted, so their colours are never guessed; the report counts them.',
    'An image is saved at the size stored in the PDF, which may be larger or smaller than it looks on the page.',
    'Password-protected PDFs must be unlocked first.',
  ],
  faqs: [
    {
      question: 'Will the images lose quality?',
      answer:
        'No. JPEG photos are copied out byte for byte, exactly as they were put into the PDF. Other images are saved as PNG, which is lossless.',
    },
    {
      question: 'How is this different from PDF to JPG?',
      answer:
        'PDF to JPG takes a picture of each whole page, text and all. This tool pulls out only the photos inside the page, at their own original resolution.',
    },
    {
      question: 'Why did I get fewer images than I see on the page?',
      answer:
        'The same picture used several times is saved once, small icons are skipped, and some things that look like images are drawn shapes or text. Set "Skip small images" to "Keep all" to get everything stored.',
    },
    {
      question: 'Is my PDF uploaded?',
      answer:
        'No. The images are pulled out in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
  variants: [
    {
      slug: 'extract-photo-from-pdf',
      preset: 'photos',
      label: 'Extract photo from PDF',
      h1: 'Extract a photo from a PDF',
      seoTitle: 'Extract Photo from PDF: save the original photo, free | NiftyFix',
      seoDescription:
        'Get the photo out of a PDF, such as an ID card, certificate or admit card, at its original quality. Free, and your file never leaves your device.',
      intro:
        'Need the photo from a certificate, an ID card, an admit card or a resume PDF? Icons, bullets and small logos are already skipped, so you get the photos themselves, at the resolution they were stored, not a blurry screenshot of the page.',
      faqs: [
        {
          question: 'What if my photo is not in the download?',
          answer:
            'Set "Skip small images" to "Keep all", since a passport-size photo may be stored very small. If it is still missing, the page is probably a scan: save the page with PDF to JPG, then cut out the photo with Crop Image.',
        },
      ],
    },
  ],
});
