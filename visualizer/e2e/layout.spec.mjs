// Runs on desktop and phone sizes: no page scrolls sideways.
import { expect, test } from './fixtures.mjs';

for (const path of ['/', '/landscape', '/topics', '/test-data', '/service/das-commitments']) {
  test(`${path} fits the screen width`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('#content')).not.toBeEmpty();
    const [scrollWidth, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    expect(scrollWidth).toBeLessThanOrEqual(width);
  });
}
