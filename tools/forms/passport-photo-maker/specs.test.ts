import { describe, expect, it } from 'vitest';
import { PHOTO_TARGETS } from './specs';

const byId = (id: string) => PHOTO_TARGETS.find((target) => target.spec.id === id);

describe('passport photo targets', () => {
  it('turns printed sizes into pixels at the print DPI', () => {
    expect(byId('india-passport-photo-print')).toMatchObject({
      width: 827,
      height: 1063,
      dpi: 600,
      printSize: '35 × 45 mm',
    });
    expect(byId('us-passport-photo')).toMatchObject({ width: 1200, height: 1200, dpi: 600 });
  });

  it('keeps the stated head height as a fraction of the photo', () => {
    const uk = byId('uk-passport-photo-print');
    expect(uk?.head?.min).toBeCloseTo(29 / 45);
    expect(uk?.head?.max).toBeCloseTo(34 / 45);
    expect(byId('india-passport-photo-print')?.head).toBeUndefined();
  });

  it('makes a square upload inside the allowed range and byte limits', () => {
    expect(byId('india-visa-photo-online')).toMatchObject({
      width: 600,
      height: 600,
      minBytes: 10_000,
      maxBytes: 300_000,
    });
  });
});
