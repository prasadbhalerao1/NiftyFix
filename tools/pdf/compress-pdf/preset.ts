/** Size presets used by the intent pages, e.g. "target-200kb" or "target-1mb". */
const TARGET_PRESET = /^target-(\d{1,4})(kb|mb)$/;

export interface TargetPreset {
  amount: number;
  unit: 'KB' | 'MB';
}

export function parseTargetPreset(preset: string | undefined): TargetPreset | null {
  const match = preset === undefined ? null : TARGET_PRESET.exec(preset);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2] === 'mb' ? 'MB' : 'KB';
  // Below 10 KB nothing can be promised; the form would reject it anyway.
  return amount * (unit === 'MB' ? 1000 : 1) >= 10 ? { amount, unit } : null;
}
