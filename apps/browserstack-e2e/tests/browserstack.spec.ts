import { expect, Page } from '@playwright/test';
const { test } = require('../fixture');

test('visits browserstack.com and validates title', async ({ page }: { page: Page }) => {
  await page.goto('https://www.browserstack.com/');
  await expect(page).toHaveTitle(/BrowserStack/i);
  await page.waitForTimeout(10000);
});


