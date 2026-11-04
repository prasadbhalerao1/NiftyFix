import type { ExecutionMode } from '@niftyfix/registry';

/** How a planned tool will work once it ships, as headings for grouping. */
export const MODE_GROUPS: readonly { mode: ExecutionMode; title: string }[] = [
  { mode: 'browser', title: 'Will run on your device' },
  { mode: 'server', title: 'Will need an upload to our servers' },
  { mode: 'ai', title: 'Will use an AI model' },
  { mode: 'gated', title: 'Under licence or legal review' },
];
