import { test as base, expect } from '@playwright/test';

// Every test fails if the page throws or logs an error, so a broken view can't pass by rendering nothing.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await use(page);
    expect(errors, 'no errors in the page').toEqual([]);
  }
});

export { expect };

// Opens a repository's page and one of its view tabs.
export async function openTab(page, repo, view) {
  await page.goto(`/service/${repo}`);
  await expect(page.locator('#source-title')).not.toHaveText('Loading catalogue…');
  const tab = page.locator(`[data-view="${view}"]`);
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
}
