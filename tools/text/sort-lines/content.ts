import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Paste a list with one item per line and the cleaned result appears at once: duplicate and empty lines removed, spaces trimmed, and the list sorted A to Z, Z to A, by number or by length, shuffled, reversed or numbered, in any combination. A count shows how many duplicates were removed. It handles lists of hundreds of thousands of lines, and nothing leaves your browser.',
  howTo: [
    'Paste your list, one item per line.',
    'Tick what to clean: duplicates, empty lines, spaces.',
    'Choose a sort order, and reverse or number the lines if you like.',
    'Copy the result or download it as a .txt file.',
  ],
  options: [
    {
      name: 'Remove duplicate lines',
      description:
        'Keeps the first copy of each line, in its original place. With "Ignore upper and lower case", "Apple" and "apple" count as the same.',
    },
    {
      name: 'Sort',
      description:
        'A to Z and Z to A follow your language’s alphabet. "Numbers in order" puts item 2 before item 10. "Shortest first" sorts by length. Shuffle mixes the list randomly.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A list of 500 email addresses with repeats',
    settings: 'Remove duplicates, ignore case, A to Z',
    output: '412 unique addresses in alphabetical order; 88 duplicates removed',
  },
  limits: ['Lines are compared exactly, letter for letter (or ignoring case if ticked).'],
  faqs: [
    {
      question: 'How do I remove duplicate lines from a list?',
      answer:
        'Paste the list here with "Remove duplicate lines" ticked. The result keeps the first copy of each line and shows how many repeats were removed.',
    },
    {
      question: 'How do I sort a list alphabetically?',
      answer:
        'Paste it and choose "A to Z" under Sort. Tick "Ignore upper and lower case" so capitalised words are not sorted separately.',
    },
    {
      question: 'Why does item 10 come before item 2?',
      answer:
        'Plain alphabetical order compares character by character. Choose "Numbers in order" to sort numbers by their value.',
    },
  ],
  variants: [
    {
      slug: 'remove-duplicate-lines',
      preset: 'dedupe',
      label: 'Remove duplicate lines',
      h1: 'Remove duplicate lines from text',
      seoTitle: 'Remove Duplicate Lines from Text Online, free | NiftyFix',
      seoDescription:
        'Paste text or a list to remove duplicate lines instantly, keeping the first copy of each in place. Ignore case if needed; see how many were removed.',
      intro:
        'Paste any text or list and every repeated line is removed at once, keeping the first copy of each in its original position. Turn on "Ignore upper and lower case" to treat "Apple" and "apple" as the same, and optionally sort the cleaned list.',
      faqs: [
        {
          question: 'How do I remove duplicate lines in Excel or Notepad++?',
          answer:
            'In Excel, select the column and use Data, Remove Duplicates. In Notepad++, use Edit, Line Operations, Remove Duplicate Lines. Or paste the list here for the same result in any browser, with an option to ignore upper and lower case.',
        },
      ],
    },
    {
      slug: 'sort-lines-alphabetically',
      preset: 'sort',
      label: 'Sort lines alphabetically',
      h1: 'Sort lines alphabetically',
      seoTitle: 'Sort Lines Alphabetically: alphabetize a list online | NiftyFix',
      seoDescription:
        'Alphabetize any list A to Z or Z to A, or sort by number or length. Ignores case if you like, and can remove duplicates too. Free and private.',
      intro:
        'Paste a list and it is sorted A to Z straight away. Switch to Z to A, number order (so 2 comes before 10) or length, ignore upper and lower case, and remove duplicates in the same step.',
      faqs: [
        {
          question: 'How do I sort a list alphabetically in Word or Excel?',
          answer:
            'In Word, select the list and choose Home, Sort. In Excel, select the column and choose Data, Sort A to Z. Here you paste the list and it is sorted at once; choose Numbers in order to put 2 before 10.',
        },
      ],
    },
  ],
});
