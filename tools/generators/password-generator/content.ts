import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Every password here is made by the cryptographically secure random generator built into your browser, on your device, and never sent or stored anywhere. Choose the length and character types (each one you tick is always included), leave out look-alike characters such as I, l and 1, or make a pronounceable passphrase or a numeric PIN instead. You can make up to 100 at once, and check how long any password would take to crack.',
  howTo: [
    'Choose password, passphrase or PIN.',
    'Set the length (16 or more is a good default) and character types.',
    'Copy a password, or select "Generate new" for another.',
    'Type any password into the checker to see its strength and weaknesses.',
  ],
  options: [
    {
      name: 'Avoid look-alikes',
      description:
        'Leaves out I, l, 1, O, 0 and similar characters that are easy to misread when typing a password from paper or another screen.',
    },
    {
      name: 'Passphrase',
      description:
        'Pronounceable made-up words joined by dashes, with a capital and a number: much easier to type and remember, and still very hard to guess.',
    },
    {
      name: 'Strength check',
      description:
        'Estimates guesses from length and character variety, then lowers it for common passwords, keyboard runs (qwerty, 1234), repeated characters and years. It assumes a fast offline attack of ten billion guesses a second.',
    },
  ],
  example: {
    title: 'Example',
    input: 'Password, 16 characters, all types, avoid look-alikes',
    settings: 'Generate',
    output: 'A password such as k7#Rm2!vQz9@Lp4& with about 100 bits of randomness',
  },
  limits: [
    'The checker cannot know whether a password has leaked in a breach; never reuse a password across sites.',
  ],
  faqs: [
    {
      question: 'How long should a strong password be?',
      answer:
        'At least 12 characters, and 16 or more for important accounts. Length adds far more strength than swapping letters for symbols.',
    },
    {
      question: 'Is it safe to generate a password online?',
      answer:
        "Here, yes: passwords are made by your browser's secure random generator on your own device and are never sent anywhere. Use a password manager to store them.",
    },
    {
      question: 'What is a passphrase?',
      answer:
        'Several random words joined together. Four or more random words are both strong and easy to type.',
    },
  ],
  variants: [
    {
      slug: 'password-strength-checker',
      preset: 'check',
      label: 'Password strength checker',
      h1: 'Password strength checker',
      seoTitle: 'Password Strength Checker: how strong is my password? | NiftyFix',
      seoDescription:
        'Check how strong a password is and how long it would take to crack, with warnings for common words, keyboard runs and years. Never leaves your device.',
      intro:
        'Type a password to see how strong it is, roughly how long a fast attacker would need to crack it, and what makes it weaker: common passwords, keyboard runs like qwerty, repeated characters or years. The check runs on this page only; nothing you type is sent anywhere.',
    },
  ],
});
