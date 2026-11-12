import { defineManifest } from '@niftyfix/tool-sdk';

export default defineManifest({
  id: 'calculators.sip-calculator',
  version: 1,
  slug: 'sip-calculator',
  category: 'calculators',
  status: 'live',
  name: 'SIP Calculator',
  h1: 'SIP calculator: see what your monthly investment grows to',
  tagline:
    'Work out what a monthly SIP, a step-up SIP or a lumpsum grows to, how much SIP a goal needs, and what it is worth after inflation.',
  seoTitle: 'SIP Calculator: SIP, step-up and lumpsum returns, free | NiftyFix',
  seoDescription:
    'Calculate mutual fund SIP returns with step-up, lumpsum and goal planning, a year-by-year table and inflation-adjusted value. Free, no sign-up.',
  searchAliases: [
    'sip calculator',
    'step up sip calculator',
    'lumpsum calculator',
    'mutual fund calculator',
    'sip return calculator',
    'goal sip calculator',
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
    'calculators.emi-calculator',
    'calculators.percentage-calculator',
    'calculators.gst-calculator',
  ],
});
