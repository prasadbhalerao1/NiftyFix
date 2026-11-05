import { describe, expect, it } from 'vitest';
import { parseTargetPreset } from '../src/bytes';

describe('parseTargetPreset', () => {
  it('reads KB and MB targets', () => {
    expect(parseTargetPreset('target-200kb')).toEqual({ amount: 200, unit: 'KB' });
    expect(parseTargetPreset('target-1mb')).toEqual({ amount: 1, unit: 'MB' });
  });

  it('ignores unknown presets and targets below 10 KB', () => {
    for (const preset of [undefined, '', 'max-50kb', 'target-5kb', 'target-200gb'])
      expect(parseTargetPreset(preset)).toBeNull();
  });
});
