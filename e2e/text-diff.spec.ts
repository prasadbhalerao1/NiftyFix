import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

test.describe('Text Diff Checker', () => {
  test('shows changed lines with the changed words, and downloads a patch', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/text/text-diff/');
    const frame = toolFrame(page);
    await frame.getByTestId('diff-original').fill('apples\nprice: 100\npears');
    await frame.getByTestId('diff-changed').fill('apples\nprice: 120\npears\nplums');
    await expect(frame.getByTestId('diff-summary')).toContainText(
      '1 lines added · 0 removed · 1 changed',
    );
    const changed = frame.locator('tr[data-type="change"]');
    await expect(changed.locator('mark')).toHaveText(['100', '120']);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByText('Download .patch').click(),
    ]);
    const patch = readFileSync(await download.path(), 'utf8');
    expect(patch).toContain('-price: 100\n+price: 120\n');
    expect(problems).toEqual([]);
  });

  test('ignores case and spacing when asked', async ({ page }) => {
    await page.goto('/text/text-diff/');
    const frame = toolFrame(page);
    await frame.getByTestId('diff-original').fill('Hello   World');
    await frame.getByTestId('diff-changed').fill('hello world');
    await expect(frame.getByTestId('diff-summary')).toContainText('1 changed');
    await frame.getByText('Ignore case').click();
    await frame.getByText('Ignore spaces and indentation').click();
    await expect(frame.getByTestId('diff-summary')).toHaveText('No differences.');
  });

  test('the JSON diff page ignores key order', async ({ page }) => {
    await page.goto('/text/json-diff/');
    const frame = toolFrame(page);
    await frame.getByTestId('diff-original').fill('{"b": 1, "a": 2}');
    await frame.getByTestId('diff-changed').fill('{"a": 2, "b": 1}');
    await expect(frame.getByTestId('diff-summary')).toHaveText('No differences.');
    await frame.getByTestId('diff-changed').fill('{"a": 3');
    await expect(frame.getByTestId('diff-error')).toContainText('Changed JSON');
  });
});
