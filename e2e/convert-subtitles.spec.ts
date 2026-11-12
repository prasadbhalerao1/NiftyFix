import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { recordProblems, toolFrame } from './helpers';

const SRT = '1\n00:00:01,500 --> 00:00:03,000\nHello\n\n2\n00:00:04,000 --> 00:00:06,000\nWorld\n';

test.describe('Subtitle Converter and Sync', () => {
  test('converts an SRT file to VTT and downloads it', async ({ page }) => {
    const problems = recordProblems(page);
    await page.goto('/subtitles/convert-subtitles/');
    const frame = toolFrame(page);
    await frame
      .getByTestId('file-input')
      .setInputFiles({ name: 'movie.srt', mimeType: 'text/plain', buffer: Buffer.from(SRT) });
    await expect(frame.getByTestId('subs-stats')).toHaveText('2 subtitles read from SRT');
    await expect(frame.getByTestId('subs-out')).toHaveValue(
      /^WEBVTT\n\n00:00:01\.500 --> 00:00:03\.000\nHello/,
    );
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.getByTestId('download-subs').click(),
    ]);
    expect(download.suggestedFilename()).toBe('movie.vtt');
    expect(readFileSync(await download.path(), 'utf8')).toContain('00:00:04.000 --> 00:00:06.000');
    expect(problems).toEqual([]);
  });

  test('the sync page shifts every timing', async ({ page }) => {
    await page.goto('/subtitles/sync-subtitles/');
    const frame = toolFrame(page);
    await frame.getByTestId('subs-in').fill(SRT);
    await frame.getByTestId('shift').fill('-1');
    await expect(frame.getByTestId('subs-out')).toHaveValue(
      /^1\n00:00:00,500 --> 00:00:02,000\nHello/,
    );
  });

  test('explains text that is not subtitles', async ({ page }) => {
    await page.goto('/subtitles/convert-subtitles/');
    const frame = toolFrame(page);
    await frame.getByTestId('subs-in').fill('just some words');
    await expect(frame.getByTestId('subs-error')).toBeVisible();
  });
});
