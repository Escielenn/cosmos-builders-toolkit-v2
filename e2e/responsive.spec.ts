// ---------------------------------------------------------------------------
// Responsive guard: the key routes and all five simulators, at a phone
// (390px) and a desktop (1440px) width, must not scroll sideways and must
// not throw. Release 1.8 swept every route at seven sizes (360 to 1440,
// both landscapes); this keeps the cheap, high-value part of that sweep in
// CI so a fixed-width panel or a toolbar that runs off a phone fails here.
//
// "No horizontal overflow" is the document check (scrollWidth <= innerWidth)
// plus the same check inside each simulator's iframe, which is where the
// static sims lay out their own panels.
// ---------------------------------------------------------------------------
import { test, expect, dismissNotices, WORLD_ID, DOC_ID, USER_ID } from "./fixtures";
import type { Page } from "@playwright/test";

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1440, height: 900 },
] as const;

const SIGNED_OUT = ["/", "/pricing", "/auth", "/guide/tools"];
const SIGNED_IN = [
  "/",
  "/tools",
  `/worlds/${WORLD_ID}`,
  `/worlds/${WORLD_ID}/write/${DOC_ID}`,
  "/tools/planetary-profile",
];
const SIMULATORS = ["/rogue", "/tools/exoforge", "/tools/solaris", "/tools/tidelock", "/tools/exosky"];

/** Widest document in the page and its frames, against its own viewport. */
async function overflow(page: Page): Promise<string[]> {
  const bad: string[] = [];
  for (const frame of page.frames()) {
    const r = await frame
      .evaluate(() => ({ url: location.pathname, sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
      .catch(() => null);
    if (r && r.iw > 0 && r.sw > r.iw + 1) bad.push(`${r.url}: scrollWidth ${r.sw} > ${r.iw}`);
  }
  return bad;
}

/** The route has rendered and its (mocked) data requests have finished. */
async function settlePage(page: Page): Promise<void> {
  await page.locator("main, h1, [contenteditable]").first().waitFor({ state: "attached" });
  await page.waitForTimeout(400);
}

async function check(page: Page, path: string, settle: (page: Page) => Promise<void>): Promise<void> {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const vp of VIEWPORTS) {
    await page.setViewportSize(vp);
    await page.goto(path);
    await settle(page);
    await dismissNotices(page);
    expect(await overflow(page), `${path} at ${vp.width}px`).toEqual([]);
  }
  expect(errors, `${path} page errors`).toEqual([]);
}

test.describe("responsive: signed out", () => {
  test.use({ signedIn: false });
  for (const path of SIGNED_OUT) {
    test(`no sideways scroll ${path}`, async ({ page }) => {
      await check(page, path, settlePage);
    });
  }
});

test.describe("responsive: signed in", () => {
  for (const path of SIGNED_IN) {
    test(`no sideways scroll ${path}`, async ({ page, backend }) => {
      backend.tables.subscriptions = [PRO];
      await check(page, path, settlePage);
    });
  }
});

test.describe("responsive: simulators", () => {
  for (const path of SIMULATORS) {
    test(`no sideways scroll ${path}`, async ({ page, backend }) => {
      backend.tables.subscriptions = [PRO];
      await check(page, path, async () => {
        // The sim's iframe (or ExoSky's canvas) has had time to lay out.
        await page.locator("#main iframe, #main canvas").first().waitFor({ timeout: 15_000 });
        await page.waitForTimeout(800);
      });
    });
  }
});

/** An active Pro subscription, so the Pro tools and sims render, not their preview. */
const PRO = {
  id: "66666666-6666-6666-6666-666666666666",
  user_id: USER_ID,
  status: "active",
  tier: "pro",
  plan_type: "monthly",
  current_period_end: "2027-12-01T00:00:00Z",
  cancel_at_period_end: false,
  created_at: "2026-10-01T00:00:00Z",
};
