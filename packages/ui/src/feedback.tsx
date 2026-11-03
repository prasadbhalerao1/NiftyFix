import type { ComponentChildren } from 'preact';
import type { SerializedToolError, VerificationCheck } from '@niftyfix/tool-sdk';
import { Button } from './Button';
import { cx } from './cx';
import { useFocusOnMount } from './focus';

export interface ProgressBarProps {
  /** 0–1, or null for indeterminate. */
  value: number | null;
  label: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const percent = value === null ? null : Math.round(value * 100);
  return (
    <div class="flex flex-col gap-2" role="status" aria-live="polite">
      <div class="flex justify-between text-sm">
        <span>{label}</span>
        {percent !== null ? (
          <span class="tabular-nums text-stone-600 dark:text-stone-400">{percent}%</span>
        ) : null}
      </div>
      <div
        class="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
      >
        <div
          class={cx(
            'h-full rounded-full bg-teal-600 transition-[width] duration-200',
            percent === null && 'w-1/3 animate-pulse',
          )}
          style={percent === null ? undefined : { width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export interface ErrorViewProps {
  error: SerializedToolError;
  onRetry?: (() => void) | undefined;
  /** Scroll to and focus the error when it appears (use when it renders away from the trigger). */
  focusOnMount?: boolean;
}

export function ErrorView({ error, onRetry, focusOnMount = false }: ErrorViewProps) {
  const ref = useFocusOnMount<HTMLDivElement>(focusOnMount);
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      class="rounded-[var(--radius-panel)] border border-red-300 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50"
      data-testid="error-view"
      data-error-code={error.code}
    >
      <p class="font-medium text-red-900 dark:text-red-200">{error.message}</p>
      {error.hint ? <p class="mt-1 text-sm text-red-800 dark:text-red-300">{error.hint}</p> : null}
      {onRetry && error.retryable ? (
        <div class="mt-3">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const STATUS_STYLE: Record<
  VerificationCheck['status'],
  { icon: string; text: string; label: string }
> = {
  pass: { icon: '✓', text: 'text-emerald-700 dark:text-emerald-400', label: 'Passed' },
  fail: { icon: '✗', text: 'text-red-700 dark:text-red-400', label: 'Failed' },
  'not-checked': { icon: '–', text: 'text-stone-500', label: 'Not checked' },
};

/** The checklist that proves (or disproves) each requested requirement on the produced file. */
export function ValidationReport({ checks }: { checks: readonly VerificationCheck[] }) {
  return (
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm" data-testid="validation-report">
        <caption class="mb-2 text-left text-sm font-semibold">Validation report</caption>
        <thead class="text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th scope="col" class="py-2 pr-3 font-medium">
              Requirement
            </th>
            <th scope="col" class="py-2 pr-3 font-medium">
              Required
            </th>
            <th scope="col" class="py-2 pr-3 font-medium">
              Your file
            </th>
            <th scope="col" class="py-2 font-medium">
              Result
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-200 dark:divide-stone-800">
          {checks.map((check) => {
            const style = STATUS_STYLE[check.status];
            return (
              <tr key={check.id} data-check={check.id} data-status={check.status}>
                <th scope="row" class="py-2 pr-3 font-medium">
                  {check.label}
                </th>
                <td class="py-2 pr-3 tabular-nums">{check.required}</td>
                <td class="py-2 pr-3 tabular-nums">
                  {check.actual}
                  {check.note ? (
                    <span class="block text-xs text-stone-500">{check.note}</span>
                  ) : null}
                </td>
                <td class={cx('py-2 font-medium whitespace-nowrap', style.text)}>
                  <span aria-hidden="true">{style.icon} </span>
                  {style.label}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Panel({
  title,
  children,
  class: className,
}: {
  title?: string;
  children: ComponentChildren;
  class?: string;
}) {
  return (
    <section
      class={cx(
        'rounded-[var(--radius-panel)] border border-stone-200 bg-white p-4 sm:p-5 dark:border-stone-800 dark:bg-stone-900',
        className,
      )}
    >
      {title ? <h2 class="mb-4 text-base font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}

export function FactList({ facts }: { facts: readonly { label: string; value: string }[] }) {
  return (
    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {facts.map((fact) => (
        <div key={fact.label} class="contents">
          <dt class="text-stone-600 dark:text-stone-400">{fact.label}</dt>
          <dd class="tabular-nums">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
