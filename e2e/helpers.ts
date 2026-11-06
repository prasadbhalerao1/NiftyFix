import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type FrameLocator, type Page, type Request } from '@playwright/test';

export const SITE_ORIGIN = 'http://localhost:4321';
export const FRAME_ORIGIN = 'http://127.0.0.1:4322';
export const TOOL_PATH = '/forms/photo-resizer/';

export const fixture = (relative: string): string =>
  join(import.meta.dirname, '..', 'fixtures', relative);
export const readFixture = (relative: string): Buffer => readFileSync(fixture(relative));

export function toolFrame(page: Page): FrameLocator {
  return page.frameLocator('iframe[data-tool-frame]');
}

export async function openTool(page: Page): Promise<FrameLocator> {
  await page.goto(TOOL_PATH);
  const frame = toolFrame(page);
  await expect(frame.getByRole('button', { name: /Choose a photo/ })).toBeVisible();
  return frame;
}

export async function chooseFile(frame: FrameLocator, relative: string): Promise<void> {
  await frame.getByTestId('file-input').setInputFiles(fixture(relative));
}

/** Record every request made by any frame of the page, with the frame's URL. */
export function recordRequests(page: Page): {
  requests: { url: string; method: string; frameUrl: string }[];
} {
  const log = { requests: [] as { url: string; method: string; frameUrl: string }[] };
  page.on('request', (request: Request) => {
    const frameUrl = ((): string => {
      try {
        return request.frame().url();
      } catch {
        return '(service worker or detached)';
      }
    })();
    log.requests.push({ url: request.url(), method: request.method(), frameUrl });
  });
  return log;
}

/** Collect CSP violations and uncaught errors from the page and its frames. */
/**
 * WebKit logs this for its own built-in <select> control under `style-src 'self'`,
 * even on a page with nothing else (checked with a bare <select>). Chromium runs
 * the same pages under the same policy, so a real inline style still fails there.
 */
const WEBKIT_SELECT_NOISE =
  "Refused to apply a stylesheet because its hash, its nonce, or 'unsafe-inline' does not appear in the style-src directive of the Content Security Policy.";

export function recordProblems(page: Page): string[] {
  const problems: string[] = [];
  const webkit = page.context().browser()?.browserType().name() === 'webkit';
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (webkit && message.text() === WEBKIT_SELECT_NOISE) return;
    if (/Content[- ]Security[- ]Policy|CSP/i.test(message.text())) problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}
