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
export function recordProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content[- ]Security[- ]Policy|CSP/i.test(message.text()))
      problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}
