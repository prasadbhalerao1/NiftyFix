import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Typed a paragraph with Caps Lock on, or need a heading in Title Case, or a variable name in snake_case? Paste the text and choose the case. The text changes in place, ready to copy, and Undo brings back what you had.',
  howTo: [
    'Type or paste your text into the box.',
    'Choose a case: UPPER, lower, Title, Sentence, Capitalized, or a programming style.',
    'Select Copy to put the result on your clipboard, or Undo to go back.',
  ],
  options: [
    {
      name: 'Sentence case',
      description:
        'Lower case with a capital at the start of each sentence (after a full stop, question mark, exclamation mark or Hindi purna viram).',
    },
    {
      name: 'Title Case and Capitalized Case',
      description:
        'Title Case capitalises the important words and keeps short words such as "of", "and" and "the" lower case, as headings usually do. Capitalized Case capitalises every word.',
    },
    {
      name: 'camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE',
      description:
        'For code and file names. Words are found from spaces, punctuation and existing capitals, so "userFirstName", "user_first_name" and "user first name" all convert correctly.',
    },
  ],
  example: {
    title: 'Example',
    input: 'THE LORD OF THE RINGS',
    settings: 'Title Case',
    output: 'The Lord of the Rings',
  },
  limits: [
    'Sentence case cannot know which words are names, so names after the first word become lower case; capitalise them again by hand.',
    'Scripts without capital letters, such as Hindi and Marathi, are left as they are.',
  ],
  faqs: [
    {
      question: 'How do I change uppercase to lowercase without retyping?',
      answer:
        'Paste the text here, choose lower case or Sentence case, and copy it back. In Microsoft Word, Shift+F3 cycles the case of selected text, and Excel has the LOWER, UPPER and PROPER functions.',
    },
    {
      question: 'Is my text sent anywhere?',
      answer: 'No. The conversion happens in your browser; nothing you type leaves your device.',
    },
    {
      question: 'What is the difference between Title Case and Capitalized Case?',
      answer:
        'Title Case follows heading style and keeps small words like "of" and "the" lower case unless they come first. Capitalized Case capitalises the first letter of every word.',
    },
  ],
});
