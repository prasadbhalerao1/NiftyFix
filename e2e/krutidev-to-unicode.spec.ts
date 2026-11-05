import { expect, test } from '@playwright/test';

test('Krutidev converter detects the direction and converts both ways', async ({ page }) => {
  await page.goto('/text/krutidev-to-unicode/');
  const frame = page.frameLocator('iframe[data-tool-frame]');
  const input = frame.getByTestId('text-input');
  await input.fill('Hkkjr dk lafo/kku fLFkfr dk;ksZa');
  await expect(frame.getByTestId('detected')).toContainText('Kruti Dev text');
  await expect(frame.getByTestId('text-output')).toHaveValue('भारत का संविधान स्थिति कार्यों');

  await frame.getByTestId('swap').click();
  await expect(frame.getByTestId('text-input')).toHaveValue('भारत का संविधान स्थिति कार्यों');
  await expect(frame.getByTestId('text-output')).toHaveValue('Hkkjr dk lafo/kku fLFkfr dk;ksZa');
});

test('Unicode to Krutidev page flags English words and symbols', async ({ page }) => {
  await page.goto('/text/unicode-to-krutidev/');
  const frame = page.frameLocator('iframe[data-tool-frame]');
  await frame.getByTestId('text-input').fill('मेरा email पता, कीमत ₹500');
  await expect(frame.getByTestId('text-output')).toHaveValue('esjk email irk] dher ₹500');
  await expect(frame.getByTestId('english-words')).toContainText('email');
  await expect(frame.getByTestId('unsupported')).toContainText('₹');
});
