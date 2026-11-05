import { expect, test } from '@playwright/test';

test.describe('Case Converter', () => {
  test('converts in place and undoes', async ({ page }) => {
    await page.goto('/text/case-converter/');
    const frame = page.frameLocator('iframe[data-tool-frame]');
    const input = frame.getByTestId('text-input');
    await input.fill('THE LORD OF THE RINGS');
    await frame.getByTestId('case-title').click();
    await expect(input).toHaveValue('The Lord of the Rings');
    await frame.getByTestId('case-snake').click();
    await expect(input).toHaveValue('the_lord_of_the_rings');
    await frame.getByRole('button', { name: 'Undo' }).click();
    await expect(input).toHaveValue('The Lord of the Rings');
  });
});
