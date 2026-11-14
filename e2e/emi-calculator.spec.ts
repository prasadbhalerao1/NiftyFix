import { expect, test } from '@playwright/test';

test.describe('EMI Calculator', () => {
  test('updates the EMI as the loan changes', async ({ page }) => {
    await page.goto('/calculators/emi-calculator/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    // The test browser says en-US, so the main page opens in dollars.
    await expect(frame.getByTestId('currency')).toHaveValue('USD');
    await frame.getByTestId('currency').selectOption('INR');
    await frame.getByTestId('principal').fill('1000000');
    await frame.getByTestId('rate').fill('10');
    await frame.getByTestId('tenure').fill('10');
    await expect(frame.getByTestId('emi')).toHaveText('₹13,215');
    await expect(frame.getByTestId('total-interest')).toHaveText('₹5,85,809');
    await expect(frame.getByTestId('schedule').locator('tbody tr')).toHaveCount(10);
  });

  test('the car loan page starts from car loan figures', async ({ page }) => {
    await page.goto('/calculators/car-loan-emi-calculator/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await expect(frame.getByTestId('principal')).toHaveValue('800000');
    await expect(frame.getByTestId('tenure')).toHaveValue('5');
  });
});

test.describe('Mortgage calculator', () => {
  test('the US page adds tax, insurance and PMI, and extra payments save interest', async ({
    page,
  }) => {
    await page.goto('/calculators/mortgage-calculator/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await expect(frame.getByTestId('emi')).toHaveText('$2,023');
    await expect(frame.getByTestId('monthly-total')).toHaveText('$2,539');
    await expect(frame.getByTestId('pmi')).toHaveText('$0');
    await frame.getByTestId('down').fill('40000');
    await expect(frame.getByTestId('pmi')).toHaveText('$150');
    await expect(frame.getByTestId('prepay-table')).toContainText('Finish sooner');
  });

  test('the UK page opens in pounds and offers interest only', async ({ page }) => {
    await page.goto('/calculators/mortgage-calculator-uk/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    await expect(frame.getByTestId('currency')).toHaveValue('GBP');
    await expect(frame.getByTestId('ltv')).toContainText('90%');
    await frame.getByText('Interest only', { exact: true }).click();
    await expect(frame.getByTestId('emi')).toHaveText('£1,013');
    await expect(frame.getByTestId('schedule')).toHaveCount(0);
  });
});

test.describe('EMI Calculator planners', () => {
  test('compares reducing tenure with reducing EMI, and a rate rise', async ({ page }) => {
    await page.goto('/calculators/home-loan-emi-calculator/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    const prepay = frame.getByTestId('prepay-table');
    await expect(prepay).toContainText('Reduce tenure');
    await expect(prepay).toContainText('Interest saved');
    await frame.getByTestId('new-rate').fill('9.5');
    await expect(frame.getByTestId('rate-table')).toContainText('Keep EMI, longer loan');
    await frame.getByTestId('new-rate').fill('14');
    await expect(frame.getByTestId('never-ends')).toBeVisible();
  });
});
