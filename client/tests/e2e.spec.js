const { test, expect } = require('@playwright/test');

test('Login and load game', async ({ page }) => {
  await page.goto('client/login.html');

  await page.fill('#username', 'test1');
  await page.fill('#password', 'test');
  await page.click('button[type="submit"]');

  await expect(page.url()).toContain('/game.html');

  const gameCanvas = await page.$('#gameCanvas');
  expect(gameCanvas).toBeTruthy();
});
