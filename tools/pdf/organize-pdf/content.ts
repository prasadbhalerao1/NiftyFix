import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To reorder PDF pages, choose the file, move the page thumbnails into order, then save and download. Scanned bundles come out in the wrong order, with a sideways page or a blank one in the middle. Organize PDF shows every page as a thumbnail so you can fix all of that at once: drag pages into place, turn them the right way up and remove the ones you do not need. Nothing is changed until you save, and the saved file is checked page by page against what you arranged.',
  howTo: [
    'Choose a PDF. Thumbnails of every page appear.',
    'Drag a page to a new position, or use the ← and → buttons under it.',
    'Use ↺ and ↻ to rotate a page, and ✕ to remove it (select ↶ to bring it back).',
    'Select "Save PDF", check the report, then download.',
  ],
  options: [
    {
      name: 'Reorder',
      description:
        'Drag thumbnails with a mouse, or use the arrow buttons: they also work with a keyboard and on phones.',
    },
    {
      name: 'Rotate',
      description: 'Turns a page 90° at a time. The rotation is saved in the file, not just shown.',
    },
    {
      name: 'Remove',
      description:
        'Removed pages stay visible (faded) until you save, so you can restore them if you change your mind.',
    },
  ],
  limits: [
    'Password-protected PDFs must be unlocked first.',
    'Pages are copied exactly; bookmarks and form fields are not carried over.',
    'Very long documents (hundreds of pages) take a moment to show all thumbnails; they appear as you scroll.',
  ],
  faqs: [
    {
      question: 'How do I rearrange pages in a PDF without Adobe?',
      answer:
        'Choose the PDF here and drag the thumbnails into the order you want. It is free, runs in your browser on any computer or phone, and needs no Acrobat.',
    },
    {
      question: 'How do I delete a page from a PDF?',
      answer:
        'Select the ✕ under that page thumbnail, then save and download. Remove several pages the same way; the other pages keep their order and quality, and ↶ brings a page back.',
    },
    {
      question: 'Can I undo a change?',
      answer:
        'Yes, until you save: rotate a page back, restore a removed page, or choose "Reset" to start again from the original order.',
    },
    {
      question: 'Is my PDF uploaded to show the thumbnails?',
      answer:
        'No. Thumbnails are drawn in your browser, and the new PDF is made there too. Nothing is sent anywhere.',
    },
  ],
  variants: [
    {
      slug: 'delete-pdf-pages',
      label: 'Delete pages',
      h1: 'Delete pages from a PDF',
      seoTitle: 'Delete pages from PDF online, free | NiftyFix',
      seoDescription:
        'Remove blank, duplicate or unwanted pages from a PDF by clicking them in a thumbnail view. Free, private, and nothing is uploaded.',
      intro:
        'Choose your PDF and every page appears as a thumbnail. Select ✕ on each page you want gone (a blank scan, a duplicate, an instructions sheet) and save. Removed pages can be restored until you save, and the saved file is checked to contain exactly the pages you kept.',
      faqs: [
        {
          question: 'Can I delete pages by number instead of clicking?',
          answer:
            'For long documents, Extract pages is quicker: enter the pages to keep, such as 1-4, 7, and it saves only those.',
        },
      ],
    },
  ],
});
