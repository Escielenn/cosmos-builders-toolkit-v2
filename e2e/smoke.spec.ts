// ---------------------------------------------------------------------------
// Smoke suite: the five flows that must never break. Runs against the built
// app (`npm run build:e2e`, served by `vite preview`) with the mocked
// backend in ./fixtures.ts. Fast and deterministic: no network, fixed rows.
// ---------------------------------------------------------------------------
import { test, expect, dismissNotices, WORLD_ID, WORLD_NAME, DOC_ID, DOC_TITLE } from "./fixtures";

test.describe("signed out", () => {
  test.use({ signedIn: false });

  test("landing renders and the sign-in page renders", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("These worlds exist in you. Waiting to be found.").first()).toBeVisible();
    const start = page.getByRole("link", { name: /start writing/i }).first();
    await expect(start).toBeVisible();

    await start.click();
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByRole("heading", { name: "CREATE ACCOUNT" })).toBeVisible();
    await expect(page.getByLabel("Email").first()).toBeVisible();

    // The sign-in form sits behind the "Already have an account?" toggle.
    await page.getByRole("button", { name: /already have an account/i }).click();
    await expect(page.getByRole("button", { name: "AUTHENTICATE", exact: true })).toBeVisible();
  });
});

test.describe("signed in", () => {
  test("home renders the world list", async ({ page }) => {
    await page.goto("/");
    await dismissNotices(page);
    await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
    await expect(page.getByText(WORLD_NAME).first()).toBeVisible();

    await page.goto("/worlds");
    await dismissNotices(page);
    await expect(page.getByRole("link", { name: WORLD_NAME }).first()).toBeVisible();
  });

  test("create world submits an insert to worlds", async ({ page, backend }) => {
    await page.goto("/worlds?create=true");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("World name").fill("Tau Ceti Drift");

    const insert = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/rest/v1/worlds");
    await dialog.getByRole("button", { name: /initialize empty/i }).click();
    const request = (await insert).request();

    expect(request.postDataJSON()).toMatchObject({ name: "Tau Ceti Drift" });
    expect(backend.writesTo("worlds", "POST")).toHaveLength(1);
  });

  test("typing in the manuscript saves the text to world_entries", async ({ page, backend }) => {
    await page.goto(`/worlds/${WORLD_ID}/write/${DOC_ID}`);
    await dismissNotices(page);
    const editor = page.locator('.ProseMirror[contenteditable="true"]').first();
    await expect(editor).toContainText("The gravity here was 1.8 g.");

    const save = page.waitForResponse((r) => {
      const q = r.request();
      return q.method() === "PATCH" && new URL(q.url()).pathname === "/rest/v1/world_entries" && (q.postData() ?? "").includes("Ix felt every gram");
    });
    await editor.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Ix felt every gram of it.");
    const request = (await save).request();

    expect(new URL(request.url()).searchParams.get("id")).toBe(`eq.${DOC_ID}`);
    expect(String((request.postDataJSON() as { content: string }).content)).toContain("Ix felt every gram of it.");
    expect(backend.writesTo("world_entries", "PATCH").length).toBeGreaterThan(0);
    await expect(page.getByText(DOC_TITLE).first()).toBeVisible();
  });

  test("export dialog downloads the world as JSON", async ({ page }) => {
    await page.goto("/worlds");
    await dismissNotices(page);
    await page.getByRole("button", { name: "World options" }).first().click();
    await page.getByRole("menuitem", { name: /export/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("tab", { name: "JSON" }).click();

    const download = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download" }).click();
    const file = await download;

    expect(file.suggestedFilename()).toMatch(/\.json$/);
    const path = await file.path();
    const { readFileSync } = await import("node:fs");
    const data = JSON.parse(readFileSync(path, "utf8"));
    expect(JSON.stringify(data)).toContain(WORLD_NAME);
  });
});
