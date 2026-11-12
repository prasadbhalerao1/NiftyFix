import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

test.describe('Password Generator', () => {
  test('generates strong passwords with every chosen character type', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/generators/password-generator/');
    const frame = toolFrame(page);
    const first = frame.getByTestId('password').first();
    await expect(first).toHaveText(/^.{16}$/);
    const value = (await first.textContent()) ?? '';
    expect(value).toMatch(/[a-z]/);
    expect(value).toMatch(/[A-Z]/);
    expect(value).toMatch(/\d/);
    expect(value).toMatch(/[^a-zA-Z0-9]/);
    await frame.getByTestId('generate').click();
    await expect(first).not.toHaveText(value);
    await frame.getByText('PIN', { exact: true }).click();
    await expect(first).toHaveText(/^\d{6}$/);
    expect(problems).toEqual([]);
  });

  test('the strength checker flags weak passwords', async ({ page }) => {
    await page.goto('/generators/password-strength-checker/');
    const frame = toolFrame(page);
    await frame.getByTestId('check-in').fill('password123');
    await expect(frame.getByTestId('strength')).toContainText('Very weak');
    await expect(frame.getByTestId('strength')).toContainText('very common password');
    await frame.getByTestId('check-in').fill('k7#Rm2!vQz9@Lp4&Xw8$');
    await expect(frame.getByTestId('strength')).toContainText('Very strong');
  });
});
