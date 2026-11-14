import { describe, expect, it } from 'vitest';
import { amountInWords, currencyForLanguages, formatMoney } from '../src/money';

describe('formatMoney', () => {
  it('groups digits the way each country does', () => {
    expect(formatMoney(1234567, 'INR')).toBe('₹12,34,567');
    expect(formatMoney(1234567, 'USD')).toBe('$1,234,567');
    expect(formatMoney(1234567.5, 'GBP', 2)).toBe('£1,234,567.50');
    expect(formatMoney(999.4, 'EUR')).toBe('€999');
    expect(formatMoney(1500, 'CAD')).toBe('C$1,500');
  });

  it('puts the minus sign before the symbol, and drops it for zero', () => {
    expect(formatMoney(-250, 'GBP')).toBe('-£250');
    expect(formatMoney(-0.004, 'USD', 2)).toBe('$0.00');
  });
});

describe('amountInWords', () => {
  it('uses lakh and crore for rupees, million and billion otherwise', () => {
    expect(amountInWords(1_250_000, 'INR')).toBe('12.5 lakh');
    expect(amountInWords(12_000_000, 'INR')).toBe('1.2 crore');
    expect(amountInWords(1_250_000, 'USD')).toBe('1.25 million');
    expect(amountInWords(2_000_000_000, 'EUR')).toBe('2 billion');
    expect(amountInWords(85_000, 'GBP')).toBe('85,000');
  });
});

describe('currencyForLanguages', () => {
  it('reads the region first, then the language', () => {
    expect(currencyForLanguages(['en-US', 'en'])).toBe('USD');
    expect(currencyForLanguages(['en-GB'])).toBe('GBP');
    expect(currencyForLanguages(['de-DE'])).toBe('EUR');
    expect(currencyForLanguages(['fr'])).toBe('EUR');
    expect(currencyForLanguages(['fr-CA'])).toBe('CAD');
    expect(currencyForLanguages(['hi'])).toBe('INR');
    expect(currencyForLanguages(['en-IN'])).toBe('INR');
  });

  it('falls back to rupees when nothing tells', () => {
    expect(currencyForLanguages(['en'])).toBe('INR');
    expect(currencyForLanguages([])).toBe('INR');
  });
});
