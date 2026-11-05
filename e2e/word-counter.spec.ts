import { expect, test } from '@playwright/test';

test.describe('Word Counter', () => {
  test('counts as you type, in English and Hindi', async ({ page }) => {
    await page.goto('/text/word-counter/');
    await expect(page.getByText('nothing you type is sent anywhere')).toBeVisible();
    // An interactive tool has no file panel on its page.
    await expect(page.getByText('Maximum file size')).toHaveCount(0);
    const frame = page.frameLocator('iframe[data-tool-frame]');
    const input = frame.getByTestId('text-input');
    await input.fill('Hello world. This is a test!\n\nनमस्ते दुनिया।');
    await expect(frame.getByTestId('words')).toHaveText('8');
    await expect(frame.getByTestId('sentences')).toHaveText('3');
    await expect(frame.getByTestId('paragraphs')).toHaveText('2');
    await input.fill('');
    await expect(frame.getByTestId('words')).toHaveText('0');
  });
});

test('Word Counter tracks your own limit and repeated words', async ({ page }) => {
  await page.goto('/text/word-counter/');
  const frame = page.frameLocator('iframe[data-tool-frame]');
  await frame.getByTestId('target').fill('5');
  await frame.getByTestId('text-input').fill('great project, great team, great results today');
  await expect(frame.getByTestId('target-status')).toHaveText('2 words over the limit');
  await expect(frame.getByTestId('repeated')).toContainText('great');
});
