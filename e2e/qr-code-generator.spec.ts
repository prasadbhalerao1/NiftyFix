import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { readImageHeader } from '../packages/engines/image/src/header';
import { recordProblems, toolFrame } from './helpers';

test.describe('QR Code Generator', () => {
  test('makes a UPI payment code and downloads a PNG of the chosen size', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/generators/upi-qr-code-generator/');
    const frame = toolFrame(page);
    await frame.getByTestId('field-pa').fill('ramstores@okhdfcbank');
    await frame.getByTestId('field-pn').fill('Ram Stores');
    await expect(frame.getByTestId('qr-payload')).toHaveText(
      'Holds: upi://pay?pa=ramstores%40okhdfcbank&pn=Ram%20Stores&cu=INR',
    );
    await expect(frame.getByTestId('qr-preview').locator('svg path')).toHaveCount(1);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download-png').click(),
    ]);
    expect(download.suggestedFilename()).toBe('qr-code-upi.png');
    expect(readImageHeader(readFileSync(await download.path()))).toEqual({
      format: 'png',
      width: 1024,
      height: 1024,
    });
    expect(problems).toEqual([]);
  });

  test('makes Wi-Fi and link codes, and an SVG', async ({ page }) => {
    await page.goto('/generators/wifi-qr-code-generator/');
    const frame = toolFrame(page);
    await frame.getByTestId('field-ssid').fill('Home;Net');
    await frame.getByTestId('field-password').fill('secret123');
    await expect(frame.getByTestId('qr-payload')).toHaveText(
      'Holds: WIFI:T:WPA;S:Home\\;Net;P:secret123;;',
    );
    await frame.getByTestId('kind').selectOption('url');
    await frame.getByTestId('field-url').fill('niftyfix.in');
    await expect(frame.getByTestId('qr-payload')).toHaveText('Holds: https://niftyfix.in');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download-svg').click(),
    ]);
    expect(readFileSync(await download.path(), 'utf8')).toMatch(
      /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 (\d+) \1"/,
    );
  });
});
