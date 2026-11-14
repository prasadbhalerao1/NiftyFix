import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'To calculate EMI, enter the loan amount, interest rate and tenure: the monthly EMI, total interest and year-by-year schedule appear at once. Know your EMI, and then the two decisions that change what a loan really costs. Should a part-prepayment cut your tenure or your EMI? And when a floating rate rises, should you accept a longer loan or a higher EMI? Enter the loan once and see the EMI, total interest, both decisions side by side in money and months, and a year-by-year breakdown. It works in rupees, dollars, pounds and euros, and has a Home mode for a mortgage with a down payment, property tax, insurance and PMI.',
  howTo: [
    'Choose your currency, then enter the loan amount (or choose Home for a mortgage).',
    'Enter the yearly interest rate your bank quotes, for example 8.5.',
    'Enter the tenure in years or months.',
    'Read your EMI, total interest and total payment.',
    'Under Prepay and save, enter a prepayment to compare reducing the tenure with reducing the EMI.',
    'Under If your rate changes, enter a new rate to see the cost of a longer loan against a higher EMI.',
  ],
  options: [
    {
      name: 'How EMI is calculated',
      description:
        'The standard reducing-balance formula banks use: EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r the monthly rate (yearly rate ÷ 12 ÷ 100) and n the number of months.',
    },
    {
      name: 'Prepay and save',
      description:
        'A one-time prepayment at the end of a year, and an optional extra amount every year. The table shows when the loan ends, the EMI and the interest saved if the bank reduces your tenure, or reduces your EMI instead.',
    },
    {
      name: 'If your rate changes',
      description:
        'For floating-rate loans. Many banks keep the EMI the same when rates rise and make the loan longer. The table compares that with paying a higher EMI and finishing on time, and warns when the old EMI would no longer cover the interest at all.',
    },
    {
      name: 'Currency',
      description:
        'Rupees, US, Canadian and Australian dollars, pounds or euros, written the way each country writes them (₹12,34,567 or $1,234,567). The maths is the same in every currency; your choice is remembered on this device.',
    },
    {
      name: 'Home (mortgage)',
      description:
        'Enter the home price and down payment or deposit instead of the loan amount. In dollars you can add property tax, homeowners insurance, PMI and HOA dues for the full monthly payment (PITI). Outside India you can also choose an interest-only mortgage.',
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
      question: 'What is the EMI formula?',
      answer:
        'EMI = P x r x (1 + r)^n / ((1 + r)^n - 1), where P is the loan amount, r the monthly interest rate (annual rate / 12 / 100) and n the number of months. The calculator applies it and shows the full schedule.',
    },
    {
      question: 'Is an EMI the same as a monthly loan payment?',
      answer:
        'Yes. EMI (equated monthly instalment) is the Indian name for the fixed monthly payment on a loan or mortgage. The maths is the same everywhere; amounts here are labelled in rupees, but any currency works.',
    },
    {
      question: 'Should a prepayment reduce my tenure or my EMI?',
      answer:
        'Reducing the tenure saves more interest, because the full EMI keeps paying the loan down. Reducing the EMI eases your monthly budget instead. Enter your prepayment under Prepay and save to see the difference in rupees. RBI does not allow prepayment charges on floating-rate home loans taken by individuals; check your terms for other loans.',
    },
    {
      question: 'My bank increased my tenure after a rate hike. What does that cost?',
      answer:
        'Enter your loan and the new rate under If your rate changes. It shows how much longer the loan runs and how much extra interest you pay, compared with raising the EMI. You can ask your bank to raise the EMI instead.',
    },
    {
      question: 'Does it work in dollars, pounds or euros?',
      answer:
        'Yes. Choose the currency at the top; it changes the symbol and digit grouping, and outside rupees the labels say payment and term instead of EMI and tenure. The calculation is the same reducing-balance formula lenders use everywhere.',
    },
    {
      question: 'Is my data saved anywhere?',
      answer:
        'No. The calculation runs in your browser; nothing you enter is sent anywhere. Only your currency choice is remembered, on this device.',
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
    {
      slug: 'mortgage-calculator',
      preset: 'mortgage',
      label: 'Mortgage (US)',
      h1: 'Mortgage calculator with taxes, insurance and PMI',
      seoTitle: 'Mortgage Calculator: payment with tax, insurance, PMI | NiftyFix',
      seoDescription:
        'Calculate your monthly mortgage payment with property tax, homeowners insurance, PMI and HOA, plus extra payments and an amortization table. Free.',
      intro:
        'To calculate a mortgage payment, enter the home price, down payment, rate and term: the principal and interest, and the full monthly payment with property tax, insurance, PMI and HOA (PITI), appear at once. This page opens on a $400,000 home with 20% down at 6.5% for 30 years; change any figure to see your own.',
      faqs: [
        {
          question: 'When does PMI stop?',
          answer:
            'On a conventional loan, PMI is charged when you put down less than 20%. Under the Homeowners Protection Act your lender must end it once the scheduled balance reaches 78% of the original home value, and you can ask to cancel it at 80%. The calculator shows roughly how many years you would pay it.',
        },
        {
          question: 'How much does an extra $100 a month save?',
          answer:
            'On a $300,000 loan at 7% for 30 years, an extra $100 every month pays it off about 4 years early and saves about $69,000 in interest. Enter your own figure under Overpay and save.',
        },
        {
          question: 'What is PITI?',
          answer:
            'Principal, interest, taxes and insurance: the full monthly housing payment lenders use to judge whether you can afford a loan. HOA dues, if any, come on top.',
        },
      ],
    },
    {
      slug: 'mortgage-calculator-uk',
      preset: 'uk-mortgage',
      label: 'Mortgage (UK)',
      h1: 'Mortgage calculator UK: monthly repayments and overpayments',
      seoTitle: 'Mortgage Calculator UK: repayments, overpayments, free | NiftyFix',
      seoDescription:
        'Work out UK mortgage monthly repayments in pounds, repayment or interest only, with loan to value, overpayment savings and a yearly balance table.',
      intro:
        'To work out your mortgage repayments, enter the property price, your deposit, the rate and the term: the monthly repayment, total interest and loan to value appear at once. This page opens in pounds on a £300,000 home with a 10% deposit at 4.5% over 25 years. Switch to interest only, or add a monthly overpayment to see how much sooner you finish.',
      faqs: [
        {
          question: 'Should I overpay my mortgage?',
          answer:
            'Overpaying cuts the balance that interest is charged on, so it shortens the mortgage and saves interest. Many UK fixed-rate deals allow overpayments of up to 10% of the balance a year without an early repayment charge; check your own deal first.',
        },
        {
          question: 'What is the difference between repayment and interest only?',
          answer:
            'A repayment mortgage pays off interest and some of the loan every month, so it is cleared by the end of the term. An interest-only mortgage costs less a month, but the whole loan is still owed at the end and must be repaid another way.',
        },
      ],
    },
    {
      slug: 'loan-calculator',
      preset: 'loan',
      label: 'Loan',
      h1: 'Loan calculator: monthly payment and total interest',
      seoTitle: 'Loan Calculator: monthly payment, interest, payoff | NiftyFix',
      seoDescription:
        'Calculate the monthly payment, total interest and payoff schedule for any loan, in dollars, pounds, euros or rupees, with extra payments. Free.',
      intro:
        'To calculate a loan payment, enter the amount, the yearly interest rate and the term: the monthly payment, total interest and a year-by-year payoff schedule appear at once. It works for personal, auto, student and business loans in your currency.',
      faqs: [
        {
          question: 'How is a monthly loan payment calculated?',
          answer:
            'Payment = P x r x (1 + r)^n / ((1 + r)^n - 1), where P is the amount borrowed, r the monthly rate (APR / 12 / 100) and n the number of months. Each payment covers the interest for that month first; the rest reduces the balance.',
        },
      ],
    },
  ],
});
