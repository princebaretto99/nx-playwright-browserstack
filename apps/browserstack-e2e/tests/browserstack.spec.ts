import { test, expect } from '@playwright/test';

test('visits browserstack.com and validates title', async ({ page }) => {
  await page.goto('https://www.browserstack.com/');
  await expect(page).toHaveTitle(/BrowserStack/i);
  await page.waitForTimeout(10000);
});


