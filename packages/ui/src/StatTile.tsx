import { cx } from './cx';

/** One figure in a results grid. The value replays a short tick when it changes. */
export function StatTile({
  label,
  value,
  hint,
  emphasis = false,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
  testId?: string;
}) {
  return (
    <div
      class={cx(
        'flex flex-col gap-1 rounded-[var(--radius-control)] border px-3 py-2.5',
        emphasis
          ? 'border-brand-300 bg-brand-50 dark:border-brand-800 dark:bg-brand-950'
          : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950',
      )}
    >
      <span class="text-xs text-stone-600 dark:text-stone-400">{label}</span>
      <span class="text-xl font-semibold tabular-nums" data-testid={testId}>
        <span key={value} class="nf-tick">
          {value}
        </span>
      </span>
      {hint ? <span class="text-xs text-stone-600 dark:text-stone-400">{hint}</span> : null}
    </div>
  );
}
