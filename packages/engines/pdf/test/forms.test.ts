import { PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { isToolError } from '@niftyfix/tool-sdk';
import { fillForm, loadPdf, readFormValues, refreshAppearances, savePdf } from '../src';

async function makeForm(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  const form = doc.getForm();
  form.createTextField('applicant.name').addToPage(page, { x: 20, y: 340, width: 200, height: 20 });
  form.createCheckBox('agree').addToPage(page, { x: 20, y: 300, width: 14, height: 14 });
  const gender = form.createRadioGroup('gender');
  gender.addOptionToPage('Female', page, { x: 20, y: 260, width: 14, height: 14 });
  gender.addOptionToPage('Male', page, { x: 60, y: 260, width: 14, height: 14 });
  const state = form.createDropdown('state');
  state.addOptions(['Karnataka', 'Maharashtra']);
  state.addToPage(page, { x: 20, y: 220, width: 150, height: 20 });
  const locked = form.createTextField('office.ref');
  locked.setText('A-17');
  locked.enableReadOnly();
  locked.addToPage(page, { x: 20, y: 180, width: 100, height: 20 });
  return doc.save();
}

describe('fillForm', () => {
  it('fills every field type and reads the values back after saving', async () => {
    const doc = await loadPdf(await makeForm(), { maxPages: 10 });
    const result = fillForm(doc, {
      'applicant.name': 'Asha Rao',
      agree: true,
      gender: 'Female',
      state: 'Karnataka',
    });
    expect(result.filled).toEqual(['applicant.name', 'agree', 'gender', 'state']);
    expect(result.skipped).toEqual([]);
    expect(result.shortened).toEqual([]);
    await refreshAppearances(doc);
    const reopened = await loadPdf(await savePdf(doc), { maxPages: 10 });
    expect(readFormValues(reopened, ['applicant.name', 'agree', 'gender', 'state'])).toEqual({
      'applicant.name': 'Asha Rao',
      agree: true,
      gender: 'Female',
      state: 'Karnataka',
    });
  });

  it('skips unknown names, read-only fields and values that are not an option', async () => {
    const doc = await loadPdf(await makeForm(), { maxPages: 10 });
    const result = fillForm(doc, {
      missing: 'x',
      'office.ref': 'B-1',
      gender: 'Other',
      state: 'Goa',
    });
    expect(result.filled).toEqual([]);
    expect(result.skipped.sort()).toEqual(['gender', 'missing', 'office.ref', 'state']);
    expect(readFormValues(doc, ['office.ref'])).toEqual({ 'office.ref': 'A-17' });
  });

  it('refuses text the standard font cannot show, with a clear error', async () => {
    const doc = await loadPdf(await makeForm(), { maxPages: 10 });
    fillForm(doc, { 'applicant.name': 'आशा राव' });
    const error = await refreshAppearances(doc).then(
      () => null,
      (reason: unknown) => reason,
    );
    expect(isToolError(error) && error.code).toBe('INVALID_OPTIONS');
    expect((error as Error).message).toContain('applicant.name');
  });
});
