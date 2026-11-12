import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

test.describe('Age Calculator', () => {
  test('gives the exact age on a chosen date with totals', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/calculators/age-calculator/');
    const frame = toolFrame(page);
    await frame.getByTestId('birth').fill('1995-08-15');
    await frame.getByTestId('on').fill('2026-11-13');
    await expect(frame.getByTestId('age')).toContainText('31 years, 2 months and 29 days');
    await expect(frame.getByTestId('total-days')).toContainText('11,413');
    expect(problems).toEqual([]);
  });

  test('the exam page checks the age limit and gives the birth-date range', async ({ page }) => {
    await page.goto('/calculators/age-calculator-for-exam/');
    const frame = toolFrame(page);
    await frame.getByTestId('on').fill('2026-08-01');
    await frame.getByTestId('birth').fill('2005-08-02');
    const eligibility = frame.getByTestId('eligibility');
    await expect(eligibility).toContainText('born between 2 August 1993 and 1 August 2005');
    await expect(eligibility).toContainText('You are outside the age limit.');
    await frame.getByTestId('birth').fill('2005-08-01');
    await expect(eligibility).toContainText('You are within the age limit.');
  });
});
