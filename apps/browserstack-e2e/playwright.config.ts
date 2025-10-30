import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'list',
  use: {
    actionTimeout: 0,
    baseURL: 'https://www.browserstack.com',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chrome',
        use: {
        channel: 'chrome',
      },
    }
  ],
  webServer: undefined
});


