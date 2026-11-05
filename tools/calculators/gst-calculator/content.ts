import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Work out the GST on a price before you quote it, or find how much of a bill is tax. Since 22 September 2025 most goods and services are taxed at 5% or 18%, with 40% for a short list of luxury and sin goods. Choose the rate, enter the price, and see the tax and its CGST and SGST (within a state) or IGST (between states) split.',
  howTo: [
    'Choose Add GST (your price is before tax) or Remove GST (your price already includes tax).',
    'Enter the price and pick the rate: 5%, 18%, 40%, or Other for any rate.',
    'Choose whether the sale is within a state or between states.',
    'Read the price before GST, the GST amount, the price including GST, and the split.',
  ],
  options: [
    {
      name: 'Add GST',
      description: 'GST = price × rate ÷ 100, and the total is the price plus GST.',
    },
    {
      name: 'Remove GST',
      description:
        'For a price that already includes GST: price before GST = total × 100 ÷ (100 + rate), and GST is the difference.',
    },
    {
      name: 'Within a state or between states',
      description:
        'A sale within one state carries CGST and SGST (or UTGST in a union territory), each half of the rate. A sale from one state to another carries IGST at the full rate.',
    },
  ],
  example: {
    title: 'Example',
    input: '₹1,180, including GST at 18%, sold within Maharashtra',
    settings: 'Remove GST, 18%, within a state',
    output: '₹1,000 before GST, ₹180 GST (₹90 CGST and ₹90 SGST)',
  },
  limits: [
    'The tool does not know which rate applies to your product or service; check its HSN or SAC rate on the GST portal or with your tax adviser.',
    'Compensation cess, TDS and TCS are not included.',
    'Amounts are rounded to the paisa; invoices may round line by line and differ by a paisa or two.',
  ],
  faqs: [
    {
      question: 'What are the GST rates now?',
      answer:
        'From 22 September 2025, after the 56th GST Council meeting, the main rates are 5% and 18%, with 40% for items such as tobacco, aerated drinks and bigger cars. Essentials can be exempt. The old 12% and 28% slabs were removed; use Other for older invoices.',
    },
    {
      question: 'Is anything I enter stored?',
      answer: 'No. The calculation runs in your browser, and nothing is sent anywhere.',
    },
  ],
  variants: [
    {
      slug: 'reverse-gst-calculator',
      preset: 'remove',
      label: 'Remove GST',
      h1: 'Reverse GST calculator: remove GST from a price',
      seoTitle: 'Reverse GST calculator: GST from inclusive price, free | NiftyFix',
      seoDescription:
        'Find the price before GST and the GST amount from a GST-inclusive total, at 5%, 18%, 40% or any rate, with the CGST and SGST split.',
      intro:
        'Have a total that already includes GST, such as a bill or an MRP? This page opens on Remove GST: enter the total and the rate to see the price before tax and the GST inside it.',
      faqs: [
        {
          question: 'Why is 18% of the total not the GST?',
          answer:
            'The 18% applies to the price before tax, not to the total. On ₹1,180 including 18% GST, the tax is ₹180 (18% of ₹1,000), while 18% of ₹1,180 would wrongly give ₹212.40.',
        },
      ],
    },
  ],
});
