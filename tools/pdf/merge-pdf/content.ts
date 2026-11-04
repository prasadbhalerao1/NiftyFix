import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Application portals, offices and email often want one PDF, not five. Add your PDFs, put them in order, and this tool joins every page into a single file. Pages are copied exactly as they are — text stays selectable, and nothing is re-compressed or re-printed — and the merged file is opened again to confirm its page count before you download it.',
  howTo: [
    'Choose two or more PDF files, or drop them onto the box. You can add more later.',
    'Put the files in order with the up and down arrows. Pages follow the file order.',
    'Optionally type a name for the merged file.',
    'Select "Merge PDFs", check the report, then download.',
  ],
  options: [
    {
      name: 'File order',
      description:
        'The merged PDF contains all pages of the first file, then all pages of the second, and so on. Use the arrows to change the order, or ✕ to remove a file.',
    },
    {
      name: 'File name',
      description: 'Leave it empty to name the result after your first file, with "-merged" added.',
    },
  ],
  example: {
    title: 'Example',
    input: 'Application form (2 pages), marksheet (1 page) and ID proof (1 page)',
    settings: 'Order: form, marksheet, ID proof',
    output: 'One 4-page PDF with the pages in that order',
  },
  limits: [
    'Password-protected PDFs cannot be merged until the password is removed.',
    'Up to 50 files at once; up to 250 MB in total on a computer and 100 MB on a phone.',
    'Bookmarks and form fields from the original files are not carried over to the merged file.',
    'Merging does not make a file smaller. Use Compress PDF afterwards if there is a size limit.',
  ],
  faqs: [
    {
      question: 'Are my files uploaded?',
      answer:
        'No. Merging happens in your browser, in an isolated frame that cannot connect to other sites. You can verify this on the privacy verification page.',
    },
    {
      question: 'Will the quality change?',
      answer:
        'No. Pages are copied as they are, without re-compressing images or turning text into pictures.',
    },
    {
      question: 'Can I merge a PDF with a photo?',
      answer: 'Convert the photo with JPG to PDF first, then merge the two PDFs here.',
    },
  ],
});
