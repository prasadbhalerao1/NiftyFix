import { expect, test } from '@playwright/test';

test.describe('GST Calculator', () => {
  test('adds 18% GST with the CGST and SGST split', async ({ page }) => {
    await page.goto('/calculators/gst-calculator/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await frame.getByTestId('amount').fill('1000');
    await expect(frame.getByTestId('gst')).toHaveText('₹180.00');
    await expect(frame.getByTestId('gross')).toHaveText('₹1,180.00');
    await expect(frame.getByTestId('cgst')).toHaveText('₹90.00');
  });

  test('the reverse page removes GST, and IGST applies between states', async ({ page }) => {
    await page.goto('/calculators/reverse-gst-calculator/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await frame.getByTestId('amount').fill('1180');
    await expect(frame.getByTestId('net')).toHaveText('₹1,000.00');
    await frame.getByText('Between states', { exact: true }).click();
    await expect(frame.getByTestId('igst')).toHaveText('₹180.00');
  });
});
