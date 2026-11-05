import { describe, expect, it } from 'vitest';
import { convertCase } from './convert';

describe('convertCase', () => {
  it('converts prose', () => {
    expect(convertCase('hello WORLD. how are you?', 'sentence')).toBe('Hello world. How are you?');
    expect(convertCase('the lord of the rings', 'title')).toBe('The Lord of the Rings');
    expect(convertCase("don't stop believing", 'capitalized')).toBe("Don't Stop Believing");
    expect(convertCase('Hello', 'inverse')).toBe('hELLO');
    expect(convertCase('abc def', 'alternating')).toBe('aBc DeF');
  });

  it('converts identifiers from any style', () => {
    for (const input of [
      'user first name',
      'userFirstName',
      'user_first_name',
      'User-First-Name',
    ]) {
      expect(convertCase(input, 'camel')).toBe('userFirstName');
      expect(convertCase(input, 'snake')).toBe('user_first_name');
      expect(convertCase(input, 'kebab')).toBe('user-first-name');
      expect(convertCase(input, 'constant')).toBe('USER_FIRST_NAME');
      expect(convertCase(input, 'pascal')).toBe('UserFirstName');
    }
  });

  it('leaves scripts without case alone', () => {
    expect(convertCase('नमस्ते duniya', 'upper')).toBe('नमस्ते DUNIYA');
  });
});
