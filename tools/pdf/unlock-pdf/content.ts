import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To remove the password from a PDF, choose the file, type its password once, and download an unlocked copy that opens, prints and copies anywhere without asking. PDFs that open freely but block printing or copying are unlocked without any password. Everything happens in your browser: the file and the password never leave your device, and nothing about the document changes except the lock.',
  howTo: [
    'Choose the locked PDF.',
    'Type its password. Leave it empty if the PDF opens without one but will not print or copy.',
    'Select "Remove password".',
    'Download the unlocked PDF.',
  ],
  options: [
    {
      name: 'PDF password',
      description:
        'The password you use to open the file (an open or user password). It is used only in this browser tab and never stored or sent anywhere.',
    },
  ],
  example: {
    title: 'Example',
    input: 'A bank statement PDF that asks for a password every time it opens',
    settings: 'Its password, typed once',
    output: 'The same statement, opening with no password, ready to upload or print',
  },
  limits: [
    'You need the password to open the file. A PDF whose open password you do not know cannot be unlocked: its contents are encrypted, and guessing passwords is not something this tool does.',
    'Only remove passwords from your own documents or ones you have permission to unlock.',
  ],
  faqs: [
    {
      question: 'How do I remove a password from a PDF?',
      answer:
        'Choose the PDF here, type its password and select "Remove password". You get a copy that opens without asking, on any phone or computer.',
    },
    {
      question: 'Can I remove a PDF password without knowing it?',
      answer:
        'Only if the PDF already opens without one and just blocks printing, copying or editing: those restrictions are removed with no password. If the PDF asks for a password to open, its contents are encrypted and the password is needed.',
    },
    {
      question: 'How do I remove a password from a PDF on a phone or a Mac?',
      answer:
        'This page works the same on Android, iPhone, Mac and Windows, in any modern browser. Nothing to install.',
    },
    {
      question: 'Will the PDF change in any other way?',
      answer:
        'No. Text, images, links, bookmarks and form fields stay exactly as they were; only the encryption is taken off.',
    },
    {
      question: 'Is my PDF or password uploaded?',
      answer:
        'No. Both stay in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
  variants: [
    {
      slug: 'aadhaar-pdf-password',
      preset: 'aadhaar',
      label: 'Aadhaar PDF password',
      h1: 'Aadhaar PDF password: open and remove it',
      seoTitle: 'Aadhaar PDF Password: format and remove it, free | NiftyFix',
      seoDescription:
        'The e-Aadhaar PDF password is the first four letters of your name in capitals plus birth year. Type both here and get an Aadhaar PDF with no password.',
      intro:
        'The e-Aadhaar PDF password is the first four letters of your name in capital letters followed by your year of birth, as UIDAI explains: Suresh Kumar born in 1990 has the password SURE1990. Type your name and year below and the tool builds the password, opens your e-Aadhaar and gives you a copy without a password, for portals and print shops that cannot open locked files.',
      faqs: [
        {
          question: 'What is the Aadhaar PDF password format?',
          answer:
            'The first four letters of your name as printed on Aadhaar, in capitals, followed by your year of birth in four digits. Spaces are skipped and other characters count: "P. Kumar" born in 1990 gives P.KU1990, and a name shorter than four letters is used whole, such as RIA1990.',
        },
        {
          question: 'Why do I need to remove the Aadhaar password?',
          answer:
            'Many application forms, bank and exam portals reject password-protected PDFs, and print shops cannot open them. The unlocked copy uploads and prints like any PDF.',
        },
      ],
    },
  ],
});
