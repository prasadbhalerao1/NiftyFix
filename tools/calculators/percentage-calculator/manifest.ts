import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'calculators.percentage-calculator',
  version: 1,
  slug: 'percentage-calculator',
  category: 'calculators',
  status: 'live',
  name: 'Percentage Calculator',
  h1: 'Percentage calculator: every percent question in one place',
  tagline:
    'Work out X% of a number, what percent one number is of another, percentage increase or decrease, discounts, the price before tax, and marks percentage.',
  seoTitle: 'Percentage Calculator: percent, change, marks, free | NiftyFix',
  seoDescription:
    'Calculate X% of a number, what percent X is of Y, percentage increase or decrease, add or remove a percent, the price before GST, and marks percentage.',
  searchAliases: [
    'percentage calculator',
    'percentage increase calculator',
    'marks percentage calculator',
    'what percent of',
    'percent of a number',
    'reverse percentage calculator',
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
  related: [
    'calculators.gst-calculator',
    'calculators.emi-calculator',
    'calculators.age-calculator',
  ],
});
