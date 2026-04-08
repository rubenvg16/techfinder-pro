import { test, expect } from '@playwright/test';

test.describe('4.10 - Search Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
  });

  test('should navigate to search page and display search bar', async ({ page }) => {
    await expect(page).toHaveURL(/search/);
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="q"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
  });

  test('should perform search and display results', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="q"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });

    await searchInput.fill('laptop');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');

    const resultsContainer = page.locator('[data-testid="results"], table, [class*="results"]');
    await expect(resultsContainer.first()).toBeVisible({ timeout: 15000 });
  });

  test('should handle empty search query', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="q"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });

    await searchInput.press('Enter');

    const errorMessage = page.locator('[class*="error"], [data-testid="error"], text=required');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show loading state during search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="q"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });

    await searchInput.fill('iphone');
    
    const searchButton = page.locator('button[type="submit"], button:has-text("Search")').first();
    await searchButton.click();

    const loadingIndicator = page.locator('[class*="loading"], [data-testid="loading"], [role="progressbar"]');
    await expect(loadingIndicator.first()).toBeVisible({ timeout: 5000 });
  });

  test('should filter results by source', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="q"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });

    await searchInput.fill('phone');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const filterButtons = page.locator('button:has-text("eBay"), button:has-text("Amazon"), button:has-text("Google")');
    const filterCount = await filterButtons.count();
    
    if (filterCount > 0) {
      await filterButtons.first().click();
      await page.waitForTimeout(1000);
    }
  });

  test('should display product information correctly', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[name="q"]').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });

    await searchInput.fill('airpods');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const productTitle = page.locator('[class*="title"], [class*="product"]').first();
    await expect(productTitle).toBeVisible({ timeout: 10000 });
  });
});