/**
 * Kruti Dev 010 <-> Unicode Devanagari.
 *
 * Kruti Dev is a legacy font that draws Devanagari glyphs on Latin keys, in
 * the order a typist types them: the short-i matra (f) comes before its
 * consonant cluster and the reph (Z, the र् on top) after its syllable.
 * Unicode stores sounds in spoken order, so conversion is a glyph mapping plus
 * reordering. The glyph table is the de facto Kruti Dev 010 encoding used by
 * typing tests and office converters (cross-checked with IIIT Hyderabad's
 * kru2uni table); this implementation is our own.
 */

export type Direction = 'to-unicode' | 'to-krutidev';

const HALANT = '्';
const NUKTA = '़';
// Placeholders while converting: a short i (with or without anusvara) still
// to be placed after its cluster, and a reph still to be placed before it.
const I_MARK = '\ue001';
const I_ANUSVARA_MARK = '\ue002';
const REPH_MARK = '\ue003';

/** Kruti Dev sequence -> Unicode, matched longest first. Unicode is in NFD (nukta separate). */
const TO_UNICODE: Record<string, string> = {
  // Devanagari digits and signs
  å: '०',
  ƒ: '१',
  '\u201e': '२',
  '\u2026': '३',
  '\u2020': '४',
  '\u2021': '५',
  ˆ: '६',
  '\u2030': '७',
  Š: '८',
  '\u2039': '९',
  ñ: '॰',
  Œ: '॰',
  '\u2022': 'ऽ',
  '\u00b7': 'ऽ',
  '\u2219': 'ऽ',
  // Letters with nukta whose glyphs need it in the middle
  '[+k': 'ख़',
  '[+': 'ख़्',
  'T+': 'ज़्',
  '\u00b6+': 'फ़्',
  // Conjunct glyphs
  Ùk: 'त्त',
  Ù: 'त्त्',
  ä: 'क्त',
  '\u2013': 'दृ',
  '\u2014': 'कृ',
  Ñ: 'कृ',
  é: 'न्न',
  '\u2122': 'न्न्',
  '=kk': 'त्रा',
  '=': 'त्र',
  '\u00ab': 'त्र्',
  à: 'ह्न',
  á: 'ह्य',
  â: 'हृ',
  ã: 'ह्म',
  ºz: 'ह्र',
  º: 'ह्',
  í: 'द्द',
  Ì: 'द्द',
  '{k': 'क्ष',
  '{': 'क्ष्',
  '|': 'द्य',
  K: 'ज्ञ',
  '}': 'द्व',
  J: 'श्र',
  Ø: 'क्र',
  Ý: 'फ्र',
  æ: 'द्र',
  ç: 'प्र',
  Á: 'प्र',
  ô: 'क्क',
  ê: 'ट्ट',
  Í: 'ट्ट',
  ë: 'ट्ठ',
  Î: 'ट्ठ',
  ì: 'ड्ड',
  Ï: 'ड्ड',
  ï: 'ड्ढ',
  Ô: 'ड्ढ',
  ')': 'द्ध',
  '#': 'रु',
  ':': 'रू',
  // Independent vowels
  'v\u201a': 'ऑ',
  vks: 'ओ',
  vkS: 'औ',
  vk: 'आ',
  v: 'अ',
  'b\u00b1': 'ईं',
  bZ: 'ई',
  Ã: 'ई',
  b: 'इ',
  m: 'उ',
  Å: 'ऊ',
  ',s': 'ऐ',
  ',': 'ए',
  _: 'ऋ',
  // Consonants: full form, and half form (consonant + halant)
  d: 'क',
  Dk: 'क',
  D: 'क्',
  '[k': 'ख',
  '[': 'ख्',
  x: 'ग',
  Xk: 'ग',
  X: 'ग्',
  '?k': 'घ',
  Ä: 'घ',
  '?': 'घ्',
  '\u00b3': 'ङ',
  p: 'च',
  Pk: 'च',
  P: 'च्',
  N: 'छ',
  t: 'ज',
  Tk: 'ज',
  T: 'ज्',
  '>': 'झ',
  '\u00f7': 'झ्',
  Ö: 'झ्',
  '\u00a5': 'ञ',
  V: 'ट',
  B: 'ठ',
  M: 'ड',
  '<': 'ढ',
  '.k': 'ण',
  '.': 'ण्',
  r: 'त',
  Rk: 'त',
  R: 'त्',
  Fk: 'थ',
  F: 'थ्',
  n: 'द',
  '/k': 'ध',
  èk: 'ध',
  è: 'ध',
  '/': 'ध्',
  Ë: 'ध्',
  u: 'न',
  Uk: 'न',
  U: 'न्',
  i: 'प',
  Ik: 'प',
  I: 'प्',
  Q: 'फ',
  '\u00b6': 'फ्',
  c: 'ब',
  Ck: 'ब',
  C: 'ब्',
  Hk: 'भ',
  Ò: 'भ',
  H: 'भ्',
  e: 'म',
  Ek: 'म',
  E: 'म्',
  ';': 'य',
  '\u00b8': 'य्',
  j: 'र',
  y: 'ल',
  Yk: 'ल',
  Y: 'ल्',
  G: 'ळ',
  o: 'व',
  Ok: 'व',
  O: 'व्',
  "'k": 'श',
  "'": 'श्',
  Ük: 'श',
  Ü: 'श्',
  '"k': 'ष',
  '"': 'ष्',
  l: 'स',
  Lk: 'स',
  L: 'स्',
  g: 'ह',
  // Joining forms of र and य
  z: '्र',
  ª: '्र',
  '~j': '्र',
  Ó: '्य',
  î: '्य',
  // Matras and signs
  '\u201a': 'ॉ',
  ks: 'ो',
  kS: 'ौ',
  k: 'ा',
  h: 'ी',
  È: 'ीं',
  q: 'ु',
  w: 'ू',
  '`': 'ृ',
  '\u0300': 'ृ',
  s: 'े',
  S: 'ै',
  '\u00ae': 'ैं',
  a: 'ं',
  '\u00a1': 'ँ',
  '%': 'ः',
  W: 'ॅ',
  '~': HALANT,
  '+': NUKTA,
  // The short i, the reph, and glyphs that combine them
  f: I_MARK,
  fa: I_ANUSVARA_MARK,
  Ç: I_ANUSVARA_MARK,
  '\u00af': I_ANUSVARA_MARK,
  Z: REPH_MARK,
  ZZ: REPH_MARK,
  '\u00b1': `${REPH_MARK}ं`,
  Ê: `ी${REPH_MARK}`,
  Æ: `र्${I_MARK}`,
  É: `र्${I_ANUSVARA_MARK}`,
  // Punctuation drawn on other keys
  A: '।',
  '-': '.',
  '&': '-',
  μ: '-',
  ']': ',',
  '\\': '?',
  '(': ';',
  '\u00bc': '(',
  '\u00bd': ')',
  '\u00bf': '{',
  À: '}',
  '\u00be': '=',
  '@': '/',
  '^': '\u2018',
  '*': '\u2019',
  Þ: '\u201c',
  ß: '\u201d',
};
const LONGEST_KEY = Math.max(...Object.keys(TO_UNICODE).map((key) => key.length));

