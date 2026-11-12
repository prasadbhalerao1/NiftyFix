import { PDFDocument } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { recordProblems } from './helpers';
import { makePdf, openPdfTool, runAndDownload, type PdfFile } from './pdf-helpers';

async function locked(name: string, userPassword: string): Promise<PdfFile> {
  const doc = await PDFDocument.load((await makePdf(name, 3)).buffer);
  doc.encrypt({
    userPassword,
    ownerPassword: 'owner-secret',
    permissions: { printing: false, copying: false, modifying: false },
  });
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

test.describe('Remove PDF Password', () => {
  test('asks for the password, then saves a copy that opens without one', async ({ page }) => {
    const problems = recordProblems(page);
    const frame = await openPdfTool(page, '/pdf/unlock-pdf/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await locked('statement.pdf', 'Bank#2024'));
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText('needs its password');
    await frame.getByTestId('pdf-password').fill('wrong');
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText('is not right');
    await frame.getByTestId('pdf-password').fill('Bank#2024');
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('statement-unlocked.pdf');
    expect(doc.isEncrypted).toBe(false);
    expect(doc.getPageCount()).toBe(3);
    await expect(frame.getByTestId('result')).toContainText('open password and print, copy');
    expect(problems).toEqual([]);
  });

  test('lifts print and copy restrictions without any password', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/unlock-pdf/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await locked('form.pdf', ''));
    const { doc, bytes } = await runAndDownload(page, frame);
    expect(doc.isEncrypted).toBe(false);
    expect(bytes.toString('latin1')).not.toContain('/Encrypt');
  });

  test('builds the e-Aadhaar password from name and year of birth', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/aadhaar-pdf-password/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await locked('eaadhaar.pdf', 'SURE1990'));
    await frame.getByTestId('aadhaar-name').fill('Suresh Kumar');
    await frame.getByTestId('aadhaar-year').fill('1990');
    await expect(frame.getByText('Password: SURE1990')).toBeVisible();
    const { name, doc } = await runAndDownload(page, frame);
    expect(name).toBe('eaadhaar-unlocked.pdf');
    expect(doc.isEncrypted).toBe(false);
  });

  test('says when a PDF has nothing to remove', async ({ page }) => {
    const frame = await openPdfTool(page, '/pdf/unlock-pdf/', /Choose a PDF/);
    await frame.getByTestId('file-input').setInputFiles(await makePdf('open.pdf', 1));
    await frame.getByTestId('prepare').click();
    await expect(frame.getByTestId('error-view')).toContainText('no password or restrictions');
  });
});
