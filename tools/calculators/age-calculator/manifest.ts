import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'calculators.age-calculator',
  version: 1,
  slug: 'age-calculator',
  category: 'calculators',
  status: 'live',
  name: 'Age Calculator',
  h1: 'Age calculator: exact age in years, months and days',
  tagline:
    'Find your exact age on any date in years, months and days, with totals, your next birthday, and exam age-limit eligibility.',
  seoTitle: 'Age Calculator: exact age on any date, free | NiftyFix',
  seoDescription:
    'Calculate exact age in years, months and days on any date, with total days, next birthday and the weekday you were born. Check exam age eligibility.',
  searchAliases: [
    'age calculator',
    'age calculator as on date',
    'date of birth calculator',
    'how old am i',
    'age calculator for exam',
    'age eligibility calculator',
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
  related: ['calculators.emi-calculator', 'calculators.gst-calculator', 'forms.photo-resizer'],
});
