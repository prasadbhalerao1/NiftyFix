import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';
import { cx } from './cx';

const CONTROL =
  'min-h-11 w-full rounded-[var(--radius-control)] border border-stone-300 bg-white px-3 text-base tabular-nums text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 aria-[invalid=true]:border-red-600';

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: ComponentChildren;
}

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div class="flex flex-col gap-1.5">
      <label for={id} class="text-sm font-medium text-stone-800 dark:text-stone-200">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} class="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} class="text-xs text-stone-600 dark:text-stone-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface NumberInputProps {
  label: string;
  value: number | null;
  onChange(value: number | null): void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  placeholder?: string;
  hint?: string;
  error?: string | undefined;
  testId?: string;
}

/** Numeric field that allows empty (null) values; parsing is lenient, validation is the caller's job. */
export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  placeholder,
  hint,
  error,
  testId,
}: NumberInputProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div class="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          class={cx(CONTROL, suffix && 'pr-12')}
          value={value ?? ''}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          data-testid={testId}
          onInput={(event) => {
            const raw = event.currentTarget.value.trim();
            const parsed = raw === '' ? null : Number(raw);
            onChange(parsed === null || Number.isNaN(parsed) ? null : parsed);
          }}
        />
        {suffix ? (
          <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-stone-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
}

export interface SelectInputProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange(value: T): void;
  hint?: string;
  testId?: string;
}

export function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
  testId,
}: SelectInputProps<T>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint}>
      <select
        id={id}
        class={CONTROL}
        value={value}
        data-testid={testId}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.currentTarget.value);
          if (next) onChange(next.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export interface TextInputProps {
  label: string;
  value: string;
  onChange(value: string): void;
  hint?: string;
  error?: string | undefined;
  placeholder?: string;
  testId?: string;
}

export function TextInput({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  testId,
}: TextInputProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        type="text"
        class={CONTROL}
        value={value}
        placeholder={placeholder}
        spellcheck={false}
        autocomplete="off"
        aria-invalid={error ? 'true' : 'false'}
        data-testid={testId}
        onInput={(event) => onChange(event.currentTarget.value)}
      />
    </FieldShell>
  );
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string; disabled?: boolean }[];
  onChange(value: T): void;
}

/** A small radio group rendered as segments (keyboard: arrows move between options natively). */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset class="flex flex-col gap-1.5">
      <legend class="mb-1.5 text-sm font-medium text-stone-800 dark:text-stone-200">{label}</legend>
      <div class="inline-flex rounded-[var(--radius-control)] border border-stone-300 bg-white p-1 dark:border-stone-700 dark:bg-stone-900">
        {options.map((option) => (
          <label
            key={option.value}
            class={cx(
              'flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-teal-600',
              option.value === value
                ? 'bg-teal-700 text-white dark:bg-teal-500 dark:text-stone-950'
                : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
              option.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              type="radio"
              class="sr-only"
              name={name}
              value={option.value}
              checked={option.value === value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format(value: number): string;
  onChange(value: number): void;
  hint?: string;
}

export function RangeInput({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  hint,
}: RangeInputProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={`${label}: ${format(value)}`} hint={hint}>
      <input
        id={id}
        type="range"
        class="h-11 w-full accent-teal-700"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onInput={(event) => onChange(Number(event.currentTarget.value))}
      />
    </FieldShell>
  );
}
