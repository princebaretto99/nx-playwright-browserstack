const { test, expect } = require('@playwright/test');

test('visits browserstack.com and validates title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/BrowserStack/i);
  await page.waitForTimeout(10000);
});


