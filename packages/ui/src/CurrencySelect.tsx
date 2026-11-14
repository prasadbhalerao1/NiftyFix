import { useState } from 'preact/hooks';
import {
  CURRENCIES,
  CURRENCY_IDS,
  currencyForLanguages,
  isCurrency,
  type Currency,
} from '@niftyfix/engine-data';
import { SelectInput } from './fields';

const KEY = 'nf-currency';

const stored = (): Currency | null => {
  try {
    const value = localStorage.getItem(KEY);
    return value && isCurrency(value) ? value : null;
  } catch {
    return null;
  }
};

/**
 * The currency a money calculator shows. A page made for one country passes
 * it as `fixed`; otherwise the visitor's last choice, or a guess from the
 * browser language. A change is remembered for the other calculators.
 */
export function useCurrency(fixed?: Currency): [Currency, (next: Currency) => void] {
  const [currency, setCurrency] = useState<Currency>(
    () => fixed ?? stored() ?? currencyForLanguages(navigator.languages),
  );
  return [
    currency,
    (next) => {
      setCurrency(next);
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // Private windows may refuse storage; the choice still applies here.
      }
    },
  ];
}

export function CurrencySelect({
  value,
  onChange,
}: {
  value: Currency;
  onChange(next: Currency): void;
}) {
  return (
    <SelectInput<Currency>
      label="Currency"
      value={value}
      options={CURRENCY_IDS.map((id) => ({
        value: id,
        label: `${CURRENCIES[id].symbol} ${CURRENCIES[id].name}`,
      }))}
      onChange={onChange}
      testId="currency"
    />
  );
}
