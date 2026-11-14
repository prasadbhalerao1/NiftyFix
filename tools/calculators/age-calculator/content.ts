import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Enter a date of birth to see the exact age today, or on any other date, in completed years, months and days, the way forms and offices count it. You also get the total months, weeks, days and hours, the weekday you were born, and how many days remain until the next birthday. For government exams and job forms, set the cut-off date and the age limits to check eligibility and see the exact range of birth dates allowed.',
  howTo: [
    'Enter the date of birth.',
    'Keep today as the "age on" date, or set any date such as an exam cut-off.',
    'Read the age in years, months and days, and the totals.',
    'For an exam, enter the minimum and maximum age to check eligibility.',
  ],
  options: [
    {
      name: 'Age on',
      description:
        'Any date, past or future. Exam notifications state the date the age is counted on (often 1 January or 1 August of the exam year).',
    },
    {
      name: 'Minimum and maximum age',
      description:
        'The age limits from the notification, after adding any relaxation for your category. The tool shows the earliest and latest dates of birth that qualify, both days included.',
    },
  ],
  example: {
    title: 'Example',
    input: 'Born 15 August 1995, age on 13 November 2026',
    settings: 'Age 21 to 32 on 1 August 2026',
    output:
      '31 years, 2 months and 29 days; eligible if born between 2 August 1993 and 1 August 2005',
  },
  limits: [
    'Someone born on 29 February has their birthday on 28 February in years without a 29th, as most offices count it.',
  ],
  faqs: [
    {
      question: 'How do I calculate age in Excel?',
      answer:
        'Use =DATEDIF(A1,TODAY(),"Y") for completed years, where A1 holds the date of birth. "YM" and "MD" in place of "Y" give the extra months and days.',
    },
    {
      question: 'How is age counted in years, months and days?',
      answer:
        'Completed years first, then completed months, then the days left over. A birthday on the 31st counts as the last day of shorter months.',
    },
    {
      question: 'How do I calculate my age as on a date for an exam?',
      answer:
        'Set "Age on" to the cut-off date from the notification. The age shown is your age on that day, which is what eligibility rules use.',
    },
    {
      question: 'What does "age between 21 and 32" include?',
      answer:
        'You must have turned 21 by the cut-off date and must not have turned 33. The tool converts this into the exact date-of-birth range.',
    },
  ],
  variants: [
    {
      slug: 'age-calculator-for-exam',
      preset: 'exam',
      label: 'Age calculator for exams',
      h1: 'Age calculator for exams: age as on cut-off date and eligibility',
      seoTitle: 'Age Calculator for Exams: age as on cut-off date | NiftyFix',
      seoDescription:
        'Calculate your age as on an exam cut-off date and check the minimum and maximum age limit, with the exact eligible date-of-birth range. Free.',
      intro:
        'Government and job exam notifications set an age limit counted on a cut-off date. Enter your date of birth, the cut-off date from the notification, and the minimum and maximum age (after any category relaxation): you get your exact age on that day, whether you are eligible, and the range of birth dates that qualify.',
      faqs: [
        {
          question: 'How is age calculated for an exam?',
          answer:
            'Exams count your completed age on a cut-off date printed in the notice, such as 1 August of the exam year, not on the day you apply. Enter that date as the age-on date: the years, months and days shown are what the age limit is checked against.',
        },
      ],
    },
  ],
});
