import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'calculators.gst-calculator',
  version: 1,
  slug: 'gst-calculator',
  category: 'calculators',
  status: 'live',
  name: 'GST Calculator',
  h1: 'GST calculator: add or remove GST',
  tagline:
    'Add GST to a price or take it out of a GST-inclusive price, at 5%, 18%, 40% or any rate, with the CGST, SGST or IGST split.',
  seoTitle: 'GST Calculator India: 5%, 18%, 40%, add or remove GST | NiftyFix',
  seoDescription:
    'Calculate GST on a price or remove GST from an inclusive amount at the new 5%, 18% and 40% rates, with CGST, SGST and IGST. Free, instant.',
  searchAliases: [
    'gst calculator',
    'gst calculator india',
    'reverse gst calculator',
    'gst inclusive calculator',
    'remove gst from price',
    'cgst sgst calculator',
    '18 percent gst calculator',
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
  related: ['calculators.emi-calculator'],
});
