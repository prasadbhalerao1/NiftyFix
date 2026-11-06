import { describe, expect, it } from 'vitest';
import {
  examChoices,
  PORTAL_SPECS,
  SIZE_TEMPLATES,
  specPresetSettings,
  validatePortalSpecs,
} from '../src';

const valid = {
  id: 'example-photo',
  portalName: 'Example Commission',
  applicationName: 'Example Exam 2026',
  documentType: 'photo',
  dimensions: { kind: 'exact-px', width: 200, height: 230 },
  minBytes: 20_000,
  maxBytes: 50_000,
  byteConvention: 'not-stated',
  formats: ['jpeg'],
  otherRequirements: [],
  unspecified: ['DPI'],
  source: { url: 'https://example.gov.in/notice.pdf', title: 'Notice No. 1/2026' },
  verifiedAt: '2026-11-04',
  verifiedBy: 'research',
  version: 1,
};

describe('portal spec validation', () => {
  it('accepts a complete record', () => {
    expect(validatePortalSpecs([valid])).toEqual([]);
  });

  it('rejects non-https sources, inverted byte ranges and duplicates', () => {
    expect(
      validatePortalSpecs([
        { ...valid, source: { ...valid.source, url: 'http://example.gov.in' } },
      ])[0],
    ).toMatch(/source\.url/);
    expect(validatePortalSpecs([{ ...valid, minBytes: 60_000 }])[0]).toMatch(/minBytes/);
    expect(validatePortalSpecs([valid, valid])).toEqual([
      'duplicate portal spec id "example-photo"',
    ]);
  });

  it('rejects records without a verification date', () => {
    const { verifiedAt: _omitted, ...rest } = valid;
    expect(validatePortalSpecs([rest])[0]).toMatch(/verifiedAt/);
  });

  it('ships only valid data', () => {
    expect(validatePortalSpecs(PORTAL_SPECS)).toEqual([]);
  });

  it('size templates match their physical sizes', () => {
    const t = SIZE_TEMPLATES.find((s) => s.id === 'passport-35x45-300');
    expect(t).toMatchObject({
      width: Math.round((3.5 / 2.54) * 300),
      height: Math.round((4.5 / 2.54) * 300),
    });
  });
});

describe('specPresetSettings', () => {
  it('fills pixels, KB and DPI from a portal spec', () => {
    expect(specPresetSettings('spec-ibps-po-2026-photo')).toEqual({
      width: 200,
      height: 230,
      minKb: 20,
      maxKb: 50,
    });
    expect(specPresetSettings('spec-ibps-po-2026-left-thumb')).toMatchObject({ dpi: 200 });
  });

  it('ignores other presets and unknown specs', () => {
    expect(specPresetSettings('max-20kb')).toBeNull();
    expect(specPresetSettings('spec-no-such-exam')).toBeNull();
    expect(specPresetSettings(undefined)).toBeNull();
  });
});

describe('examChoices', () => {
  it('lists verified exams for each upload type with a short label', () => {
    const photos = examChoices('photo');
    expect(photos.map((choice) => choice.label)).toEqual(
      expect.arrayContaining(['IBPS PO/MT-XVI (2026)', 'NEET (UG) 2026', 'UPSC']),
    );
    expect(photos.find((choice) => choice.id === 'ibps-po-2026-photo')?.sourceHost).toBe('ibps.in');
    expect(examChoices('signature').map((choice) => choice.id)).toContain('ssc-cgl-2026-signature');
  });
});
