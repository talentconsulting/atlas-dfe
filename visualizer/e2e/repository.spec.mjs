// A repository's page and each of its view tabs.
import { expect, openTab, test } from './fixtures.mjs';

test('the repository picker opens a repository at its address', async ({ page }) => {
  await page.goto('/service/das-commitments');
  await expect(page.locator('#source-title')).toHaveText('Das Commitments');
  await expect(page.locator('#repo-link')).toHaveAttribute('href', 'https://github.com/SkillsFundingAgency/das-commitments');
  await page.locator('#source-select').selectOption('das-learning');
  await expect(page).toHaveURL(/\/service\/das-learning$/);
  await expect(page.locator('#source-title')).toHaveText('Das Learning');
});

test('tabs with no generated data are disabled', async ({ page }) => {
  await page.goto('/service/das-courses-api');
  await expect(page.locator('[data-view="messages"]')).toBeDisabled();
  await expect(page.locator('[data-view="journeys"]')).toBeDisabled();
  await expect(page.locator('[data-view="database"]')).toBeEnabled();
});

test.describe('data schema', () => {
  test('diagram draws every table, and the grid lists them', async ({ page }) => {
    await openTab(page, 'das-commitments', 'database');
    await expect(page.locator('#erd-cy canvas').first()).toBeAttached();
    await expect(page.locator('#toolbar')).toContainText('8 tables');
    await page.locator('[data-db-view="grid"]').click();
    await expect(page.locator('.schema-card')).toHaveCount(8);
  });

  test('opening a table shows its columns, relationships and indexes', async ({ page }) => {
    await openTab(page, 'das-commitments', 'database');
    await page.locator('[data-db-view="grid"]').click();
    await page.locator('.schema-card', { hasText: 'dbo.ChangeOfPartyRequest' }).click();
    await expect(page.locator('#content h2')).toHaveText('ChangeOfPartyRequest');
    for (const tab of ['relationships', 'indexes', 'columns']) {
      await page.locator(`[data-table-tab="${tab}"]`).click();
      await expect(page.locator(`#table-${tab}-panel`)).toBeVisible();
    }
    await page.locator('#back').click();
    await expect(page.locator('.schema-card')).toHaveCount(8);
  });

  test('test data view picks up the tables a table needs', async ({ page }) => {
    await openTab(page, 'das-commitments', 'database');
    await page.locator('[data-db-view="testdata"]').click();
    await page.locator('#td-table').selectOption('ChangeOfPartyRequest');
    await expect(page.locator('.testdata-plan tbody tr td:nth-child(2) code')).toHaveText(['dbo.Commitment', 'dbo.Apprenticeship', 'dbo.ChangeOfPartyRequest']);
    await expect(page.locator('#td-sql')).toContainText('COMMIT TRANSACTION;');
  });

  test('a scanned schema with no tables has no Data schema tab', async ({ page }) => {
    await page.goto('/service/das-payments-v2-common');
    await expect(page.locator('[data-view="database"]')).toBeDisabled();
  });
});

test('events and commands lists the catalogue and shows details', async ({ page }) => {
  await openTab(page, 'das-commitments', 'messages');
  await expect(page.locator('#toolbar')).toContainText('6 events · 6 commands');
  await page.locator('[data-kind="command"]').click();
  await expect(page.locator('[data-kind="command"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-message]').first().click();
  await expect(page.locator('#content .detail')).not.toBeEmpty();
});

test.describe('dependencies', () => {
  test('draws the diagram and lists dependencies', async ({ page }) => {
    await openTab(page, 'das-commitments', 'dependencies');
    await expect(page.locator('#dep-cy canvas').first()).toBeAttached();
    await expect(page.locator('#toolbar')).toContainText('dependencies');
  });

  test('shows the PlantUML source', async ({ page }) => {
    await openTab(page, 'das-commitments', 'dependencies');
    await page.locator('[data-dep-view="puml"]').click();
    await expect(page.locator('#content pre')).toContainText('@startuml');
  });
});

test.describe('API specs', () => {
  test('lists operations from the chosen spec, with details', async ({ page }) => {
    await openTab(page, 'das-commitments', 'openapi');
    await page.locator('#api-file').selectOption('CohortController.openapi.json');
    await expect(page.locator('.list-button', { hasText: '/api/cohorts' }).first()).toBeVisible();
    await page.locator('.list-button').first().click();
    await expect(page.locator('#content .detail')).toContainText('Parameters');
  });

  test('offers the Postman downloads', async ({ page }) => {
    await openTab(page, 'das-commitments', 'openapi');
    await expect(page.locator('a[href$="/postman-collection"]')).toBeVisible();
  });

  test('switches to the models view', async ({ page }) => {
    await openTab(page, 'das-commitments', 'openapi');
    await page.locator('[data-api-view="schemas"]').click();
    await expect(page.locator('[data-api-view="schemas"]')).toHaveAttribute('aria-pressed', 'true');
  });
});

test('local dev lists the services and configuration keys', async ({ page }) => {
  await openTab(page, 'das-commitments', 'localdev');
  await expect(page.locator('#toolbar')).toContainText('configuration keys');
  await expect(page.locator('.service-card').first()).toBeVisible();
});

test('journeys draws a journey, and lists every page', async ({ page }) => {
  await openTab(page, 'das-admin-roatp-web', 'journeys');
  await expect(page.locator('#journey-cy canvas').first()).toBeAttached();
  await page.locator('#journey-picker').selectOption('all');
  await expect(page.locator('[data-journey-page]').first()).toBeVisible();
});

test('a repository that has not been scanned yet still opens', async ({ page }) => {
  await page.goto('/service/das-not-yet-scanned');
  await expect(page.locator('#source-title')).toHaveText('Das Not Yet Scanned');
  await expect(page.locator('#view-tabs [data-view]:not([disabled])')).toHaveCount(0);
  await expect(page.locator('#content')).toContainText('Nothing catalogued yet');
});
