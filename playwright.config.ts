import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the production builds served by preview
 * servers that apply the same security headers as production (`_headers`).
 * Site and tool frame are separate origins (localhost vs 127.0.0.1).
 * Build first: `pnpm build`.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter @niftyfix/site preview',
      url: 'http://localhost:4321/',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @niftyfix/tool-frame preview',
      url: 'http://127.0.0.1:4322/',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
