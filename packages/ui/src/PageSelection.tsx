import { pageRangeSyntaxError } from '@niftyfix/engine-pdf/pages';
import { SegmentedControl, TextInput } from './fields';

export interface PageSelectionValue {
  mode: 'all' | 'custom';
  /** e.g. "1-3, 5, 8-" (1-based). */
  ranges: string;
}

export const ALL_PAGES: PageSelectionValue = { mode: 'all', ranges: '' };

/** Syntax error for the current selection, or null. Bounds are checked in the worker. */
export const pageSelectionError = (value: PageSelectionValue): string | null =>
  value.mode === 'all' ? null : pageRangeSyntaxError(value.ranges);

export interface PageSelectionProps {
  label: string;
  value: PageSelectionValue;
  onChange(value: PageSelectionValue): void;
  /** Label of the "all" option, e.g. "All pages". */
  allLabel?: string;
}

/** "All pages" or a typed selection such as "1-3, 5, 8-". */
export function PageSelection({
  label,
  value,
  onChange,
  allLabel = 'All pages',
}: PageSelectionProps) {
  const error = pageSelectionError(value);
  return (
    <div class="flex flex-col gap-3">
      <SegmentedControl
        label={label}
        value={value.mode}
        options={[
          { value: 'all', label: allLabel },
          { value: 'custom', label: 'Choose pages' },
        ]}
        onChange={(mode) => onChange({ ...value, mode })}
      />
      {value.mode === 'custom' ? (
        <TextInput
          label="Pages"
          value={value.ranges}
          placeholder="e.g. 1-3, 5, 8-"
          error={value.ranges.trim() === '' ? undefined : (error ?? undefined)}
          hint='Separate with commas. "8-" means page 8 to the end.'
          onChange={(ranges) => onChange({ ...value, ranges })}
          testId="page-ranges"
        />
      ) : null}
    </div>
  );
}
