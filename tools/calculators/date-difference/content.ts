import { defineContent } from '@niftyfix/tool-sdk';

export default defineContent({
  intro:
    'Pick two dates to count the days between them, with the same span in weeks, hours and minutes, and the number of working days after skipping weekends and any holidays you list. Or pick one date and add or subtract years, months, weeks and days to find the resulting date and its weekday, such as 90 days from today for a notice period or a visa.',
  howTo: [
    'For a difference, choose the from and to dates; tick "Include the end date" to count both days.',
    'Choose the weekend and list any holidays to get working days.',
    'To find a future or past date, choose a start date and add or subtract time.',
  ],
  options: [
    {
      name: 'Include the end date',
      description:
        '1 to 3 January is 2 days apart, but 3 days if you count both ends, as for leave applications, hotel nights and rental periods.',
    },
    {
      name: 'Weekend and holidays',
      description:
        'Working days skip Saturday and Sunday, Sunday only (six-day weeks), or nothing, plus any dates you list as holidays.',
    },
  ],
  example: {
    title: 'Example',
    input: '1 January to 31 January 2026, both days included',
    settings: 'Saturday and Sunday off, holiday 2026-01-26',
    output: '31 days; 21 working days',
  },
  limits: [
    'Months added to the 31st land on the last day of shorter months (31 January + 1 month = 28 February).',
  ],
  faqs: [
    {
      question: 'How do I calculate the days between two dates in Excel?',
      answer:
        'Subtract them: =B1-A1, or use =DAYS(B1,A1). For working days use =NETWORKDAYS(A1,B1), which skips Saturdays and Sundays and can also take a list of holidays.',
    },
    {
      question: 'How many days are there between two dates?',
      answer:
        'Choose both dates above. The count excludes the end date unless you tick "Include the end date".',
    },
    {
      question: 'How do I find the date 90 days from today?',
      answer:
        'Under "Add or subtract time", keep today as the start date and enter 90 days. The result shows the date and its weekday.',
    },
    {
      question: 'How are working days counted?',
      answer:
        'Every day in the range that is not a weekend day you chose and not in your holiday list.',
    },
  ],
});
