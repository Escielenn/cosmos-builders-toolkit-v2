// ---------------------------------------------------------------------------
// Planet preview (2.0 G): PlanetScene mounts behind the Pro gate, renders
// every reference world on both tiers without a console error, and is a
// two-way surface: clicking the planet (on the canvas or the DOM button)
// opens its canon entry.
//
// SHOTS_DIR=/path writes screenshots at 1440 and 390 for review.
// ---------------------------------------------------------------------------
import { mkdirSync } from "node:fs";
import { test, expect, WORLD_ID, USER_ID } from "./fixtures";
import type { Page } from "@playwright/test";

const PLANET_ID = "66666666-6666-6666-6666-666666666666";
const SYSTEM_ID = "77777777-7777-7777-7777-777777777777";
const STAMP = "2026-10-01T00:00:00Z";
const SHOTS = process.env.SHOTS_DIR;

function seedCanon(tables: Record<string, Record<string, unknown>[]>) {
  tables.subscriptions = [
    { id: "sub-1", user_id: USER_ID, status: "active", tier: "pro", plan_type: "monthly", stripe_subscription_id: "sub_x", created_at: STAMP, current_period_end: "2027-01-01T00:00:00Z" },
  ];
  const entry = (id: string, type: string, title: string, parent: string | null, metadata: Record<string, unknown>) => ({
    id, world_id: WORLD_ID, entry_type: type, title, content: "", metadata, tags: [], parent_id: parent,
    sort_order: 0, trashed_at: null, word_count: 0, content_version: 1, created_by: USER_ID,
    created_at: STAMP, updated_at: STAMP, layer: null, icon: null, color: null, cover_image_url: null,
  });
  tables.world_entries.push(
    entry(SYSTEM_ID, "star", "Kellis", null, {}),
    entry(PLANET_ID, "planet", "Kellis Prime", SYSTEM_ID, {
      _published_facts: [
        { predicate: "star.spectral_class", label: "Star", value: "K3V" },
        { predicate: "planet.mass", label: "Mass", value: 1.3 },
        { predicate: "planet.radius", label: "Radius", value: 1.1 },
        { predicate: "planet.atmo_pressure", label: "Pressure", value: 0.6 },
        { predicate: "planet.atmo_composition", label: "Composition", value: "N2/CO2" },
        { predicate: "planet.hydrosphere_fraction", label: "Ocean", value: 0.4 },
        { predicate: "orbit.tidally_locked", label: "Locked", value: "true" },
      ],
      _source: { kind: "sim", tool_id: "tidelock", run_id: "r1", seed: null, published_at: STAMP },
    }),
  );
}

async function settle(page: Page) {
  const scene = page.getByTestId("planet-scene");
  await expect(scene).toBeVisible({ timeout: 25_000 });
  await expect(scene.locator("canvas")).toBeVisible();
  // Let the camera flight finish and a few frames land.
  await page.waitForTimeout(1600);
}

async function shoot(page: Page, name: string) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

test.describe("planet preview", () => {
  // Software WebGL in CI is slow, and screenshot runs shoot two sizes.
  test.setTimeout(SHOTS ? 120_000 : 60_000);
  test.beforeEach(async ({ backend }) => {
    seedCanon(backend.tables);
  });

  const presets = ["earth", "eyeball", "airless-m-dwarf", "venus", "ringed-giant"];

  for (const id of presets) {
    test(`renders the ${id} reference world without errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error" && /three|WebGL|shader|GLSL/i.test(m.text())) errors.push(m.text());
      });
      await page.goto(`/simulators/planet-preview?preset=${id}`);
      await settle(page);
      await expect(page.getByRole("region", { name: "Readout" })).toBeVisible();
      const ms = await page.getByTestId("planet-scene").getAttribute("data-frame-ms");
      console.info(`[frame] ${id} ${await page.getByTestId("planet-scene").getAttribute("data-tier")} ${ms ?? "n/a"} ms`);
      await shoot(page, `1440-${id}`);
      if (SHOTS) {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(900);
        await shoot(page, `390-${id}`);
      }
      expect(errors).toEqual([]);
    });
  }

  test("draws the chart tier when chosen in Display settings", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("sf-render-quality", "chart"));
    for (const id of SHOTS ? ["earth", "ringed-giant", "eyeball"] : ["earth"]) {
      await page.goto(`/simulators/planet-preview?preset=${id}`);
      await settle(page);
      await expect(page.getByTestId("planet-scene")).toHaveAttribute("data-tier", "chart");
      await shoot(page, `1440-chart-${id}`);
    }
    if (SHOTS) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(900);
      await shoot(page, `390-chart-ringed-giant`);
    }
  });

  test("draws the chart tier on a light theme, as ink on paper", async ({ page }) => {
    test.skip(!SHOTS, "screenshot only");
    await page.addInitScript(() => localStorage.setItem("sf-theme", "paper-teal"));
    await page.goto(`/simulators/planet-preview?preset=earth`);
    await expect(page.getByTestId("planet-scene")).toHaveAttribute("data-tier", "chart");
    await settle(page);
    await shoot(page, `1440-chart-light-earth`);
  });

  test("opens a canon planet and its entry, from the button and from the canvas", async ({ page }) => {
    await page.goto(`/simulators/planet-preview?entityId=${PLANET_ID}`);
    await settle(page);
    await expect(page.getByRole("region", { name: "Readout" }).getByText("Kellis Prime")).toBeVisible();
    await shoot(page, "1440-canon-kellis-prime");

    // The canvas: the planet sits at the centre of the stage.
    const canvas = page.getByTestId("planet-scene").locator("canvas");
    const box = (await canvas.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(new RegExp(`/worlds/${WORLD_ID}/codex/${PLANET_ID}`));

    await page.goto(`/simulators/planet-preview?entityId=${PLANET_ID}`);
    await settle(page);
    await page.getByRole("button", { name: "Open star entry" }).click();
    await expect(page).toHaveURL(new RegExp(`/worlds/${WORLD_ID}/codex/${SYSTEM_ID}`));
  });

  test("says so when a reference world has no entry", async ({ page }) => {
    await page.goto(`/simulators/planet-preview?preset=earth`);
    await settle(page);
    await page.getByRole("button", { name: "Planet entry" }).click();
    await expect(page.getByRole("status").filter({ hasText: "PLANET NOT IN CANON" })).toBeVisible();
  });
});
