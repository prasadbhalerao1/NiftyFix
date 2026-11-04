import type { ComponentChildren, JSX } from 'preact';
import { cx } from './cx';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-stone-300 disabled:text-stone-500 dark:bg-brand-500 dark:text-stone-950 dark:hover:bg-brand-400 dark:disabled:bg-stone-700 dark:disabled:text-stone-400',
  secondary:
    'border border-stone-300 bg-white text-stone-900 hover:bg-stone-100 disabled:text-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800',
  ghost: 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
};

export interface ButtonProps extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'class' | 'size'> {
  variant?: Variant;
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  type?: 'button' | 'submit';
  disabled?: boolean;
  children: ComponentChildren;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      class={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-colors disabled:cursor-not-allowed',
        size === 'lg' ? 'px-6 text-base' : 'px-4 text-sm',
        fullWidth && 'w-full',
        VARIANTS[variant],
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
