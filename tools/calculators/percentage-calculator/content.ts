import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Six percentage calculators on one page, each answering as you type: X% of a number, what percent one number is of another, the percentage increase or decrease between two numbers, a number plus or minus a percent (discounts, tips, raises), the original amount before a percent was added (the price before GST), and your marks as a percentage.',
  howTo: [
    'Find the sentence that matches your question.',
    'Type the numbers into its boxes.',
    'Read the answer on the right; it updates as you type.',
  ],
  options: [
    {
      name: 'Percentage change',
      description:
        'The change from the first number to the second, as a percent of the first: 80 to 100 is a 25% increase; 100 to 80 is a 20% decrease.',
    },
    {
      name: 'Before the percent was added',
      description:
        'Divides by (1 + percent/100), not by subtracting the percent: a price of 1,180 including 18% GST was 1,000 before tax, not 967.6.',
    },
  ],
  example: {
    title: 'Example',
    input: '432 marks out of 500',
    settings: 'Marks percentage',
    output: '86.4%',
  },
  limits: ['Answers are rounded to 4 decimal places.'],
  faqs: [
    {
      question: 'How do I calculate a percentage in Excel?',
      answer:
        'For what percent A1 is of B1, use =A1/B1 and format the cell as a percentage. For 15% of a number, use =B1*15%. For the change from an old to a new value, use =(New-Old)/Old.',
    },
    {
      question: 'How do I calculate a percentage?',
      answer:
        'Divide the part by the whole and multiply by 100: 45 out of 60 is 45 / 60 x 100 = 75%.',
    },
    {
      question: 'How do I calculate percentage increase?',
      answer:
        'Subtract the old value from the new, divide by the old value, and multiply by 100. From 80 to 100: 20 / 80 x 100 = 25%.',
    },
    {
      question: 'How do I calculate marks percentage?',
      answer:
        'Add up your marks, divide by the maximum marks, and multiply by 100. 432 out of 500 is 86.4%. For CGPA conversions, use the formula your board or university publishes.',
    },
  ],
  variants: [
    {
      slug: 'marks-percentage-calculator',
      preset: 'marks',
      label: 'Marks percentage',
      h1: 'Marks percentage calculator',
      seoTitle: 'Marks Percentage Calculator: marks to percent, free | NiftyFix',
      seoDescription:
        'Convert marks to a percentage: enter marks obtained and total marks to get your percentage instantly, for board exams, semesters and job forms.',
      intro:
        'Enter the marks you obtained and the total (maximum) marks to get your percentage instantly, as board exam results, semester mark sheets and job application forms ask for it. The other percentage calculators are below if you need them.',
      faqs: [
        {
          question: 'How do I calculate the percentage of my marks?',
          answer:
            'Add the marks you scored, divide by the total maximum marks and multiply by 100. For 425 out of 500: 425 / 500 x 100 = 85%. Type your marks and the total, and the percentage appears as you type.',
        },
      ],
    },
  ],
});
