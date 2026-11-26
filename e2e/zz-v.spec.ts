import { test, expect, dismissNotices, WORLD_ID, DOC_ID, USER_ID } from "./fixtures";

const OUT = "/home/claude/shots17-v";
const STAMP = "2026-10-01T00:00:00Z";
const PROSE =
  "<p>Jessa reched Kelis Prime befor dusk. The Vaultborns was waiting, and Thessaly Okonkwo said nothing to to them. Ashmere lay behind her now.</p>" +
  "<p>Teh gravity here was 1.8 g, an it pressed on her chest. Ashmere had never felt like this, and Thessaly knew it.</p>";

function seedWorld(backend: { tables: Record<string, Record<string, unknown>[]> }) {
  const doc = backend.tables.world_entries[0];
  doc.content = PROSE;
  doc.metadata = { pov: "Jessa" };
  const entity = (id: string, type: string, title: string, metadata: Record<string, unknown> = {}) => ({
    id, world_id: WORLD_ID, entry_type: type, title, content: "", metadata, tags: [], parent_id: null,
    sort_order: 5, trashed_at: null, word_count: 0, content_version: 1, created_by: USER_ID, user_id: USER_ID,
    created_at: STAMP, updated_at: STAMP, layer: null, icon: null, color: null, cover_image_url: null,
  });
  backend.tables.world_entries.push(
    entity("66666666-6666-6666-6666-666666666601", "planet", "Kellis Prime", { aliases: ["The Lantern"] }),
    entity("66666666-6666-6666-6666-666666666602", "species", "Vaultborn"),
  );
}

for (const vp of [
  { name: "1440", width: 1440, height: 900 },
  { name: "390", width: 390, height: 844 },
]) {
  test(`room tools ${vp.name}`, async ({ page, backend }) => {
    test.setTimeout(120_000);
    seedWorld(backend);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`/worlds/${WORLD_ID}/write/${DOC_ID}`);
    await dismissNotices(page);
    const editor = page.locator('.ProseMirror[contenteditable="true"]').first();
    await expect(editor).toContainText("Jessa reched");
    await page.screenshot({ path: `${OUT}/${vp.name}-00-bar.png` });

    const open = async (label: RegExp) => {
      if (vp.width < 640) {
        await page.getByRole("button", { name: /Manuscript menu/ }).click();
        await page.getByRole("menuitem", { name: label }).click();
      } else {
        await page.getByRole("button", { name: label }).first().click();
      }
    };

    // Assistant
    await open(/Writing assistant/);
    const panel = page.locator("[data-room-panel]");
    await expect(panel).toBeVisible();
    await page.screenshot({ path: `${OUT}/${vp.name}-01-assistant-off.png` });
    await panel.getByRole("switch", { name: /Local grammar/ }).click();
    await expect(panel.getByText(/CHECKER READY|PARAGRAPH CHECKED/)).toBeVisible({ timeout: 60_000 });
    await panel.getByRole("button", { name: "Review document" }).click();
    await expect(panel.getByText(/REVIEW COMPLETE/)).toBeVisible({ timeout: 60_000 });
    await page.screenshot({ path: `${OUT}/${vp.name}-02-assistant-review.png` });
    console.log("ISSUES", await panel.locator("li").allInnerTexts());
    console.log("SPELLCHECK", await editor.getAttribute("spellcheck"), "UNDERLINES", await editor.locator(".sf-proof").count());
    await panel.getByRole("tab", { name: /New to this world/ }).click();
    await page.screenshot({ path: `${OUT}/${vp.name}-03-assistant-world.png` });
    await panel.getByRole("tab", { name: /Lexicon/ }).click();
    await page.screenshot({ path: `${OUT}/${vp.name}-04-assistant-lexicon.png` });
    await panel.getByRole("button", { name: /Close/ }).click();
    await page.screenshot({ path: `${OUT}/${vp.name}-05-underlines.png` });

    // Targets + timer
    await open(/Targets and focus timer/);
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: "Start timer" }).click();
    await page.waitForTimeout(2300);
    await page.screenshot({ path: `${OUT}/${vp.name}-06-targets.png` });
    await panel.getByRole("button", { name: /Close/ }).click();
    await page.screenshot({ path: `${OUT}/${vp.name}-07-status-timer.png` });

    // Music
    await open(/Writing music/);
    await expect(panel).toBeVisible();
    await page.screenshot({ path: `${OUT}/${vp.name}-08-music.png` });
    await panel.getByLabel(/Spotify or YouTube playlist link/).fill("https://open.spotify.com/playlist/37i9dQZF1DX8NTLI2TtZa6");
    await panel.getByLabel(/Name/).fill("Drift");
    await panel.getByRole("button", { name: "Load playlist" }).click();
    await page.screenshot({ path: `${OUT}/${vp.name}-09-music-loaded.png` });
    console.log("ERRORS", JSON.stringify(errors.slice(0, 12)));
  });
}
