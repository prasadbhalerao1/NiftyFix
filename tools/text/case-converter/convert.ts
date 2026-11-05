/** Case conversions. Words are split on spaces, punctuation and case changes ("fooBar"). */
export const CASES = [
  { id: 'sentence', label: 'Sentence case' },
  { id: 'lower', label: 'lower case' },
  { id: 'upper', label: 'UPPER CASE' },
  { id: 'title', label: 'Title Case' },
  { id: 'capitalized', label: 'Capitalized Case' },
  { id: 'alternating', label: 'aLtErNaTiNg' },
  { id: 'inverse', label: 'iNVERSE cASE' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'constant', label: 'CONSTANT_CASE' },
] as const;

export type CaseId = (typeof CASES)[number]['id'];

/** Small words kept lower case inside a title (English style guides). */
const MINOR = new Set(
  'a an and as at but by for from in into nor of on onto or over per the to up via vs with'.split(
    ' ',
  ),
);

const words = (text: string): string[] =>
  text
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .split(/[^\p{L}\p{N}\p{M}]+/u)
    .filter(Boolean);

const capitalize = (word: string): string =>
  word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();

export function convertCase(text: string, to: CaseId): string {
  switch (to) {
    case 'lower':
      return text.toLocaleLowerCase();
    case 'upper':
      return text.toLocaleUpperCase();
    case 'sentence':
      return text
        .toLocaleLowerCase()
        .replace(
          /(^\s*|[.!?।]\s+)(\p{L})/gu,
          (_, before: string, letter: string) => before + letter.toLocaleUpperCase(),
        );
    case 'capitalized':
      return text.replace(/[\p{L}\p{M}\p{N}']+/gu, capitalize);
    case 'title': {
      let index = 0;
      return text.replace(/[\p{L}\p{M}\p{N}']+/gu, (word) => {
        const first = index === 0;
        index += 1;
        return !first && MINOR.has(word.toLocaleLowerCase())
          ? word.toLocaleLowerCase()
          : capitalize(word);
      });
    }
    case 'alternating': {
      let upper = false;
      return [...text]
        .map((ch) => {
          if (!/\p{L}/u.test(ch)) return ch;
          upper = !upper;
          return upper ? ch.toLocaleLowerCase() : ch.toLocaleUpperCase();
        })
        .join('');
    }
    case 'inverse':
      return [...text]
        .map((ch) =>
          ch === ch.toLocaleUpperCase() ? ch.toLocaleLowerCase() : ch.toLocaleUpperCase(),
        )
        .join('');
    case 'camel':
      return words(text)
        .map((word, i) => (i === 0 ? word.toLocaleLowerCase() : capitalize(word)))
        .join('');
    case 'pascal':
      return words(text).map(capitalize).join('');
    case 'snake':
      return words(text)
        .map((w) => w.toLocaleLowerCase())
        .join('_');
    case 'kebab':
      return words(text)
        .map((w) => w.toLocaleLowerCase())
        .join('-');
    case 'constant':
      return words(text)
        .map((w) => w.toLocaleUpperCase())
        .join('_');
  }
}
