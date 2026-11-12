import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

test.describe('Text Repeater', () => {
  test('repeats text with the chosen separator and counts characters', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/text/text-repeater/');
    const frame = toolFrame(page);
    await frame.getByTestId('repeat-in').fill('Hi');
    await frame.getByTestId('times').fill('3');
    await expect(frame.getByTestId('repeat-out')).toHaveValue('Hi\nHi\nHi');
    await frame.getByText('Comma', { exact: true }).click();
    await frame.getByText('Number each copy').click();
    await expect(frame.getByTestId('repeat-out')).toHaveValue('1. Hi, 2. Hi, 3. Hi');
    await expect(frame.getByTestId('repeat-stats')).toHaveText('19 characters');
    expect(problems).toEqual([]);
  });
});

test.describe('Text Cleaner', () => {
  test('joins lines broken in a PDF copy, keeping paragraphs', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/text/remove-line-breaks/');
    const frame = toolFrame(page);
    await frame
      .getByTestId('clean-in')
      .fill('This is a sen-\ntence from\na  PDF.\n\nSecond\nparagraph.');
    await expect(frame.getByTestId('clean-out')).toHaveValue(
      'This is a sentence from a PDF.\n\nSecond paragraph.',
    );
    expect(problems).toEqual([]);
  });

  test('the one-line page removes every break', async ({ page }) => {
    await page.goto('/text/remove-all-line-breaks/');
    const frame = toolFrame(page);
    await frame.getByTestId('clean-in').fill('a\nb\n\nc');
    await expect(frame.getByTestId('clean-out')).toHaveValue('a b c');
  });
});
