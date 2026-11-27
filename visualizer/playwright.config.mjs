import { defineConfig, devices } from '@playwright/test';

// Browser tests run the viewer against the fixture catalogue (test/fixtures/catalogue), never the live one.
const port = Number(process.env.E2E_PORT || 8181);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /layout\.spec\.mjs/ }
  ],
  webServer: {
    command: 'node server.mjs',
    url: `http://127.0.0.1:${port}/api/catalog`,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT: String(port),
      CATALOGUE_DATA_DIR: new URL('./test/fixtures/catalogue/', import.meta.url).pathname,
      CATALOGUE_REPOSITORY_URL: 'https://github.com/example/atlas-fixtures',
      AUTH_PASSWORD: ''
    }
  }
});
