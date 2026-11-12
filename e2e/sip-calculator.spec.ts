import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

test.describe('SIP Calculator', () => {
  test('shows the final value of a monthly SIP with a yearly table', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/calculators/sip-calculator/');
    const frame = toolFrame(page);
    await frame.getByTestId('years').fill('10');
    await expect(frame.getByTestId('total-value')).toContainText('23,23,391');
    await expect(frame.getByTestId('year-table').locator('tbody tr')).toHaveCount(10);
    expect(problems).toEqual([]);
  });

  test('goal mode gives the monthly SIP needed', async ({ page }) => {
    await page.goto('/calculators/sip-calculator/');
    const frame = toolFrame(page);
    await frame.getByText('Goal', { exact: true }).click();
    await expect(frame.getByTestId('goal-sip')).toContainText('to reach ₹1,00,00,000 (1 crore)');
  });

  test('the lumpsum page grows a one-time amount', async ({ page }) => {
    await page.goto('/calculators/lumpsum-calculator/');
    const frame = toolFrame(page);
    await frame.getByTestId('lumpsum').fill('100000');
    await frame.getByTestId('years').fill('1');
    await expect(frame.getByTestId('total-value')).toContainText('1,12,683');
  });
});
