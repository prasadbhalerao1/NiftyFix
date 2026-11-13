import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

test.describe('Date Calculator', () => {
  test('counts days and working days between two dates', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/calculators/date-difference/');
    const frame = toolFrame(page);
    await frame.getByTestId('start').fill('2026-01-01');
    await frame.getByTestId('end').fill('2026-01-31');
    await expect(frame.getByTestId('between')).toHaveText('30 days');
    await frame.getByText('Include the end date').click();
    await expect(frame.getByTestId('between')).toHaveText('31 days');
    await expect(frame.getByTestId('working-days')).toContainText('22');
    await frame.getByTestId('holidays').fill('2026-01-26');
    await expect(frame.getByTestId('working-days')).toContainText('21');
    expect(problems).toEqual([]);
  });

  test('adds days to a date', async ({ page }) => {
    await page.goto('/calculators/date-difference/');
    const frame = toolFrame(page);
    await frame.getByTestId('base').fill('2026-01-01');
    await frame.getByTestId('add-days').fill('90');
    await expect(frame.getByTestId('added')).toHaveText('Wednesday, 1 April 2026');
  });
});
