import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Before taking a loan, it helps to know the monthly EMI and how much of what you repay is interest. Enter the loan amount, the interest rate and the tenure; the EMI, total interest and total payment update as you type, with a year-by-year table of how each year splits between principal and interest.',
  howTo: [
    'Enter the loan amount in rupees.',
    'Enter the yearly interest rate your bank quotes, for example 8.5.',
    'Enter the tenure in years or months.',
    'Read your EMI, total interest and total payment, and the year-by-year breakdown.',
  ],
  options: [
    {
      name: 'How EMI is calculated',
      description:
        'The standard reducing-balance formula banks use: EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r the monthly rate (yearly rate ÷ 12 ÷ 100) and n the number of months.',
    },
    {
      name: 'Year by year',
      description:
        'Each EMI pays the interest due that month, and the rest reduces the loan. Early years are mostly interest; later years mostly principal.',
    },
  ],
  example: {
    title: 'Example',
    input: '₹10,00,000 at 10% a year for 10 years',
    settings: '120 monthly instalments',
    output: 'EMI of ₹13,215; total interest about ₹5,85,809',
  },
  limits: [
    'Assumes a fixed rate for the whole tenure. Floating-rate loans change their EMI or tenure when the rate changes.',
    'Processing fees, insurance and prepayment charges are not included; ask your bank for the full cost.',
    'Banks may round the EMI or calculate the first and last instalments slightly differently, so their figure can differ by a few rupees.',
  ],
  faqs: [
    {
      question: 'Does paying more each month save interest?',
      answer:
        'Yes. Interest is charged on the outstanding balance, so prepaying principal early reduces the interest on every later month. Check your loan terms for prepayment charges first.',
    },
    {
      question: 'Is my data saved anywhere?',
      answer: 'No. The calculation runs in your browser; nothing you enter is sent anywhere.',
    },
  ],
  variants: [
    {
      slug: 'home-loan-emi-calculator',
      preset: 'home',
      label: 'Home loan',
      h1: 'Home loan EMI calculator',
      seoTitle: 'Home loan EMI calculator with yearly breakdown, free | NiftyFix',
      seoDescription:
        'Calculate your home loan EMI, total interest and yearly principal and interest split for tenures up to 30 years. Free.',
      intro:
        'Home loans run for 15 to 30 years, so a small change in rate makes a large difference to the total interest. This page opens with a ₹30 lakh loan at 8.5% for 20 years; change any figure to see your own EMI.',
      faqs: [
        {
          question: 'Should I choose a longer tenure for a lower EMI?',
          answer:
            'A longer tenure lowers the EMI but raises the total interest considerably. Compare the total interest figure for both tenures before deciding.',
        },
      ],
    },
    {
      slug: 'car-loan-emi-calculator',
      preset: 'car',
      label: 'Car loan',
      h1: 'Car loan EMI calculator',
      seoTitle: 'Car loan EMI calculator, free | NiftyFix',
      seoDescription:
        'Calculate your car loan EMI, total interest and total payment for any amount, rate and tenure. Free, instant.',
      intro:
        'Car loans are usually for 3 to 7 years. This page opens with an ₹8 lakh loan at 9% for 5 years; enter your on-road loan amount and the rate the lender quotes.',
      faqs: [
        {
          question: 'Is the EMI the same as the total cost of the car?',
          answer:
            'No. The EMI repays the loan amount plus interest. Your down payment, insurance and registration are paid separately.',
        },
      ],
    },
    {
      slug: 'personal-loan-emi-calculator',
      preset: 'personal',
      label: 'Personal loan',
      h1: 'Personal loan EMI calculator',
      seoTitle: 'Personal loan EMI calculator, free | NiftyFix',
      seoDescription:
        'Calculate your personal loan EMI and total interest for any amount, rate and tenure. Free and instant, nothing is stored.',
      intro:
        'Personal loans carry higher rates and shorter tenures than secured loans. This page opens with a ₹3 lakh loan at 12% for 3 years; enter the offer you have.',
      faqs: [
        {
          question: 'Why is the interest so high on a personal loan?',
          answer:
            'Personal loans are unsecured (no property or vehicle backs them), so lenders charge a higher rate. Even a 1% lower rate saves noticeably over the tenure.',
        },
      ],
    },
  ],
});
