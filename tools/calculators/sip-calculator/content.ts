import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    "Enter a monthly SIP amount, the return you expect and the number of years to see what you will invest, what you could earn, and the final value, with a year-by-year table. Add a yearly step-up if you plan to raise your SIP with your income, switch to lumpsum for a one-time investment, or set a goal to find the monthly SIP it needs. The value in today's money shows what inflation does to the result.",
  howTo: [
    'Choose SIP, lumpsum or goal.',
    'Enter the amount, the expected yearly return and the number of years.',
    'Add a yearly step-up if you will increase your SIP.',
    'Read the totals and the year-by-year table.',
  ],
  options: [
    {
      name: 'Expected return',
      description:
        'A yearly rate you assume, not a promise. Equity funds have varied widely from year to year; try a few rates such as 8, 10 and 12% to see the range.',
    },
    {
      name: 'Step-up',
      description:
        'Raises the monthly SIP by this percent every year. A 10% step-up often grows the final value far more than a higher starting amount.',
    },
    {
      name: 'Goal',
      description:
        'Enter a target amount and time to get the flat monthly SIP that reaches it at the expected return.',
    },
  ],
  example: {
    title: 'Example',
    input: '10,000 a month for 10 years at 12%',
    settings: 'SIP, no step-up',
    output: '12 lakh invested, about 23.23 lakh value',
  },
  limits: [
    'Returns are assumed to be steady every month; real funds go up and down, and expense ratios, exit loads and taxes are not included.',
  ],
  faqs: [
    {
      question: 'How is SIP return calculated?',
      answer:
        'Each monthly instalment grows at the monthly rate (the yearly rate divided by 12) until the end. The total is P x ((1 + i)^n - 1) / i x (1 + i), where P is the SIP, i the monthly rate and n the number of months.',
    },
    {
      question: 'What is a step-up SIP?',
      answer:
        'A SIP whose amount increases every year by a fixed percent, usually in line with salary increases.',
    },
    {
      question: 'Is SIP better than lumpsum?',
      answer:
        'A SIP spreads purchases over time and suits monthly income; a lumpsum invests everything at once. Compare both here with the same rate and years.',
    },
  ],
  variants: [
    {
      slug: 'lumpsum-calculator',
      preset: 'lumpsum',
      label: 'Lumpsum calculator',
      h1: 'Lumpsum calculator: growth of a one-time investment',
      seoTitle: 'Lumpsum Calculator: one-time investment returns, free | NiftyFix',
      seoDescription:
        'Calculate what a one-time mutual fund investment grows to at an expected return, with a year-by-year table and its value after inflation. Free.',
      intro:
        "Enter a one-time investment, the expected yearly return and the number of years to see its future value, the gains, and a year-by-year table, plus what the amount is worth in today's money after inflation.",
      faqs: [
        {
          question: 'How is a lumpsum return calculated?',
          answer:
            'Final value = amount x (1 + annual return) to the power of the number of years. For example, 100,000 at 12% a year for 10 years grows to about 310,585, in any currency. The year-by-year table shows how it builds.',
        },
      ],
    },
    {
      slug: 'step-up-sip-calculator',
      preset: 'step-up',
      label: 'Step-up SIP calculator',
      h1: 'Step-up SIP calculator',
      seoTitle: 'Step-up SIP Calculator: SIP with yearly increase | NiftyFix',
      seoDescription:
        'See how a SIP that increases every year grows: set the monthly amount, the yearly step-up, return and time. Year-by-year table included. Free.',
      intro:
        'A step-up SIP raises your monthly amount every year, usually with your salary. It starts here at a 10% yearly step-up: change the amount, step-up, return and years to see how much more it builds than a flat SIP.',
      faqs: [
        {
          question: 'Is a step-up SIP better than a regular SIP?',
          answer:
            'For the same starting amount, yes: raising the SIP each year as your income grows adds bigger instalments that still have years left to compound. Compare both here with your own numbers; the table shows the difference year by year.',
        },
      ],
    },
  ],
});
