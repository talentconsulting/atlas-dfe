// The top-level pages: Home, System landscape, Topics and Test data.
import { expect, test } from './fixtures.mjs';

test.describe('home dashboard', () => {
  test('opens on the code security audit, and every tab renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#home-toggle')).toHaveAttribute('aria-current', '');
    for (const tab of ['security', 'apiSecurity', 'metadata', 'databases']) {
      await page.locator(`[data-dashboard-tab="${tab}"]`).click();
      await expect(page.locator(`[data-dashboard-tab="${tab}"]`)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#content table').first()).toBeVisible();
    }
  });

  test('the databases tab lists each scanned repository, and links into its schema', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-dashboard-tab="databases"]').click();
    await expect(page.locator('#content')).toContainText('Das Commitments');
    await page.locator('[data-open-schema="das-commitments"]').first().click();
    await expect(page).toHaveURL(/\/service\/das-commitments$/);
    await expect(page.locator('[data-view="database"]')).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('system landscape', () => {
  test('draws every catalogued system, with APIM shown as a proxy', async ({ page }) => {
    await page.goto('/landscape');
    await expect(page.locator('#source-title')).toHaveText('System landscape');
    await expect(page.locator('#land-cy canvas').first()).toBeAttached();
    // The checklist also lists external systems and gateway areas; the catalogued systems are the sys: ones.
    await expect(page.locator('[data-landscape-toggle^="sys:"]')).toHaveCount(6);
    await expect(page.locator('#landscape-proxy')).toBeChecked();
  });

  test('unticking a system takes it off the diagram', async ({ page }) => {
    await page.goto('/landscape');
    const toggle = page.locator('[data-landscape-toggle="sys:das-courses-api"]');
    await toggle.uncheck();
    await expect(toggle).not.toBeChecked();
  });
});

test('topics groups services by GitHub topic', async ({ page }) => {
  await page.goto('/topics');
  await expect(page.locator('#source-title')).toHaveText('Topics');
  await expect(page.locator('#topic-cy canvas').first()).toBeAttached();
  await expect(page.locator('[data-topic-toggle]').first()).toBeVisible();
});

test.describe('test data page', () => {
  test('picking a table adds the tables it depends on, in insert order, with a script', async ({ page }) => {
    await page.goto('/test-data');
    await expect(page.locator('[data-td-repo-pick]')).toHaveCount(3);
    await page.locator('[data-td-repo-pick="das-commitments"]').check();
    await page.locator('[data-td-of="das-commitments"][data-td-table="ChangeOfPartyRequest"]').check();
    const order = page.locator('.td-repo .testdata-plan tbody tr td:nth-child(2) code');
    await expect(order).toHaveText(['dbo.Commitment', 'dbo.Apprenticeship', 'dbo.ChangeOfPartyRequest']);
    await expect(page.locator('.td-checklist label.needed')).toHaveCount(2);
    const script = page.locator('.td-repo pre');
    await expect(script).toContainText('BEGIN TRANSACTION;');
    await expect(script).toContainText('INSERT INTO [dbo].[ChangeOfPartyRequest]');
  });

  test('a repository with no tables is not offered', async ({ page }) => {
    await page.goto('/test-data');
    await expect(page.locator('[data-td-repo-pick="das-payments-v2-common"]')).toHaveCount(0);
  });
});

test('the browser back button returns to the previous page', async ({ page }) => {
  await page.goto('/');
  await page.locator('#landscape-toggle').click();
  await expect(page).toHaveURL(/\/landscape$/);
  await page.locator('#topics-toggle').click();
  await expect(page).toHaveURL(/\/topics$/);
  await page.goBack();
  await expect(page.locator('#source-title')).toHaveText('System landscape');
});
