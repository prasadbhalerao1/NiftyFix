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

test.describe('GST invoice', () => {
  test('sums items by rate and rounds the total', async ({ page }) => {
    await page.goto('/calculators/gst-invoice-calculator/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    const rows = frame.getByTestId('invoice-row');
    await rows.nth(0).getByTestId('row-qty').fill('2');
    await rows.nth(0).getByTestId('row-price').fill('499.5');
    await rows.nth(1).getByTestId('row-qty').fill('3');
    await rows.nth(1).getByTestId('row-price').fill('120.25');
    await frame.getByTestId('add-row').click();
    await rows.nth(2).getByTestId('row-price').fill('250');
    await expect(frame.getByTestId('invoice-tax')).toHaveText('₹242.86');
    await expect(frame.getByTestId('round-off')).toHaveText('+₹0.39');
    await expect(frame.getByTestId('invoice-total')).toHaveText('₹1,853.00');
    await expect(frame.getByTestId('rate-summary').locator('tbody tr')).toHaveCount(2);
  });
});
