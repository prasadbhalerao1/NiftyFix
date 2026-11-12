import { describe, expect, it } from 'vitest';
import { detectKind, fromBase64, snippet, toBase64 } from './base64';

const PNG_1PX =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('toBase64 and snippets', () => {
  it('round-trips bytes, including large ones', () => {
    const big = Uint8Array.from({ length: 200_000 }, (_, i) => i % 256);
    const decoded = fromBase64(toBase64(big));
    expect(decoded.ok && decoded.bytes).toEqual(big);
  });

  it('writes data URI, CSS, HTML, Markdown and JSON', () => {
    expect(snippet('AAA', 'image/png', 'data-uri')).toBe('data:image/png;base64,AAA');
    expect(snippet('AAA', 'image/png', 'css')).toBe(
      'background-image: url("data:image/png;base64,AAA");',
    );
    expect(snippet('AAA', 'image/png', 'html', 'a "logo"')).toBe(
      '<img src="data:image/png;base64,AAA" alt="a &quot;logo&quot;">',
    );
    expect(snippet('AAA', 'image/png', 'markdown', 'logo')).toBe(
      '![logo](data:image/png;base64,AAA)',
    );
    expect(JSON.parse(snippet('AAA', 'image/png', 'json', 'logo'))).toEqual({
      name: 'logo',
      mime: 'image/png',
      base64: 'AAA',
    });
  });
});

describe('fromBase64', () => {
  it('reads data URIs and raw Base64, and recognises the image', () => {
    for (const input of [
      `data:image/png;base64,${PNG_1PX}`,
      PNG_1PX,
      `  ${PNG_1PX.slice(0, 40)}\n${PNG_1PX.slice(40)}  `,
    ]) {
      const result = fromBase64(input);
      expect(result.ok && result.kind?.extension).toBe('png');
    }
  });

  it('accepts URL-safe letters and missing padding', () => {
    const result = fromBase64(PNG_1PX.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
    expect(result.ok && result.kind?.mime).toBe('image/png');
  });

  it('explains what is wrong', () => {
    expect(fromBase64('')).toEqual({ ok: false, error: 'Paste a Base64 string or a data URI.' });
    expect(fromBase64('abc$def')).toEqual({
      ok: false,
      error: '"$" at position 4 is not a Base64 character.',
    });
    expect(fromBase64('abcde')).toMatchObject({ ok: false });
    expect(fromBase64('data:image/svg+xml,<svg/>')).toMatchObject({ ok: false });
  });

  it('recognises SVG and ICO, and non-images', () => {
    expect(
      detectKind(new TextEncoder().encode('<?xml version="1.0"?>\n<svg xmlns="x"></svg>'))
        ?.extension,
    ).toBe('svg');
    expect(detectKind(Uint8Array.of(0, 0, 1, 0, 1, 0))?.extension).toBe('ico');
    expect(detectKind(new TextEncoder().encode('%PDF-1.7'))?.extension).toBe('pdf');
    expect(detectKind(new TextEncoder().encode('hello'))).toBeNull();
  });
});
