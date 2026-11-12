import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Type a word, message or emoji, choose how many times to repeat it, and copy the result in one tap. Put each copy on a new line, separate them with spaces, commas or your own text, and number them if you like. The character count warns you when the result is longer than WhatsApp allows in one message.',
  howTo: [
    'Type or paste the text or emoji.',
    'Set how many times to repeat it.',
    'Choose what goes between copies.',
    'Tap Copy and paste it anywhere.',
  ],
  options: [
    {
      name: 'Between copies',
      description:
        'New line puts each copy on its own line; Space and Comma keep them on one line; Nothing joins them directly; Custom uses any text you type.',
    },
    {
      name: 'Number each copy',
      description: 'Adds 1., 2., 3. in front of each copy, handy for lists and practice lines.',
    },
  ],
  example: {
    title: 'Example',
    input: 'Happy birthday!',
    settings: '100 times, new line',
    output: '100 lines of "Happy birthday!", ready to paste',
  },
  limits: ['Up to 100,000 copies. Very long results may be slow to paste into some apps.'],
  faqs: [
    {
      question: 'How do I repeat a message many times for WhatsApp?',
      answer:
        'Type it here, set the number, tap Copy and paste into the chat. WhatsApp allows about 65,000 characters per message; the counter tells you when you go over.',
    },
    {
      question: 'Can I repeat emojis?',
      answer: 'Yes. Emojis are repeated exactly, including skin tones and flags.',
    },
  ],
});
