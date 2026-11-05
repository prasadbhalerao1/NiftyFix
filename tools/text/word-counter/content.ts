import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Essays, applications, captions and form answers often have a word or character limit. Paste or type your text and every count updates instantly: words, characters with and without spaces, sentences, paragraphs, lines, and how long it takes to read or say aloud. Hindi, Marathi and other scripts are counted the way a reader sees them.',
  howTo: [
    'Type or paste your text into the box.',
    'Set your own limit, such as 250 words for an exam answer or a statement of purpose, and watch how many words are left.',
    'Use Most repeated words to spot words you have overused, then edit until you are within the limit.',
  ],
  options: [
    {
      name: 'Characters and without spaces',
      description:
        'Characters counts every letter, number, space and symbol as you see it on screen, so a Hindi conjunct such as "क्षि" is one character. Without spaces leaves out spaces, tabs and line breaks.',
    },
    {
      name: 'Reading and speaking time',
      description:
        'Based on typical speeds of 200 words a minute for silent reading and 130 for speaking aloud, rounded up to the next minute.',
    },
    {
      name: 'Your limit',
      description:
        'Enter the word or character limit you have to meet (an answer, an essay, a form field) and see how many are left, or how far over you are.',
    },
    {
      name: 'Most repeated words',
      description:
        'Words you used more than once, most frequent first, leaving out common words such as "the" and "है". Useful for cutting repetition when you need to trim.',
    },
    {
      name: 'Common limits',
      description:
        'Bars for an X (Twitter) post (280), an Instagram caption (2,200), a search-result description (about 160) and a single SMS (160 Latin characters).',
    },
  ],
  example: {
    title: 'Example',
    input: 'A 350-word statement of purpose',
    settings: 'Pasted into the box',
    output: '350 words, about 2,000 characters, 2 minutes to read',
  },
  limits: [
    'Sites count differently: X counts some characters (such as emoji and links) as more than one, and an SMS in Hindi holds fewer characters than one in English. Use these counts as a close guide.',
    'Words are counted between spaces, as Microsoft Word does, so a hyphenated word counts as one. Chinese, Japanese and Thai, written without spaces, are split with your browser’s dictionary and may differ slightly from other counters.',
  ],
  faqs: [
    {
      question: 'Is my text saved or sent anywhere?',
      answer:
        'No. Counting happens in your browser as you type. The text is never sent to our servers or stored.',
    },
    {
      question: 'Does it count Hindi and Marathi correctly?',
      answer:
        'Yes. Words are counted between spaces, and characters as they appear on screen, so matras and conjuncts are not counted as separate letters.',
    },
  ],
});
