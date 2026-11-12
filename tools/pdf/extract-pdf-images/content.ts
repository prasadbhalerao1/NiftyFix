import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'This tool saves the photos and pictures stored inside a PDF as separate image files, at full stored resolution, without taking screenshots of pages. JPEG photos keep their exact compressed data, so there is no quality loss; every other kind of image (scans, CMYK, JPEG 2000, JBIG2) is saved as lossless PNG with any transparency. Pictures split into strips are joined back together, sideways ones are turned the way the page shows them, icons and repeated logos are skipped, and password-protected PDFs open with their password. You can tick only the images you want before downloading.',
  howTo: [
    'Choose a PDF. If it has a password, type it in "PDF password".',
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
    {
      name: 'Join pictures split into pieces',
      description:
        'Word, PowerPoint and some scanners store one picture as many thin strips or tiles drawn edge to edge. This puts them back into one image. Pieces join only when they line up exactly at the same scale.',
    },
    {
      name: 'Turn pictures the way the page shows them',
      description:
        'A PDF can store a picture sideways, upside down or mirrored and turn it when it draws the page. With this on, each image is saved the way you see it. PNG pixels are moved losslessly; for JPEG only the orientation tag is set, so the photo data is not recompressed.',
    },
    {
      name: 'PDF password',
      description:
        'Opens a password-protected PDF, such as an e-Aadhaar. The password is used only in this browser tab and never stored or sent anywhere.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 12-page brochure PDF with 9 photos and a logo on every page',
    settings: 'Skip images under 50 px, all pages',
    output: 'A ZIP with 9 photos and the logo once, named brochure-page-1-image-1.jpg and so on',
  },
  limits: [
    'Only pictures stored inside the PDF are found. Text and drawn shapes (charts, vector logos) are not images; to save them, use PDF to JPG, which saves whole pages.',
    'An image is saved at the size stored in the PDF, which may be larger or smaller than it looks on the page.',
    'Images over 100 megapixels are too large to open in a browser tab and are listed in the report.',
  ],
  faqs: [
    {
      question: 'Will the images lose quality?',
      answer:
        'No. JPEG photos are copied out with their compressed data untouched. Every other image is saved as PNG, which is lossless, with every pixel stored in the PDF.',
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
      question: 'Why do other tools give me strips or sideways images?',
      answer:
        'Many PDFs store a picture in pieces, or sideways, and assemble or turn it only when the page is drawn. Most extractors copy the stored pieces as they are. This tool joins the pieces and turns each picture the way the page shows it.',
    },
    {
      question: 'Is my PDF uploaded?',
      answer:
        'No. The images are pulled out in your browser, in an isolated frame that cannot connect to other sites. Your password never leaves the page either.',
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
        'Get the photo out of a PDF, such as an e-Aadhaar, certificate or admit card, at its original quality. Works with passwords. Free, nothing uploaded.',
      intro:
        'Need the photo from an e-Aadhaar, a certificate, an admit card or a resume PDF? Icons, bullets and small logos are already skipped, so you get the photos themselves, at the resolution they were stored, not a blurry screenshot of the page. Password-protected PDFs open with their password, right here in your browser.',
      faqs: [
        {
          question: 'How do I get my photo from the e-Aadhaar PDF?',
          answer:
            'Choose the e-Aadhaar PDF and type its password: the first four letters of your name in capitals followed by your year of birth, for example SURE1990 (as UIDAI explains). The photo stored in it is small, so set "Skip small images" to "Keep all" if it is not in the result.',
        },
        {
          question: 'What if my photo is not in the download?',
          answer:
            'Set "Skip small images" to "Keep all", since a passport-size photo may be stored very small. If it is still missing, the page is probably one scanned picture: the whole page comes out as one image, and you can cut out the photo with Crop Image.',
        },
      ],
    },
  ],
});
