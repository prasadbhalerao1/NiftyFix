/**
 * Password generation and strength estimation. Pure: randomness is passed in
 * (crypto.getRandomValues in the browser), so tests are deterministic.
 */
export type RandomWords = (count: number) => Uint32Array;

export const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/~',
} as const;
export type SetName = keyof typeof SETS;
const SIMILAR = /[Il1O0o|]/g;

/** A uniform index below `n`, rejecting values that would bias the result. */
function pick(n: number, random: RandomWords): number {
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  for (;;) {
    const value = random(1)[0] ?? 0;
    if (value < limit) return value % n;
  }
}

export interface PasswordOptions {
  length: number;
  sets: readonly SetName[];
  avoidSimilar: boolean;
}

export function generatePassword(options: PasswordOptions, random: RandomWords): string {
  const pools = options.sets.map((set) =>
    options.avoidSimilar ? SETS[set].replace(SIMILAR, '') : SETS[set],
  );
  const all = pools.join('');
  if (!all || options.length < 1) return '';
  // One character from each chosen set first, so none is missing, then the rest, then shuffle.
  const chars = pools.slice(0, options.length).map((pool) => pool[pick(pool.length, random)] ?? '');
  while (chars.length < options.length) chars.push(all[pick(all.length, random)] ?? '');
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = pick(i + 1, random);
    [chars[i], chars[j]] = [chars[j] ?? '', chars[i] ?? ''];
  }
  return chars.join('');
}

export function generatePin(length: number, random: RandomWords): string {
  return Array.from({ length }, () => String(pick(10, random))).join('');
}

const CONSONANTS = 'bdfghjklmnprstvz';
const VOWELS = 'aeiou';

/** Pronounceable words joined by a separator, with one capital and a number: easy to type, hard to guess. */
export function generatePassphrase(words: number, random: RandomWords, separator = '-'): string {
  const list = Array.from({ length: words }, () => {
    let word = '';
    for (let s = 0; s < 3; s += 1) {
      word +=
        (CONSONANTS[pick(CONSONANTS.length, random)] ?? '') +
        (VOWELS[pick(VOWELS.length, random)] ?? '');
    }
    return word;
  });
  const capital = pick(list.length, random);
  list[capital] = (list[capital] ?? '').replace(/^./, (c) => c.toUpperCase());
  return `${list.join(separator)}${separator}${pick(100, random)}`;
}

/** Bits of entropy for a generated secret: log2(pool ^ length). */
export const entropyBits = (pool: number, length: number): number =>
  pool > 1 ? length * Math.log2(pool) : 0;

/** The most common passwords and words in breach lists (a small, freely known sample). */
const COMMON = [
  'password',
  '123456',
  '123456789',
  'qwerty',
  'abc123',
  '111111',
  'iloveyou',
  'admin',
  'welcome',
  'monkey',
  'dragon',
  'letmein',
  'football',
  'baseball',
  'sunshine',
  'princess',
  'master',
  'shadow',
  'superman',
  'cricket',
  'india',
  'krishna',
  'sairam',
  'ganesh',
  'mumbai',
  'india123',
  'pass',
  'login',
  'secret',
  'qwertyuiop',
];
const KEYBOARD = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890'];

export interface Strength {
  bits: number;
  /** 0 very weak to 4 very strong. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  crackTime: string;
  warnings: string[];
}

function duration(seconds: number): string {
  if (seconds < 1) return 'instantly';
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [365, 'day'],
    [100, 'year'],
  ];
  let value = seconds;
  for (const [size, name] of units) {
    if (value < size) return `${Math.round(value)} ${name}${Math.round(value) === 1 ? '' : 's'}`;
    value /= size;
  }
  return value < 1e6 ? `${Math.round(value)} centuries` : 'millions of years or more';
}

/**
 * Estimate how hard a password is to guess: character variety and length,
 * reduced for common passwords, keyboard runs, sequences, repeats and years.
 * Assumes an offline attack at ten billion guesses a second.
 */
export function checkStrength(password: string): Strength {
  const warnings: string[] = [];
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/\d/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
  let bits = entropyBits(pool, [...password].length);
  const lower = password.toLowerCase();
  const plain = lower.replace(/[^a-z0-9]/g, '');
  if (COMMON.some((word) => plain.includes(word))) {
    warnings.push('Contains a very common password or word.');
    bits = Math.min(bits, 20);
  }
  if (
    KEYBOARD.some((row) =>
      [...Array(row.length - 3).keys()].some((i) => lower.includes(row.slice(i, i + 4))),
    )
  ) {
    warnings.push('Contains a keyboard run such as "qwer" or "1234".');
    bits -= 10;
  }
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Repeats the same character three or more times.');
    bits -= 8;
  }
  if (/(19|20)\d{2}/.test(password)) {
    warnings.push('Contains a year, which is easy to guess (birthdays, anniversaries).');
    bits -= 6;
  }
  if (password.length > 0 && password.length < 12) warnings.push('Shorter than 12 characters.');
  bits = Math.max(0, bits);
  const seconds = 2 ** bits / 2 / 1e10;
  const score = (
    bits < 28 ? 0 : bits < 40 ? 1 : bits < 60 ? 2 : bits < 80 ? 3 : 4
  ) as Strength['score'];
  return {
    bits: Math.round(bits),
    score,
    label: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][score] ?? '',
    crackTime: duration(seconds),
    warnings,
  };
}