const CONSONANT = '[क-ह]';
const CLUSTER = `(?:${CONSONANT}${NUKTA}?${HALANT})*${CONSONANT}${NUKTA}?`;
const CLUSTER_AHEAD = new RegExp(`^${CLUSTER}`);
const CLUSTER_BEHIND = new RegExp(`${CLUSTER}$`);
const SIGNS = '[ा-ौॅॉँ-ः]';
const SIGNS_BEHIND = new RegExp(`${SIGNS}*$`);

/** Web addresses and email addresses are kept as they are. */
const PROTECTED = /(https?:\/\/\S+|www\.\S+|[\w.+-]+@[\w-]+\.[a-z]{2,}(?:\.[a-z]{2,})?)/i;

function placeShortI(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i] as string;
    if (ch !== I_MARK && ch !== I_ANUSVARA_MARK) {
      out += ch;
      continue;
    }
    const cluster = CLUSTER_AHEAD.exec(text.slice(i + 1))?.[0] ?? '';
    out += cluster + (ch === I_MARK ? 'ि' : 'िं');
    i += cluster.length;
  }
  return out;
}

function placeReph(text: string): string {
  let out = '';
  for (const ch of text) {
    if (ch !== REPH_MARK) {
      out += ch;
      continue;
    }
    // The reph sits on the first consonant of the syllable typed before it.
    const signs = SIGNS_BEHIND.exec(out)?.[0] ?? '';
    const base = out.slice(0, out.length - signs.length);
    const cluster = CLUSTER_BEHIND.exec(base)?.[0] ?? '';
    const start = base.length - cluster.length;
    out = `${base.slice(0, start)}र्${base.slice(start)}${signs}`;
  }
  return out;
}

