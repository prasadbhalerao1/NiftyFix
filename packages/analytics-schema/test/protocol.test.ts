import { describe, expect, it } from 'vitest';
import { parseFrameMessage, parseSiteMessage } from '../src';

const base = { source: 'niftyfix-frame', version: 1 };

describe('parseFrameMessage', () => {
  it('accepts resize and event messages', () => {
    expect(parseFrameMessage({ ...base, type: 'resize', height: 640.4 })).toEqual({
      ...base,
      type: 'resize',
      height: 641,
    });
    expect(
      parseFrameMessage({
        ...base,
        type: 'event',
        name: 'tool_fail',
        toolId: 'forms.photo-resizer',
        code: 'TARGET_UNREACHABLE',
      }),
    ).toMatchObject({
      code: 'TARGET_UNREACHABLE',
    });
    expect(
      parseFrameMessage({
        ...base,
        type: 'event',
        name: 'download',
        toolId: 'forms.photo-resizer',
      }),
    ).not.toBeNull();
  });

  it('accepts numeric reveal requests only', () => {
    expect(parseFrameMessage({ ...base, type: 'reveal', top: 812.6, height: 300 })).toEqual({
      ...base,
      type: 'reveal',
      top: 813,
      height: 300,
    });
    expect(parseFrameMessage({ ...base, type: 'reveal', top: -5, height: 10 })).toBeNull();
    expect(parseFrameMessage({ ...base, type: 'reveal', top: '10', height: 10 })).toBeNull();
    expect(
      parseFrameMessage({ ...base, type: 'reveal', top: 1, height: 1, selector: '#x' }),
    ).toBeNull();
  });

  it('rejects anything that could smuggle user data', () => {
    expect(
      parseFrameMessage({
        ...base,
        type: 'event',
        name: 'download',
        toolId: 'forms.photo-resizer',
        fileName: 'aadhaar.jpg',
      }),
    ).toBeNull();
    expect(
      parseFrameMessage({
        ...base,
        type: 'event',
        name: 'tool_fail',
        toolId: 'forms.photo-resizer',
        code: 'my secret text',
      }),
    ).toBeNull();
    expect(
      parseFrameMessage({ ...base, type: 'event', name: 'download', toolId: 'Some Name.jpg' }),
    ).toBeNull();
  });

  it('rejects wrong sources, versions, types and values', () => {
    expect(parseFrameMessage({ ...base, source: 'other', type: 'resize', height: 1 })).toBeNull();
    expect(parseFrameMessage({ ...base, version: 2, type: 'resize', height: 1 })).toBeNull();
    expect(parseFrameMessage({ ...base, type: 'resize', height: Number.NaN })).toBeNull();
    expect(parseFrameMessage({ ...base, type: 'resize', height: 1e9 })).toBeNull();
    expect(
      parseFrameMessage({ ...base, type: 'navigate', url: 'https://evil.example' }),
    ).toBeNull();
    expect(
      parseFrameMessage({ ...base, type: 'event', name: 'exfiltrate', toolId: 'a.b' }),
    ).toBeNull();
    expect(parseFrameMessage('string')).toBeNull();
    expect(parseFrameMessage(null)).toBeNull();
    expect(parseFrameMessage([base])).toBeNull();
  });
});

describe('parseSiteMessage', () => {
  const site = { source: 'niftyfix-site', version: 1, type: 'theme' };

  it('accepts each theme', () => {
    for (const theme of ['light', 'dark', 'system']) {
      expect(parseSiteMessage({ ...site, theme })).toEqual({ ...site, theme });
    }
  });

  it('rejects anything else', () => {
    for (const bad of [
      null,
      'theme',
      [],
      { ...site, theme: 'sepia' },
      { ...site, theme: 'dark', extra: 1 },
      { ...site, theme: 'dark', source: 'niftyfix-frame' },
      { ...site, theme: 'dark', version: 2 },
      { ...site, type: 'resize', theme: 'dark' },
      { ...site },
    ]) {
      expect(parseSiteMessage(bad)).toBeNull();
    }
  });
});
