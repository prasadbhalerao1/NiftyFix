import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'calculators.date-difference',
  version: 1,
  slug: 'date-difference',
  category: 'calculators',
  status: 'live',
  name: 'Date Calculator',
  h1: 'Date calculator: days between dates, add days, working days',
  tagline:
    'Count the days, weeks and months between two dates, working days without weekends and holidays, or find the date a number of days from now.',
  seoTitle: 'Days Between Dates Calculator: add days, working days | NiftyFix',
  seoDescription:
    'Count days between two dates, working days without weekends and holidays, and add or subtract days, weeks, months or years from any date. Free.',
  searchAliases: [
    'days between dates',
    'date calculator',
    'add days to date',
    'working days calculator',
    'date difference calculator',
    '90 days from today',
  ],
  input: { kind: 'interactive' },
  output: { formats: [] },
  execution: 'browser',
  privacy: 'on-device',
  engine: 'data',
  capabilities: {
    batch: false,
    cancellable: false,
    progress: 'determinate',
    verifiesOutput: false,
  },
  related: ['calculators.age-calculator', 'calculators.percentage-calculator'],
});
