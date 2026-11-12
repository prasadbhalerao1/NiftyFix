import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

test.describe('Percentage Calculator', () => {
  test('answers each percentage question as you type', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/calculators/percentage-calculator/');
    const frame = toolFrame(page);
    await expect(frame.getByTestId('pct-of-answer')).toHaveText('450');
    await frame.getByTestId('change-a').fill('100');
    await frame.getByTestId('change-b').fill('80');
    await expect(frame.getByTestId('change-answer')).toHaveText('20%');
    await expect(frame.getByText('decrease', { exact: true })).toBeVisible();
    await expect(frame.getByTestId('apply-answer')).toHaveText('850');
    await frame.getByTestId('apply-sign').click();
    await expect(frame.getByTestId('apply-answer')).toHaveText('1,150');
    await expect(frame.getByTestId('reverse-answer')).toHaveText('1,000');
    await frame.getByTestId('what-b').fill('0');
    await expect(frame.getByTestId('what-answer')).toHaveText('-');
    expect(problems).toEqual([]);
  });

  test('the marks page leads with marks percentage', async ({ page }) => {
    await page.goto('/calculators/marks-percentage-calculator/');
    const frame = toolFrame(page);
    await expect(frame.getByTestId('marks-answer')).toHaveText('86.4%');
    await frame.getByTestId('marks-got').fill('523');
    await frame.getByTestId('marks-total').fill('600');
    await expect(frame.getByTestId('marks-answer')).toHaveText('87.1667%');
  });
});
