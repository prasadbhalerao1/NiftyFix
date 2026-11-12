import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Text copied from a PDF or email often arrives broken into short lines, with double spaces, curly quotes and hidden characters that mess up forms and documents. Paste it here: broken lines are joined back into sentences while paragraphs stay apart, words split with a hyphen at a line end are mended, and extra spaces disappear. Tick more options to remove every line break, HTML tags, emoji or invisible characters, then copy the clean text.',
  howTo: [
    'Paste the messy text.',
    'Keep "Join broken lines" on for PDF and email text, or choose "Remove all line breaks".',
    'Tick any other clean-ups you need.',
    'Copy the clean text.',
  ],
  options: [
    {
      name: 'Join broken lines',
      description:
        'Single line breaks inside a paragraph become spaces; blank lines between paragraphs are kept. Words hyphenated across a line break are joined again.',
    },
    {
      name: 'Remove all line breaks',
      description: 'Puts everything on one line, for form fields and spreadsheet cells.',
    },
    {
      name: 'Remove invisible characters',
      description:
        'Zero-width spaces, soft hyphens and similar characters often come along when copying from websites and break searches, passwords and form validation.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A paragraph copied from a PDF, broken after every 8 words',
    settings: 'Join broken lines, remove extra spaces',
    output: 'One flowing paragraph, ready to paste into a document or form',
  },
  limits: ['Tables and lists copied from PDFs may need tidying by hand after joining lines.'],
  faqs: [
    {
      question: 'How do I remove line breaks from text copied from a PDF?',
      answer:
        'Paste it here with "Join broken lines" on. Lines are joined into sentences, paragraphs stay separate, and you can copy the result straight away.',
    },
    {
      question: 'Why does my pasted text have strange gaps or fail in forms?',
      answer:
        'It may contain invisible characters such as zero-width spaces or non-breaking spaces. "Remove invisible characters" and "Remove extra spaces" clean them out.',
    },
  ],
  variants: [
    {
      slug: 'remove-all-line-breaks',
      preset: 'all',
      label: 'Text on one line',
      h1: 'Put text on one line: remove all line breaks',
      seoTitle: 'Text on One Line: remove all line breaks and spaces | NiftyFix',
      seoDescription:
        'Turn any text into a single line: every line break removed and spaces tidied, for form fields, spreadsheet cells, code strings and captions. Free.',
      intro:
        'Need text in a single line for a form field, a spreadsheet cell, a caption or a code string? Paste it here and every line break is removed, with extra spaces tidied, ready to copy.',
    },
  ],
});
