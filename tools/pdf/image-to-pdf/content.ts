import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Portals and offices usually ask for documents as a PDF, but your marksheet or ID is a photo on your phone. Add the photos, put them in order, and this tool makes one PDF with one image per page. JPEG and PNG images go in unchanged, at full quality; sideways phone photos are turned upright automatically. Pages can be A4, US Letter, or exactly the size of each image.',
  howTo: [
    'Choose your images (JPEG, PNG, WebP, AVIF, BMP or GIF). You can add more later.',
    'Put them in order with the arrows. Each image becomes one page.',
    'Choose the page size, orientation and margin.',
    'Select "Create PDF", check the report, then download.',
  ],
  options: [
    {
      name: 'Page size',
      description:
        'A4 and Letter are standard paper sizes for printing and portals. "Image size" makes each page exactly as big as its image, with no margin.',
    },
    {
      name: 'Orientation',
      description:
        '"Automatic" uses landscape pages for wide images and portrait for tall ones. Images are scaled to fit, never stretched or cropped.',
    },
    {
      name: 'Margin',
      description: 'White space around each image on A4 or Letter pages.',
    },
  ],
  example: {
    title: 'Example',
    input: 'Three phone photos of a marksheet (front, back) and an ID card',
    settings: 'A4, automatic orientation, small margin',
    output: 'A 3-page A4 PDF, every photo upright and centred',
  },
  limits: [
    'Up to 100 images at once, 60 MB each on a computer and 30 MB on a phone.',
    'WebP, AVIF, BMP and GIF images are converted to lossless PNG pages; animated GIFs use their first frame.',
    'This tool does not reduce file size. For a size limit, use Compress PDF on the result.',
    'iPhone HEIC photos are not supported yet; share them as JPEG instead.',
  ],
  faqs: [
    {
      question: 'Will my photos lose quality?',
      answer:
        'JPEG and PNG images are placed in the PDF as they are, with no re-compression. Only photos that need turning upright are redrawn, at high quality.',
    },
    {
      question: 'Are my photos uploaded?',
      answer:
        'No. The PDF is made in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
});
