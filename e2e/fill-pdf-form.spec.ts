import { PDFDocument } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { makePdf, openPdfTool, runAndDownload, type PdfFile } from './pdf-helpers';

const PATH = '/pdf/fill-pdf-form/';
const CHOOSE = /Choose a fillable PDF form/;

async function form(): Promise<PdfFile> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  const f = doc.getForm();
  f.createTextField('applicant.full_name').addToPage(page, {
    x: 20,
    y: 340,
    width: 200,
    height: 20,
  });
  f.createCheckBox('declaration').addToPage(page, { x: 20, y: 300, width: 14, height: 14 });
  const category = f.createRadioGroup('category');
  category.addOptionToPage('General', page, { x: 20, y: 260, width: 14, height: 14 });
  category.addOptionToPage('OBC', page, { x: 60, y: 260, width: 14, height: 14 });
  const state = f.createDropdown('state');
  state.addOptions(['Karnataka', 'Maharashtra']);
  state.addToPage(page, { x: 20, y: 220, width: 150, height: 20 });
  return {
    name: 'application.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(await doc.save()),
  };
}

test.describe('Fill PDF Form', () => {
  test('fills every kind of field and saves the answers', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await form());
    await expect(frame.getByTestId('field-count')).toContainText('4 fillable fields');
    await frame.getByTestId('field-applicant.full_name').fill('Asha Rao');
    await frame.getByTestId('field-declaration').check();
    await frame.getByTestId('field-category').selectOption('OBC');
    await frame.getByTestId('field-state').selectOption('Karnataka');
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('application-filled.pdf');
    const f = doc.getForm();
    expect(f.getTextField('applicant.full_name').getText()).toBe('Asha Rao');
    expect(f.getCheckBox('declaration').isChecked()).toBe(true);
    expect(f.getRadioGroup('category').getSelected()).toBe('OBC');
    expect(f.getDropdown('state').getSelected()).toEqual(['Karnataka']);
  });

  test('locks the answers when asked', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await form());
    await frame.getByTestId('field-applicant.full_name').fill('Asha Rao');
    await frame.getByTestId('flatten').check();
    const { doc } = await runAndDownload(page, frame);
    expect(doc.getForm().getFields()).toHaveLength(0);
  });

  test('refuses Hindi text clearly instead of saving unreadable boxes', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await form());
    await frame.getByTestId('field-applicant.full_name').fill('आशा राव');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText('applicant.full_name');
  });

  test('says when a PDF has no fillable fields', async ({ page }) => {
    const frame = await openPdfTool(page, PATH, CHOOSE);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('scan.pdf', 1));
    await expect(frame.getByTestId('no-fields')).toBeVisible();
    await expect(frame.getByTestId('prepare')).toBeDisabled();
  });
});
