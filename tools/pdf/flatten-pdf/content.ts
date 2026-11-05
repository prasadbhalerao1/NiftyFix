import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'A filled PDF form keeps its answers in separate form fields. Some viewers and portals do not show those fields, so a form you filled carefully can arrive looking blank, and anyone can still edit the answers. Flattening draws each answer into the page itself: it looks the same everywhere, prints correctly and can no longer be changed by editing the field.',
  howTo: [
    'Fill in your form and save it.',
    'Choose the filled PDF here.',
    'Select "Flatten PDF", check the report, then download.',
  ],
  options: [
    {
      name: 'What is flattened',
      description:
        'Every form field (text boxes, check boxes, radio buttons and drop-downs) becomes part of the page as it currently looks.',
    },
  ],
  limits: [
    'Flattening cannot be undone in the downloaded file. Keep your original if you may need to edit the answers.',
    'Comments and other annotations are not flattened yet.',
    'Password-protected PDFs must be unlocked first.',
  ],
  faqs: [
    {
      question: 'Why does my filled form look empty on a portal?',
      answer:
        'Some systems only show page content and ignore form fields. Flattening moves your answers into the page content, so they are always visible.',
    },
    {
      question: 'What if my PDF has no form fields?',
      answer: 'You get the same pages back, and the report tells you that no fields were found.',
    },
  ],
});
