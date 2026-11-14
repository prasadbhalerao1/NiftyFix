/**
 * Money formatting for the calculators: the currencies NiftyFix visitors use,
 * each written the way its own country writes it (₹12,34,567 in India,
 * $1,234,567 in the US), and a first guess at the visitor's currency from
 * the browser's language list.
 */
export type Currency = 'INR' | 'USD' | 'GBP' | 'EUR' | 'CAD' | 'AUD';

export const CURRENCIES: Record<Currency, { symbol: string; locale: string; name: string }> = {
  INR: { symbol: '₹', locale: 'en-IN', name: 'Indian rupee' },
  USD: { symbol: '$', locale: 'en-US', name: 'US dollar' },
  GBP: { symbol: '£', locale: 'en-GB', name: 'Pound sterling' },
  EUR: { symbol: '€', locale: 'en-IE', name: 'Euro' },
  CAD: { symbol: 'C$', locale: 'en-CA', name: 'Canadian dollar' },
  AUD: { symbol: 'A$', locale: 'en-AU', name: 'Australian dollar' },
};

export const CURRENCY_IDS = Object.keys(CURRENCIES) as Currency[];

export const isCurrency = (value: string): value is Currency => Object.hasOwn(CURRENCIES, value);

/** "₹12,34,567", "$1,234,567.50" or "-£250": whole units unless `decimals` is given. */
export function formatMoney(amount: number, currency: Currency, decimals = 0): string {
  const { symbol, locale } = CURRENCIES[currency];
  const digits = Math.abs(amount).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // A value that rounds to zero is shown without a minus sign.
  const negative = amount < 0 && Number(digits.replace(/,/g, '')) !== 0;
  return `${negative ? '-' : ''}${symbol}${digits}`;
}

/** Short words for big amounts: "12.5 lakh" and "1.2 crore" in rupees, "1.25 million" elsewhere. */
export function amountInWords(value: number, currency: Currency): string {
  const v = Math.abs(value);
  const short = (n: number): string => n.toFixed(2).replace(/\.?0+$/, '');
  if (currency === 'INR') {
    if (v >= 1e7) return `${short(value / 1e7)} crore`;
    if (v >= 1e5) return `${short(value / 1e5)} lakh`;
  } else {
    if (v >= 1e9) return `${short(value / 1e9)} billion`;
    if (v >= 1e6) return `${short(value / 1e6)} million`;
  }
  return Math.round(value).toLocaleString(CURRENCIES[currency].locale);
}

const EURO_REGIONS = new Set(
  'AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' '),
);
const EURO_LANGUAGES = new Set('de fr es it nl fi el sk sl et lv lt mt ga hr'.split(' '));
const INDIAN_LANGUAGES = new Set('hi mr bn ta te gu kn ml pa or as ur'.split(' '));
const BY_REGION: Record<string, Currency> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
};

/**
 * The likely currency for a list of language tags such as navigator.languages
 * ("en-GB" gives pounds, "de" euros). The first tag that tells wins; with
 * none, rupees, since the site is India-first.
 */
export function currencyForLanguages(languages: readonly string[]): Currency {
  for (const tag of languages) {
    const [language = '', region = ''] = tag.split('-');
    const upper = region.toUpperCase();
    if (BY_REGION[upper]) return BY_REGION[upper];
    if (EURO_REGIONS.has(upper)) return 'EUR';
    const lower = language.toLowerCase();
    if (INDIAN_LANGUAGES.has(lower)) return 'INR';
    if (!upper && EURO_LANGUAGES.has(lower)) return 'EUR';
  }
  return 'INR';
}
