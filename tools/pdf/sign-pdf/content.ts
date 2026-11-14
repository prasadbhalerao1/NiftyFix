import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To sign a PDF online, choose the document, add your signature, place it on the page and download the signed copy. Printing a document just to sign it and scan it back is slow and makes the file blurry. Here you draw your signature with a mouse, finger or stylus (or upload a photo of it, which is cleaned so only the ink remains) then drag it exactly where it belongs on the page and save. The signature can go on one page or every page, and the saved file is checked to make sure it landed where you placed it.',
  howTo: [
    'Choose the PDF to sign. Its first page appears.',
    'Draw your signature in the box, or upload a photo of it on white paper.',
    'Go to the right page, drag the signature into place and adjust its size.',
    'Select "Sign PDF", check the report, then download.',
  ],
  options: [
    {
      name: 'Draw or upload',
      description:
        'Drawn signatures use black or blue ink. Uploaded photos are cropped to the ink and the paper is made transparent, so the signature sits cleanly on the page.',
    },
    {
      name: 'Position and size',
      description:
        'Drag the signature on the page, or select it and use the arrow keys (hold Shift for bigger steps). The size slider keeps its proportions.',
    },
    {
      name: 'Place on',
      description: 'Sign one page, or put the same signature or initials on every page.',
    },
  ],
  limits: [
    'This adds a visual signature (an image of your signature). It is not a certificate-based digital signature and does not prove who signed or that the document was not changed afterwards.',
    'Some organisations require a specific e-sign service or a wet signature; check what yours accepts.',
    'Password-protected PDFs must be unlocked first.',
  ],
  faqs: [
    {
      question: 'How do I sign a PDF on my phone, iPhone or Mac?',
      answer:
        'Open this page in the browser, choose the PDF and draw your signature with a finger, stylus or trackpad. Place it on the page and download. Nothing to install and no account needed.',
    },
    {
      question: 'Is this a digital signature (DSC)?',
      answer:
        'No. This adds a picture of your handwritten signature, which is what most forms, letters and agreements need. A certificate-based digital signature (DSC), required for some tax and company filings, needs your own signing certificate and software.',
    },
    {
      question: 'Is a signature added this way legally valid?',
      answer:
        'It depends on the document and who receives it. Many everyday forms accept an image signature, but some legal and government processes require a certified digital signature (for example Aadhaar eSign or a DSC). Check the requirement before you send.',
    },
    {
      question: 'Is my signature uploaded or stored?',
      answer:
        'No. Your signature and your document stay in your browser, in an isolated frame that cannot connect to other sites. Nothing is saved after you leave.',
    },
  ],
});
