// ---------------------------------------------------------------------------
// Mocked Supabase backend for the smoke suite.
//
// The app is built against https://fakeproj.supabase.co (.env.e2e). Every
// request to that host is answered here from an in-memory store, so the
// suite needs no network, no keys and no seed data, and every run sees the
// same rows. Writes are recorded in `backend.writes` for assertions.
//
// Signed-in tests seed a session in localStorage under the supabase-js key
// for the fake project (sb-fakeproj-auth-token); /auth/v1/user returns the
// same user, so AuthContext treats it as a live session.
// ---------------------------------------------------------------------------
import { readFileSync } from "node:fs";
import { test as base, expect, type Page, type Request, type Route } from "@playwright/test";

export const SUPABASE = "https://fakeproj.supabase.co";
export const WORLD_ID = "11111111-1111-1111-1111-111111111111";
export const USER_ID = "22222222-2222-2222-2222-222222222222";
export const DOC_ID = "33333333-3333-3333-3333-333333333333";
export const WORLD_NAME = "Kepler Reach";
export const DOC_TITLE = "Chapter One";

const STAMP = "2026-10-01T00:00:00Z";

export const USER = {
  id: USER_ID,
  aud: "authenticated",
  role: "authenticated",
  email: "pilot@example.com",
  app_metadata: { provider: "email" },
  user_metadata: {},
  created_at: STAMP,
};

function session() {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER_ID, role: "authenticated", aud: "authenticated", exp: now + 36000 })}.sig`;
  return { access_token: jwt, refresh_token: "refresh", token_type: "bearer", expires_in: 36000, expires_at: now + 36000, user: USER };
}

type Row = Record<string, unknown>;

/**
 * Every badge id, marked earned, so the BADGE EARNED dialog never lands on
 * top of a flow mid-test. Read from the definitions so new badges are
 * covered without touching this file.
 */
function earnedBadges(): Row[] {
  const src = readFileSync(new URL("../src/lib/badges/definitions.ts", import.meta.url), "utf8");
  return [...src.matchAll(/^\s{4}id:\s*"([^"]+)"/gm)].map((m) => ({ user_id: USER_ID, badge_id: m[1], earned_at: STAMP }));
}

function seed(): Record<string, Row[]> {
  return {
    user_badges: earnedBadges(),
    worlds: [
      {
        id: WORLD_ID, user_id: USER_ID, name: WORLD_NAME, description: "A tidally locked survey world.",
        header_image_url: null, header_image_focus_y: 50, icon: "globe", tags: [], theme: {},
        snapshot_at: null, archived_at: null, created_at: STAMP, updated_at: STAMP,
      },
    ],
    world_entries: [
      {
        id: DOC_ID, world_id: WORLD_ID, entry_type: "document", title: DOC_TITLE,
        content: "<p>The gravity here was 1.8 g.</p>", metadata: {}, tags: [], parent_id: null,
        sort_order: 0, trashed_at: null, word_count: 6, content_version: 1, created_by: USER_ID,
        created_at: STAMP, updated_at: STAMP, layer: null, icon: null, color: null, cover_image_url: null,
      },
    ],
    worksheets: [
      {
        id: "44444444-4444-4444-4444-444444444444", user_id: USER_ID, world_id: WORLD_ID,
        tool_type: "planetary-profile", name: "Kepler Reach b", data: { gravity: 1.8 },
        created_at: STAMP, updated_at: STAMP,
      },
    ],
  };
}

export interface RecordedWrite {
  method: string;
  table: string;
  url: string;
  body: unknown;
}

export class MockBackend {
  tables = seed();
  writes: RecordedWrite[] = [];

  /** Rows for a table filtered by the simple `col=eq.value` params PostgREST gets. */
  private select(table: string, url: URL): Row[] {
    let rows = this.tables[table] ?? [];
    for (const [key, value] of url.searchParams) {
      if (["select", "order", "limit", "offset", "or", "and", "on_conflict", "columns"].includes(key)) continue;
      const m = /^eq\.(.*)$/.exec(value);
      if (m) rows = rows.filter((r) => !(key in r) || String(r[key]) === m[1]);
      else if (value === "is.null") rows = rows.filter((r) => !(key in r) || r[key] === null);
    }
    return rows;
  }

  async handle(route: Route, request: Request): Promise<void> {
    const url = new URL(request.url());
    const method = request.method();
    const single = (request.headers()["accept"] ?? "").includes("vnd.pgrst.object");

    if (url.pathname.startsWith("/auth/v1/user")) return route.fulfill({ json: USER });
    if (url.pathname.startsWith("/auth/v1/logout")) return route.fulfill({ status: 204 });
    if (url.pathname.startsWith("/auth/v1")) return route.fulfill({ json: session() });
    if (url.pathname.startsWith("/rest/v1/rpc/")) return route.fulfill({ json: null });
    if (url.pathname.startsWith("/storage/") || url.pathname.startsWith("/functions/")) return route.fulfill({ json: {} });
    if (url.pathname.startsWith("/realtime/")) return route.abort();

    const tableMatch = /^\/rest\/v1\/([\w]+)$/.exec(url.pathname);
    if (!tableMatch) return route.fulfill({ json: {} });
    const table = tableMatch[1];

    if (method === "HEAD") return route.fulfill({ status: 200, headers: { "content-range": "0-0/0" } });

    if (method === "GET") {
      const rows = this.select(table, url);
      if (single) {
        return rows[0]
          ? route.fulfill({ json: rows[0] })
          : route.fulfill({ status: 406, json: { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: null, hint: null } });
      }
      return route.fulfill({ json: rows, headers: { "content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}` } });
    }

    let body: unknown = null;
    try { body = request.postDataJSON(); } catch { body = request.postData(); }
    this.writes.push({ method, table, url: url.toString(), body });

    if (method === "POST") {
      const input = (Array.isArray(body) ? body : [body]) as Row[];
      const created = input.map((r, i) => ({
        id: `55555555-5555-5555-5555-${String(this.writes.length * 10 + i).padStart(12, "0")}`,
        user_id: USER_ID, created_at: STAMP, updated_at: STAMP, archived_at: null, tags: [], theme: {},
        ...r,
      }));
      this.tables[table] = [...(this.tables[table] ?? []), ...created];
      return route.fulfill({ status: 201, json: single ? created[0] : created });
    }
    if (method === "PATCH") {
      const rows = this.select(table, url);
      const patch = (body ?? {}) as Row;
      const updated = rows.map((r) => Object.assign(r, patch, {
        updated_at: new Date().toISOString(),
        ...(typeof r.content_version === "number" && "content" in patch ? { content_version: r.content_version + 1 } : {}),
      }));
      return route.fulfill({ json: single ? updated[0] ?? null : updated });
    }
    if (method === "DELETE") return route.fulfill({ status: 204 });
    return route.fulfill({ json: [] });
  }

  writesTo(table: string, method?: string): RecordedWrite[] {
    return this.writes.filter((w) => w.table === table && (!method || w.method === method));
  }
}

