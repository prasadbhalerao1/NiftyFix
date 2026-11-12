import { describe, expect, it } from 'vitest';
import { checkStrength, generatePassphrase, generatePassword, generatePin, SETS } from './password';

/** A repeatable stand-in for crypto.getRandomValues. */
function seeded(seed = 42) {
  let state = seed;
  return (count: number): Uint32Array =>
    Uint32Array.from({ length: count }, () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state;
    });
}

describe('generatePassword', () => {
  it('has the length and at least one character from every chosen set', () => {
    for (let i = 0; i < 50; i += 1) {
      const password = generatePassword(
        { length: 12, sets: ['lower', 'upper', 'digits', 'symbols'], avoidSimilar: false },
        seeded(i),
      );
      expect(password).toHaveLength(12);
      for (const set of ['lower', 'upper', 'digits', 'symbols'] as const) {
        expect([...password].some((c) => SETS[set].includes(c))).toBe(true);
      }
    }
  });

  it('can leave out look-alike characters', () => {
    const password = generatePassword(
      { length: 200, sets: ['lower', 'upper', 'digits'], avoidSimilar: true },
      seeded(),
    );
    expect(password).not.toMatch(/[Il1O0o]/);
  });

  it('makes PINs and pronounceable passphrases', () => {
    expect(generatePin(6, seeded())).toMatch(/^\d{6}$/);
    expect(generatePassphrase(4, seeded())).toMatch(/^([A-Za-z]{6}-){4}\d{1,2}$/);
  });
});

describe('checkStrength', () => {
  it('rates common and patterned passwords weak', () => {
    expect(checkStrength('password123').score).toBe(0);
    expect(checkStrength('Qwerty1234').warnings).toContain(
      'Contains a keyboard run such as "qwer" or "1234".',
    );
    expect(checkStrength('aaaaaa').score).toBe(0);
  });

  it('rates long random passwords very strong', () => {
    const result = checkStrength('k7#Rm2!vQz9@Lp4&Xw8$');
    expect(result.score).toBe(4);
    expect(result.warnings).toEqual([]);
    expect(result.crackTime).toBe('millions of years or more');
  });
});
