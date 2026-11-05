import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Many application, bank and government forms are fillable PDFs, but phones and some browsers will not let you type into them or save the answers. Choose the form here and every field appears as a normal web form: text boxes, tick boxes, radio buttons and drop-downs with the form’s own options. Fill it in, optionally lock the answers, and download a completed PDF whose answers are checked before you get it.',
  howTo: [
    'Choose a fillable PDF form. Its fields appear in the order of the pages.',
    'Type your answers and pick options.',
    'Tick "Lock answers" if the form should not be changed after you send it.',
    'Select "Save filled form", check the report, then download.',
  ],
  options: [
    {
      name: 'Fields',
      description:
        'Shown with the names the form gives them. Read-only fields are listed but cannot be changed. Text longer than a field allows is shortened, and the report tells you.',
    },
    {
      name: 'Lock answers (flatten)',
      description:
        'Turns the answers into ordinary page content so they look the same everywhere and cannot be edited. Keep an unlocked copy if you may need changes.',
    },
  ],
  limits: [
    'Only fillable PDFs (with form fields) can be filled. For a scanned or flat form, use a PDF editor to place text.',
    'XFA forms (an older Adobe-only format used by some government forms) cannot be filled in a browser. The tool tells you if your form is one.',
    'Answers must use Latin letters and digits for now; Hindi and other scripts are refused instead of being saved unreadably.',
    'Signature fields are not filled here; use Sign PDF.',
  ],
  faqs: [
    {
      question: 'Why can I not type into this PDF on my phone?',
      answer:
        'Many phone viewers do not support PDF forms. This tool turns the form into ordinary inputs that work in any browser, then writes your answers back into the PDF.',
    },
    {
      question: 'Is my filled form uploaded?',
      answer:
        'No. The form is read and filled in your browser, in an isolated frame that cannot connect to other sites.',
    },
  ],
});
