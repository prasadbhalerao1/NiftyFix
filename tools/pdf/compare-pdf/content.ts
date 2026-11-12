import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To compare two PDFs, choose the original and the changed version. Every word that was added or removed is highlighted in place, with a count of changes and buttons to jump between them. Switch to visual changes to see each page side by side with the differences painted orange, which also catches moved images, layout shifts and edits in scanned pages that text comparison cannot see. Both files stay on your device, so it is safe for contracts and confidential drafts.',
  howTo: [
    'Choose the original PDF and the changed PDF.',
    'Read the text changes: green is added, red and struck through is removed.',
    'Use "Next change" to jump through them.',
    'Switch to "Visual changes" and select "Check every page" to find pages whose layout or images changed.',
  ],
  options: [
    {
      name: 'Text changes',
      description:
        'Compares the words of both documents line by line, then word by word, so a changed number or name shows exactly. Page markers keep each change on its page.',
    },
    {
      name: 'Visual changes',
      description:
        'Draws the same page of both PDFs and marks every pixel that differs. Use it for scans, signatures, stamps, images and formatting.',
    },
  ],
  example: {
    title: 'Example',
    input: 'Rent agreement v1 and v2, 6 pages each',
    settings: 'Text changes',
    output: '"15000" removed and "18000" added on page 2; 2 words changed in total',
  },
  limits: [
    'Scanned PDFs have no text layer: use visual changes, or Image to Text first.',
    'Very different documents are compared line by line rather than word by word, to stay fast.',
  ],
  faqs: [
    {
      question: 'How do I find the differences between two PDF files?',
      answer:
        'Choose both files here. Added words are highlighted green and removed words red, with a total count; the visual view shows page changes such as images and layout.',
    },
    {
      question: 'Can it compare scanned PDFs?',
      answer:
        'Yes, with visual changes: it compares what the pages look like, pixel by pixel. Text comparison needs a text layer, which scans do not have.',
    },
    {
      question: 'Is it safe for confidential documents?',
      answer:
        'Yes. Both PDFs are read in your browser, in an isolated frame that cannot connect to other sites; nothing is uploaded.',
    },
  ],
});
