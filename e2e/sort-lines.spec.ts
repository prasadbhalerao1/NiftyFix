import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

test.describe('Sort and Remove Duplicate Lines', () => {
  test('the duplicates page cleans a list as you paste', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/text/remove-duplicate-lines/');
    const frame = toolFrame(page);
    await frame.getByTestId('lines-in').fill('pear\napple\n\npear\n  apple  \nfig');
    await expect(frame.getByTestId('lines-out')).toHaveValue('pear\napple\nfig');
    await expect(frame.getByTestId('lines-stats')).toHaveText(
      '3 of 6 lines · 2 duplicates removed · 1 empty removed',
    );
    expect(problems).toEqual([]);
  });

  test('the sort page alphabetizes, and number order sorts by value', async ({ page }) => {
    await page.goto('/text/sort-lines-alphabetically/');
    const frame = toolFrame(page);
    await frame.getByTestId('lines-in').fill('item 10\nitem 2\nitem 1');
    await expect(frame.getByTestId('lines-out')).toHaveValue('item 1\nitem 10\nitem 2');
    await frame.getByTestId('sort').selectOption('natural');
    await expect(frame.getByTestId('lines-out')).toHaveValue('item 1\nitem 2\nitem 10');
    await frame.getByText('Number the lines').click();
    await expect(frame.getByTestId('lines-out')).toHaveValue('1. item 1\n2. item 2\n3. item 10');
  });
});
