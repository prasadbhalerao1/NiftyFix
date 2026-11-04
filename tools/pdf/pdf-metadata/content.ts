import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Every PDF carries hidden details: a title, the author’s name, the program that made it, keywords. They show up in search results, in file properties and in browser tabs — and they can reveal more than you intend, such as a colleague’s name on a document you are forwarding. This tool shows those details, lets you correct them, or removes all of them, including the second hidden copy (XMP) most tools miss.',
  howTo: [
    'Choose a PDF. Its current details appear in the fields.',
    'Change any field, or select "Remove all metadata".',
    'Select "Save PDF", check the report, then download.',
  ],
  options: [
    {
      name: 'Title',
      description:
        'Shown in browser tabs and some search results instead of the file name. A clear title helps people recognise the document.',
    },
    {
      name: 'Author, subject, keywords and application',
      description: 'Descriptive details. Leave a field empty to remove it.',
    },
    {
      name: 'Remove all metadata',
      description:
        'Clears every field and deletes the XMP metadata stream, a separate copy of the same details that is easy to overlook.',
    },
  ],
  limits: [
    'Only document information is changed. Names that appear on the pages themselves, in comments or in form fields are not.',
    'Password-protected PDFs must be unlocked first.',
  ],
  faqs: [
    {
      question: 'Why would I remove metadata?',
      answer:
        'To avoid sharing hidden details, such as the author’s name, the company that made the file or the software used, when you send a document outside your organisation.',
    },
    {
      question: 'Does this change the pages?',
      answer:
        'No. The pages stay exactly as they are; only the hidden document information changes.',
    },
  ],
});
