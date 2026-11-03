import { describe, expect, it } from 'vitest';
import {
  allChecksPassed,
  formatBytes,
  formatBytesExact,
  describeByteRange,
  isCategoryId,
  kilobytesToByteLimit,
  sniffFormat,
  ToolError,
  toSerializedError,
} from '../src';

const bytes = (...values: (number | string)[]): Uint8Array =>
  Uint8Array.from(
    values.flatMap((v) => (typeof v === 'string' ? [...v].map((c) => c.charCodeAt(0)) : [v])),
  );

describe('sniffFormat', () => {
  it.each([
    ['jpeg', bytes(0xff, 0xd8, 0xff, 0xdb)],
    ['png', bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a)],
    ['webp', bytes('RIFF', 0, 0, 0, 0, 'WEBP')],
    ['gif', bytes('GIF89a')],
    ['bmp', bytes('BM', 0, 0)],
    ['pdf', bytes('%PDF-1.7')],
    ['avif', bytes(0, 0, 0, 0x1c, 'ftypavif')],
    ['heic', bytes(0, 0, 0, 0x18, 'ftypheic')],
    ['heic', bytes(0, 0, 0, 0x18, 'ftypmif1')],
  ])('detects %s', (format, input) => {
    expect(sniffFormat(input)).toBe(format);
  });

  it('returns null for unknown or truncated data', () => {
    expect(sniffFormat(bytes(0xff, 0xd8))).toBeNull();
    expect(sniffFormat(bytes('<svg'))).toBeNull();
    expect(sniffFormat(new Uint8Array())).toBeNull();
  });
});

describe('kilobyte conventions', () => {
  it('safe mode satisfies both 1000- and 1024-byte readings', () => {
    expect(kilobytesToByteLimit(50, 'max', 'safe')).toBe(50_000);
    expect(kilobytesToByteLimit(20, 'min', 'safe')).toBe(20_480);
  });

  it('explicit conventions', () => {
    expect(kilobytesToByteLimit(50, 'max', 'kib1024')).toBe(51_200);
    expect(kilobytesToByteLimit(50, 'min', 'kb1000')).toBe(50_000);
  });

  it('describes byte ranges', () => {
    expect(describeByteRange({ minBytes: 20_480, maxBytes: 50_000 })).toBe('20.5 KB – 50.0 KB');
    expect(describeByteRange({ maxBytes: 20_000 })).toBe('at most 20.0 KB');
    expect(describeByteRange({ minBytes: 900 })).toBe('at least 900 bytes');
    expect(describeByteRange({})).toBe('any');
  });

  it('formats sizes', () => {
    expect(formatBytes(999)).toBe('999 bytes');
    expect(formatBytes(48_213)).toBe('48.2 KB');
    expect(formatBytes(2_500_000)).toBe('2.50 MB');
    expect(formatBytesExact(48_213)).toBe('48.2 KB (48,213 bytes)');
  });
});

describe('errors', () => {
  it('serialises tool errors with hints', () => {
    const error = new ToolError('TARGET_UNREACHABLE', 'Too big.', { hint: 'Lower quality.' });
    expect(toSerializedError(error)).toEqual({
      code: 'TARGET_UNREACHABLE',
      message: 'Too big.',
      hint: 'Lower quality.',
      retryable: false,
    });
  });

  it('recognises tool errors from another bundle copy of the class', () => {
    class ForeignToolError extends Error {
      override name = 'ToolError';
      code = 'WORKER_UNSUPPORTED' as const;
      serialize() {
        return { code: this.code, message: this.message, retryable: true };
      }
    }
    expect(toSerializedError(new ForeignToolError('no canvas')).code).toBe('WORKER_UNSUPPORTED');
    const impostor = Object.assign(new Error('x'), {
      name: 'ToolError',
      code: 'NOT_A_CODE',
      serialize: () => ({}),
    });
    expect(toSerializedError(impostor).code).toBe('UNKNOWN');
  });

  it('never exposes raw exception text', () => {
    const serialized = toSerializedError(new Error('TypeError at /src/secret/path.ts:12'));
    expect(serialized.code).toBe('UNKNOWN');
    expect(serialized.message).not.toContain('secret');
  });

  it('maps abort and memory errors', () => {
    expect(toSerializedError(new DOMException('x', 'AbortError')).code).toBe('CANCELLED');
    expect(toSerializedError(new RangeError('Array buffer allocation failed')).code).toBe(
      'OUT_OF_MEMORY',
    );
  });
});

describe('helpers', () => {
  it('treats not-checked as non-failing', () => {
    expect(
      allChecksPassed([
        { id: 'a', label: 'A', required: '', actual: '', status: 'pass' },
        { id: 'b', label: 'B', required: '', actual: '', status: 'not-checked' },
      ]),
    ).toBe(true);
    expect(
      allChecksPassed([{ id: 'a', label: 'A', required: '', actual: '', status: 'fail' }]),
    ).toBe(false);
  });

  it('guards category ids', () => {
    expect(isCategoryId('forms')).toBe(true);
    expect(isCategoryId('toString')).toBe(false);
  });
});