async function install(page: Page, backend: MockBackend, signedIn: boolean): Promise<void> {
  await page.addInitScript(
    ([s, signed]) => {
      try {
        localStorage.setItem("sf-cookie-consent", "accepted");
        if (signed) localStorage.setItem("sb-fakeproj-auth-token", s as string);
      } catch {
        // storage unavailable: the signed-out flows still work
      }
    },
    [JSON.stringify(session()), signedIn] as const,
  );
  await page.route(`${SUPABASE}/**`, (route, request) => backend.handle(route, request));
  // Safety net for any first-visit notice the seed does not cover: dismiss
  // it whenever it blocks a locator action.
  await page.addLocatorHandler(page.getByRole("button", { name: "Acknowledged" }), async (button) => {
    await button.click();
  });
  // Nothing else leaves the browser either (fonts, CMS, analytics): the
  // suite must not depend on the network, and fallbacks render fine.
  await page.route(/^https?:\/\/(?!fakeproj\.supabase\.co|127\.0\.0\.1|localhost)[^/]+\//, (route) => route.abort());
}

/** Close the first-visit notices (field manual, beta notice) that sit over a page. */
export async function dismissNotices(page: Page): Promise<void> {
  for (let i = 0; i < 4; i++) {
    const dialog = page.locator('[role="dialog"], [role="alertdialog"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;
    const ack = dialog.getByRole("button", { name: /acknowledged|dismiss|got it|close/i }).first();
    if (await ack.isVisible().catch(() => false)) await ack.click();
    else await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden", timeout: 2000 }).catch(() => undefined);
  }
}

export const test = base.extend<{ backend: MockBackend; signedIn: boolean }>({
  signedIn: [true, { option: true }],
  // auto: every test gets the mocked backend, even one that never reads it.
  backend: [
    async ({ page, signedIn }, provide) => {
      const backend = new MockBackend();
      await install(page, backend, signedIn);
      await provide(backend);
    },
    { auto: true },
  ],
});

export { expect };
