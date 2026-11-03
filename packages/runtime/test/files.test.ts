import { describe, expect, it } from 'vitest';
import { unzipSync } from 'fflate';
import { ToolError, type FileInputSpec } from '@niftyfix/tool-sdk';
import { classifyDevice, poolSizeFor } from '../src/device';
import { zipFiles } from '../src/download';
import {
  outputFileName,
  resolveOutputName,
  sanitizeBaseName,
  uniqueFileNames,
} from '../src/filenames';
import { validateFile, validateFileCount } from '../src/validate-file';

const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const HEIC = [0, 0, 0, 0x18, ...'ftypheic'].map((v) =>
  typeof v === 'string' ? v.charCodeAt(0) : v,
);

const spec: FileInputSpec = {
  kind: 'files',
  formats: ['jpeg', 'png'],
  maxBytes: { mobile: 100, desktop: 1000 },
  maxFiles: 1,
};

const fileOf = (bytes: number[], name: string, pad = 0) =>
  new File([Uint8Array.from([...bytes, ...new Array<number>(pad).fill(0)])], name);

async function code(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'ok';
  } catch (error) {
    return error instanceof ToolError ? error.code : 'not-a-tool-error';
  }
}

describe('validateFile', () => {
  it('accepts by content signature and flags mismatched extensions', async () => {
    const result = await validateFile(fileOf(PNG, 'photo.jpg'), spec, 'high');
    expect(result.format).toBe('png');
    expect(result.extensionMismatch).toBe(true);
    expect((await validateFile(fileOf(JPEG, 'a.JPEG'), spec, 'high')).extensionMismatch).toBe(
      false,
    );
  });

  it('rejects disguised non-images', async () => {
    expect(
      await code(
        validateFile(
          fileOf(
            [...'%PDF-1.7'].map((c) => c.charCodeAt(0)),
            'x.jpg',
          ),
          spec,
          'high',
        ),
      ),
    ).toBe('UNSUPPORTED_FORMAT');
  });

  it('gives HEIC a specific message', async () => {
    await expect(validateFile(fileOf(HEIC, 'IMG.HEIC'), spec, 'high')).rejects.toThrow(/HEIC/);
  });

  it('applies device-specific size limits and rejects empty files', async () => {
    expect(await code(validateFile(fileOf(JPEG, 'a.jpg', 200), spec, 'low'))).toBe(
      'FILE_TOO_LARGE',
    );
    expect(await code(validateFile(fileOf(JPEG, 'a.jpg', 200), spec, 'high'))).toBe('ok');
    expect(await code(validateFile(new File([], 'a.jpg'), spec, 'high'))).toBe('CORRUPT_INPUT');
  });

  it('limits file count', () => {
    expect(() => validateFileCount(2, spec)).toThrow(ToolError);
    expect(() => validateFileCount(1, spec)).not.toThrow();
  });
});

describe('filenames', () => {
  it('sanitises path tricks and control characters', () => {
    expect(sanitizeBaseName('../../etc/passwd.jpg')).toBe('etc-passwd');
    expect(sanitizeBaseName('फोटो.jpg')).toBe('फोटो');
    expect(sanitizeBaseName('.jpg')).toBe('file');
  });

  it('builds output names', () => {
    expect(outputFileName('IMG 2041.HEIC', '200x230', 'jpg')).toBe('IMG 2041-200x230.jpg');
  });

  it('deduplicates case-insensitively', () => {
    expect(uniqueFileNames(['a.jpg', 'A.jpg', 'a.jpg', 'b'])).toEqual([
      'a.jpg',
      'A (2).jpg',
      'a (3).jpg',
      'b',
    ]);
  });
});

describe('resolveOutputName', () => {
  it('prefers a sanitised custom name and keeps dots inside it', () => {
    expect(resolveOutputName('IMG_1.HEIC', '  signature ', '140x60', 'jpg')).toBe('signature.jpg');
    expect(resolveOutputName('a.jpg', 'v1.2 final', 'x', 'png')).toBe('v1.2 final.png');
    expect(resolveOutputName('a.jpg', '../../x', 'x', 'jpg')).toBe('x.jpg');
  });

  it('falls back to the original name with a suffix', () => {
    expect(resolveOutputName('scan.png', '', '140x60', 'jpg')).toBe('scan-140x60.jpg');
  });
});

describe('zipFiles', () => {
  it('stores files under unique names', async () => {
    const zip = await zipFiles([
      { name: 'a.txt', blob: new Blob(['one']) },
      { name: 'a.txt', blob: new Blob(['two']) },
    ]);
    const entries = unzipSync(new Uint8Array(await zip.arrayBuffer()));
    expect(Object.keys(entries)).toEqual(['a.txt', 'a (2).txt']);
    expect(new TextDecoder().decode(entries['a (2).txt'])).toBe('two');
  });
});

describe('device class', () => {
  it('classifies from hints', () => {
    expect(classifyDevice({ deviceMemory: 2, hardwareConcurrency: 8 })).toBe('low');
    expect(classifyDevice({ deviceMemory: 8, hardwareConcurrency: 8, userAgent: 'Android' })).toBe(
      'mid',
    );
    expect(classifyDevice({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe('high');
    expect(classifyDevice({ hardwareConcurrency: 6, userAgent: 'iPhone' })).toBe('mid');
    expect(poolSizeFor('high', 16)).toBe(4);
    expect(poolSizeFor('low', 8)).toBe(1);
    expect(poolSizeFor('mid', 1)).toBe(1);
  });
});
