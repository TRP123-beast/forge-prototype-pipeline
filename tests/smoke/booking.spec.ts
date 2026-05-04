import { expect, test } from '@playwright/test';

const PROTOTYPE_URL = process.env.PROTOTYPE_URL;

test.skip(
  !PROTOTYPE_URL,
  'PROTOTYPE_URL is not set. Set it to a deployed prototype URL, e.g. PROTOTYPE_URL=https://x.vercel.app npm run test:smoke',
);

test.describe('booking prototype smoke', () => {
  test('home page loads', async ({ page }) => {
    await page.goto(PROTOTYPE_URL!);
    await expect(page.locator('body')).toBeVisible();
  });

  test('no horizontal scroll at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(PROTOTYPE_URL!);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('every internal link returns < 400', async ({ page, request }) => {
    await page.goto(PROTOTYPE_URL!);
    const hrefs = await page.$$eval('a[href]', (els) =>
      els.map((e) => (e as HTMLAnchorElement).href),
    );
    const base = new URL(PROTOTYPE_URL!);
    const internal = hrefs.filter((h) => {
      try {
        const u = new URL(h);
        if (u.origin !== base.origin) return false;
        if (u.hash && u.pathname === base.pathname) return false;
        return true;
      } catch {
        return false;
      }
    });

    for (const href of internal) {
      const response = await request.get(href);
      expect(response.status(), `link ${href}`).toBeLessThan(400);
    }
  });

  test('page is not blank — contains at least one button or link', async ({ page }) => {
    await page.goto(PROTOTYPE_URL!);
    const interactiveCount = await page.locator('button, a').count();
    expect(interactiveCount).toBeGreaterThan(0);
  });
});
