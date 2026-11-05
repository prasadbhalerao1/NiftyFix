import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'calculators.emi-calculator',
  version: 1,
  slug: 'emi-calculator',
  category: 'calculators',
  status: 'live',
  name: 'EMI Calculator',
  h1: 'EMI calculator for home, car and personal loans',
  tagline:
    'Work out your monthly EMI, total interest and total payment for any loan, with a year-by-year breakdown.',
  seoTitle: 'EMI Calculator: home, car and personal loan EMI, free | NiftyFix',
  seoDescription:
    'Calculate loan EMI, total interest and total payment instantly, with a yearly principal and interest breakdown. For home, car and personal loans.',
  searchAliases: [
    'emi calculator',
    'loan emi calculator',
    'home loan emi calculator',
    'car loan emi calculator',
    'personal loan emi calculator',
    'mortgage calculator',
    'loan calculator',
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
  related: [],
});
