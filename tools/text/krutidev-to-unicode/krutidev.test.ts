import { describe, expect, it } from 'vitest';
import { detectDirection, krutiDevToUnicode, unicodeToKrutiDev } from './krutidev';

// Kruti Dev 010 as typed on the Remington layout, and the Unicode it shows.
const WORDS: [string, string][] = [
  ['Hkkjr', 'भारत'],
  ['fgUnh', 'हिन्दी'],
  ['deZ', 'कर्म'],
  ['dk;Z', 'कार्य'],
  ['dk;ksZa', 'कार्यों'],
  ['dhfrZ', 'कीर्ति'],
  ['fLFkfr', 'स्थिति'],
  ['fDyd', 'क्लिक'],
  ['\u00d8e', 'क्रम'],
  ['izdkj', 'प्रकार'],
  ['jk"V\u00aah;', 'राष्ट्रीय'],
  ['f}rh;', 'द्वितीय'],
  ['fo|ky;', 'विद्यालय'],
  ['mPpre U;k;ky;', 'उच्चतम न्यायालय'],
  ['r`rh;', 'तृतीय'],
  ['lEiw.kZ', 'सम्पूर्ण'],
  ['vk\u00a1[k', 'आँख'],
  ['v\u201afQl', 'ऑफिस'],
  ['ft+yk', 'ज़िला'],
  ['i<+kbZ', 'पढ़ाई'],
  ['esjk uke jke gSA', 'मेरा नाम राम है।'],
  ['vkxs \u00bcns[ksa\u00bd', 'आगे (देखें)'],
];

describe('krutiDevToUnicode', () => {
  it('converts words with short i, reph, conjuncts and nukta', () => {
    for (const [kd, unicode] of WORDS) expect(krutiDevToUnicode(kd)).toBe(unicode);
  });

  it('places the short i after a whole conjunct and the reph before it', () => {
    expect(krutiDevToUnicode('fLFkfr')).toBe('स्थिति');
    expect(krutiDevToUnicode('/keZ')).toBe('धर्म');
    expect(krutiDevToUnicode('iwoZ')).toBe('पूर्व');
    expect(krutiDevToUnicode(')Z')).toBe('र्द्ध');
  });

  it('fixes anusvara typed before a matra', () => {
    expect(krutiDevToUnicode('esa')).toBe('में');
    expect(krutiDevToUnicode('gSa')).toBe('हैं');
    expect(krutiDevToUnicode('dkas')).toBe('कों');
  });

  it("undoes Word's smart quotes on the श् and ष् keys", () => {
    expect(krutiDevToUnicode('\u2019kfDr')).toBe('षक्ति');
    expect(krutiDevToUnicode('\u201ckfDr')).toBe('शक्ति');
  });

  it('keeps web and email addresses, and reads a spaced dash as a dash', () => {
    expect(krutiDevToUnicode('ns[ksa www.india.gov.in')).toBe('देखें www.india.gov.in');
    expect(krutiDevToUnicode('esy help@example.com')).toBe('मेल help@example.com');
    expect(krutiDevToUnicode("Hkkjr \u2013 ns'k")).toBe('भारत - देश');
  });
});

describe('unicodeToKrutiDev', () => {
  it('converts words the way they are typed', () => {
    for (const [kd, unicode] of WORDS) {
      if (unicode === 'ऑफिस') continue; // ऑ has one glyph in both directions; checked below
      expect(unicodeToKrutiDev(unicode).text).toBe(kd);
    }
    expect(unicodeToKrutiDev('ऑफिस').text).toBe('v\u201afQl');
  });

  it('round-trips a paragraph', () => {
    const paragraph =
      'भारत का संविधान 26 जनवरी 1950 को लागू हुआ। प्रधानमंत्री ने कहा कि राष्ट्र की प्रगति में हर नागरिक का योगदान महत्त्वपूर्ण है। श्रीमती कृष्णा, ज़िला अधिकारी (द्वितीय श्रेणी) ने दृष्टिकोण स्पष्ट किया। हृदय, चिह्न, ट्रेन, ड्राइवर, क्षत्रिय, विद्यार्थियों, उद्धरण, पत्र, सत्य, धर्मों, कार्यों, अर्थात्, फ़ाइल, बड़ा, शुद्ध, ज्ञान, आँख, इंटरनेट, दुःख, शक्ति।';
    const { text, english, unsupported } = unicodeToKrutiDev(paragraph);
    expect(english).toEqual([]);
    expect(unsupported).toEqual([]);
    expect(krutiDevToUnicode(text)).toBe(paragraph.normalize('NFC'));
  });

  it('reports English words and characters Kruti Dev cannot show', () => {
    const result = unicodeToKrutiDev('मेरा email है: a@b.in, कीमत ₹500');
    expect(result.english).toEqual(['email', 'a@b.in']);
    expect(result.unsupported).toEqual(['₹']);
    expect(result.text).toContain('email');
  });

  it('uses Devanagari digit glyphs and keeps ASCII digits', () => {
    expect(unicodeToKrutiDev('१९५० 1950').text).toBe('\u0192\u2039\u2021\u00e5 1950');
  });
});

describe('detectDirection', () => {
  it('reads Devanagari as Unicode and Latin-looking text as Kruti Dev', () => {
    expect(detectDirection('भारत का संविधान')).toBe('to-krutidev');
    expect(detectDirection('Hkkjr dk lafo/kku')).toBe('to-unicode');
    expect(detectDirection('   ')).toBeNull();
  });
});
