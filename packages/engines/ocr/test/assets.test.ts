import { describe, expect, it } from 'vitest';
import tesseractPackage from 'tesseract.js/package.json' with { type: 'json' };
import { OCR_ASSET_PATHS, TESSERACT_VERSION } from '../src/assets';

describe('OCR assets', () => {
  it('serve the installed tesseract.js version', () => {
    expect(tesseractPackage.version).toBe(TESSERACT_VERSION);
    expect(OCR_ASSET_PATHS.worker).toContain(TESSERACT_VERSION);
  });
});