function convertKrutiDev(text: string): string {
  // Word's smart quotes replace the ' and " keys (श् and ष्); Kruti Dev's own
  // quote marks are on ^ * \u00de \u00df. A space typed before ्र belongs to the letter.
  let source = text
    .replace(/[\u2018\u2019]/g, '"')
    .replace(/[\u201c\u201d]/g, "'")
    .replace(/ ([\u00aaz])/g, '$1')
    .replace(/f=k/g, 'f=')
    // A dash followed by a space or digit is a dash, not दृ or कृ.
    .replace(/[\u2013\u2014](?=\s|\d|$)/g, '&');

  let out = '';
  while (source.length > 0) {
    let matched = false;
    for (let length = Math.min(LONGEST_KEY, source.length); length > 0; length -= 1) {
      const key = source.slice(0, length);
      const value = TO_UNICODE[key];
      if (value !== undefined) {
        out += value;
        source = source.slice(length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += source[0];
      source = source.slice(1);
    }
  }

  return (
    placeReph(placeShortI(out))
      // A halant typed before a matra (half letter + matra) disappears.
      .replace(/्([ा-ौॅॉ])/g, '$1')
      .replace(/़्/g, `${NUKTA}${HALANT}`)
      .replace(/््/g, HALANT)
      // ्र typed after a matra or anusvara belongs before it.
      .replace(/([ा-ौॅॉँ-ः]+)(्र)/g, '$2$1')
      // Anusvara and chandrabindu typed before a matra go after it.
      .replace(/([ँं]+)([ा-ौॅॉ]+)/g, '$2$1')
      .replace(/ाे/g, 'ो')
      .replace(/ाै/g, 'ौ')
      // A visarga that follows no letter is a colon.
      .replace(/(^|[^\u0900-\u097f])ः/g, '$1:')
      .normalize('NFC')
  );
}

/** Convert Kruti Dev 010 text to Unicode Hindi. Web and email addresses are left as they are. */
export function krutiDevToUnicode(text: string): string {
  return text
    .split(PROTECTED)
    .map((part, index) => (index % 2 === 1 ? part : convertKrutiDev(part)))
    .join('');
}

// Unicode -> Kruti Dev

const FULL: Record<string, string> = {
  क: 'd',
  ख: '[k',
  ग: 'x',
  घ: '?k',
  ङ: '\u00b3',
  च: 'p',
  छ: 'N',
  ज: 't',
  झ: '>',
  ञ: '\u00a5',
  ट: 'V',
  ठ: 'B',
  ड: 'M',
  ढ: '<',
  ण: '.k',
  त: 'r',
  थ: 'Fk',
  द: 'n',
  ध: '/k',
  न: 'u',
  प: 'i',
  फ: 'Q',
  ब: 'c',
  भ: 'Hk',
  म: 'e',
  य: ';',
  र: 'j',
  ल: 'y',
  ळ: 'G',
  व: 'o',
  श: "'k",
  ष: '"k',
  स: 'l',
  ह: 'g',
};
const HALF: Record<string, string> = {
  क: 'D',
  ख: '[',
  ग: 'X',
  घ: '?',
  च: 'P',
  ज: 'T',
  झ: '\u00f7',
  ण: '.',
  त: 'R',
  थ: 'F',
  ध: '/',
  न: 'U',
  प: 'I',
  फ: '\u00b6',
  ब: 'C',
  भ: 'H',
  म: 'E',
  य: '\u00b8',
  ल: 'Y',
  व: 'O',
  श: "'",
  ष: '"',
  स: 'L',
  ह: '\u00ba',
};
/** Two-consonant conjuncts with their own glyph, when they end the cluster. */
const CONJUNCT: Record<string, string> = {
  क्ष: '{k',
  ज्ञ: 'K',
  त्र: '=',
  श्र: 'J',
  द्ध: ')',
  द्य: '|',
  द्व: '}',
  त्त: '\u00d9k',
  क्त: '\u00e4',
  न्न: '\u00e9',
  द्द: '\u00ed',
  क्क: '\u00f4',
  ट्ट: '\u00ea',
  ट्ठ: '\u00eb',
  ड्ड: '\u00ec',
  ड्ढ: '\u00ef',
  ह्न: '\u00e0',
  ह्य: '\u00e1',
  ह्म: '\u00e3',
  क्र: '\u00d8',
  फ्र: '\u00dd',
  ह्र: '\u00baz',
};
/** The same conjuncts as half forms, before another consonant. */
const CONJUNCT_HALF: Record<string, string> = {
  क्ष: '{',
  त्र: '\u00ab',
  त्त: '\u00d9',
  न्न: '\u2122',
};
/** Letters with a round bottom take the low joining forms of ्र and ्य. */
const ROUND = new Set(['छ', 'ट', 'ठ', 'ड', 'ढ']);

const MATRA: Record<string, string> = {
  'ा': 'k',
  'ी': 'h',
  'ु': 'q',
  'ू': 'w',
  'ृ': '`',
  'े': 's',
  'ै': 'S',
  'ो': 'ks',
  'ौ': 'kS',
  'ॅ': 'W',
  'ॉ': '\u201a',
};
const MODIFIER: Record<string, string> = { 'ं': 'a', 'ँ': '\u00a1', 'ः': '%' };
const VOWEL: Record<string, string> = {
  अ: 'v',
  आ: 'vk',
  इ: 'b',
  ई: 'bZ',
  उ: 'm',
  ऊ: '\u00c5',
  ऋ: '_',
  ए: ',',
  ऐ: ',s',
  ओ: 'vks',
  औ: 'vkS',
  ऑ: 'v\u201a',
};
const SYMBOL: Record<string, string> = {
  '।': 'A',
  '॥': 'AA',
  '.': '-',
  '-': '&',
  '\u2013': '&',
  '\u2014': '&',
  ',': ']',
  '?': '\\',
  ';': '(',
  '(': '\u00bc',
  ')': '\u00bd',
  '{': '\u00bf',
  '}': '\u00c0',
  '=': '\u00be',
  '/': '@',
  ':': '%',
  ऽ: '\u00b7',
  '॰': '\u00f1',
  '\u2018': '^',
  '\u2019': '*',
  "'": '*',
  '\u201c': '\u00de',
  '\u201d': '\u00df',
  '०': '\u00e5',
  '१': '\u0192',
  '२': '\u201e',
  '३': '\u2026',
  '४': '\u2020',
  '५': '\u2021',
  '६': '\u02c6',
  '७': '\u2030',
  '८': '\u0160',
  '९': '\u2039',
};
/** Characters Kruti Dev shows as they are. */
const AS_IS = /[\s0-9!]/;

const SYLLABLE = new RegExp(
  `(र्(?=${CONSONANT}))?(${CLUSTER})(्(?!${CONSONANT}))?([ा-ौॅॉ]?)([ँ-ः]*)`,
  'y',
);

interface Letter {
  base: string;
  nukta: boolean;
}

const full = ({ base, nukta }: Letter): string => {
  const glyph = FULL[base] ?? base;
  if (!nukta) return glyph;
  // Two-part letters (ख = [k) take the nukta before the stem.
  return glyph.length === 2 && glyph.endsWith('k') ? `${glyph.slice(0, -1)}+k` : `${glyph}+`;
};
const half = (letter: Letter): string => {
  const glyph = HALF[letter.base];
  if (glyph === undefined) return `${full(letter)}~`;
  return letter.nukta ? `${glyph}+` : glyph;
};
const pairKey = (a: Letter | undefined, b: Letter | undefined): string | null =>
  a && b && !a.nukta && !b.nukta ? `${a.base}${HALANT}${b.base}` : null;

function clusterGlyphs(letters: Letter[], endsInHalant: boolean): string {
  const list = [...letters];
  let suffix = '';
  const last = list[list.length - 1];
  const beforeLast = list[list.length - 2];
  const lastPair = pairKey(beforeLast, last);
  if (list.length > 1 && last?.base === 'र' && !last.nukta && !(lastPair && CONJUNCT[lastPair])) {
    list.pop();
    suffix = beforeLast && ROUND.has(beforeLast.base) ? '\u00aa' : 'z';
  } else if (list.length > 1 && last?.base === 'य' && beforeLast && ROUND.has(beforeLast.base)) {
    list.pop();
    suffix = '\u00ee';
  }

  let out = '';
  for (let i = 0; i < list.length; i += 1) {
    const letter = list[i] as Letter;
    const isLast = i === list.length - 1 && !endsInHalant;
    const pair = pairKey(letter, list[i + 1]);
    const pairEnds = i + 1 === list.length - 1 && !endsInHalant;
    if (pair && pairEnds && CONJUNCT[pair]) {
      out += CONJUNCT[pair];
      i += 1;
    } else if (pair && CONJUNCT_HALF[pair] && !pairEnds) {
      out += CONJUNCT_HALF[pair];
      i += 1;
    } else {
      out += isLast ? full(letter) : half(letter);
    }
  }
  return out + suffix;
}

/** Consonants whose ृ form is its own glyph. */
const SPECIAL_R: Record<string, string> = { क: '\u00d1', द: '\u2013', ह: '\u00e2' };

function syllableToKrutiDev(match: RegExpExecArray): string {
  const [, reph, cluster = '', endHalant, matra = '', modifiers = ''] = match;
  const letters: Letter[] = [];
  for (const ch of cluster) {
    if (ch === NUKTA) {
      const previous = letters[letters.length - 1];
      if (previous) previous.nukta = true;
    } else if (ch !== HALANT) letters.push({ base: ch, nukta: false });
  }
  const only = letters.length === 1 ? letters[0] : undefined;
  let body: string;
  if (only && !only.nukta && !endHalant && only.base === 'र' && (matra === 'ु' || matra === 'ू')) {
    body = matra === 'ु' ? '#' : ':';
  } else if (only && !only.nukta && !endHalant && matra === 'ृ' && only.base in SPECIAL_R) {
    body = SPECIAL_R[only.base] as string;
  } else {
    const glyphs = clusterGlyphs(letters, Boolean(endHalant));
    body = matra === 'ि' ? `f${glyphs}` : glyphs + (MATRA[matra] ?? '');
  }
  if (reph) body += 'Z';
  for (const ch of modifiers) body += MODIFIER[ch] ?? '';
  return body;
}

export interface KrutiDevResult {
  text: string;
  /** Words in Latin letters: Kruti Dev has no English letters, so they need an English font. */
  english: string[];
  /** Characters Kruti Dev cannot show, kept as they are. */
  unsupported: string[];
}

/** Convert Unicode Hindi to Kruti Dev 010, reporting what Kruti Dev cannot show. */
export function unicodeToKrutiDev(input: string): KrutiDevResult {
  const english = new Set<string>();
  const unsupported = new Set<string>();
  const state = { openQuote: true };
  const text = input
    .split(PROTECTED)
    .map((part, index) => {
      if (index % 2 === 0) return convertUnicode(part, english, unsupported, state);
      english.add(part);
      return part;
    })
    .join('');
  return { text, english: [...english], unsupported: [...unsupported] };
}

function convertUnicode(
  input: string,
  english: Set<string>,
  unsupported: Set<string>,
  state: { openQuote: boolean },
): string {
  const text = input.normalize('NFD').replace(/[\u200c\u200d]/g, '');
  let out = '';
  let i = 0;
  while (i < text.length) {
    SYLLABLE.lastIndex = i;
    const syllable = SYLLABLE.exec(text);
    if (syllable && syllable[0].length > 0) {
      out += syllableToKrutiDev(syllable);
      i += syllable[0].length;
      continue;
    }
    const ch = text[i] as string;
    const latin = /^[A-Za-z]+/.exec(text.slice(i))?.[0];
    if (latin) {
      english.add(latin);
      out += latin;
      i += latin.length;
      continue;
    }
    if (VOWEL[ch] !== undefined) {
      out += VOWEL[ch];
      i += 1;
      while (MODIFIER[text[i] ?? ''] !== undefined) out += MODIFIER[text[(i += 1) - 1] as string];
      continue;
    }
    if (ch === '"') {
      out += state.openQuote ? '\u00de' : '\u00df';
      state.openQuote = !state.openQuote;
    } else if (SYMBOL[ch] !== undefined) out += SYMBOL[ch];
    else if (MATRA[ch] !== undefined) out += MATRA[ch];
    else if (MODIFIER[ch] !== undefined) out += MODIFIER[ch];
    else {
      if (!AS_IS.test(ch)) unsupported.add(ch);
      out += ch;
    }
    i += 1;
  }
  return out;
}

/** Which way to convert: Devanagari text goes to Kruti Dev, anything else is read as Kruti Dev. */
export function detectDirection(text: string): Direction | null {
  const devanagari = text.match(/[\u0900-\u097f]/g)?.length ?? 0;
  const other = text.match(/[!-~\u00a0-\u02ff\u2013-\u203a]/g)?.length ?? 0;
  if (devanagari === 0 && other === 0) return null;
  return devanagari >= other ? 'to-krutidev' : 'to-unicode';
}
