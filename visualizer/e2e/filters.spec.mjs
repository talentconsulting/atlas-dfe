// Filtering a repository's views as you type.
import { expect, openTab, test } from './fixtures.mjs';

for (const view of ['database', 'messages', 'dependencies', 'localdev']) {
  test(`typing in the ${view} filter keeps the cursor and the capitals`, async ({ page }) => {
    await openTab(page, 'das-commitments', view);
    if (view === 'database') await page.locator('[data-db-view="grid"]').click();
    const box = page.locator('#search');
    await box.click();
    await page.keyboard.type('Comm');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.type('X');
    await expect(page.locator('#search')).toHaveValue('CoXmm');
    expect(await page.locator('#search').evaluate((element) => [element.selectionStart, document.activeElement === element])).toEqual([3, true]);
  });
}

test('the schema filter narrows the grid, and clearing it brings every table back', async ({ page }) => {
  await openTab(page, 'das-commitments', 'database');
  await page.locator('[data-db-view="grid"]').click();
  // The filter matches table and column names, so other tables with a ChangeOfParty... column stay too.
  await page.locator('#search').fill('changeofparty');
  await expect(page.locator('.schema-card', { hasText: 'dbo.ChangeOfPartyRequest' })).toBeVisible();
  await expect(page.locator('.schema-card', { hasText: 'dbo.Providers' })).toHaveCount(0);
  await page.locator('#search').fill('');
  await expect(page.locator('.schema-card')).toHaveCount(8);
});
