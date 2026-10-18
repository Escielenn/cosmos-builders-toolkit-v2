import { describe, expect, it } from "vitest";
import {
  castCodec,
  clearUnfiled,
  hasUnfiledDraft,
  LOCAL_MODE_NOTICE,
  mergeCodec,
  readDraft,
  saveRoute,
  shouldLoadDraft,
  shouldMigrateDraft,
  stateKey,
  unfiledKey,
  withWorksheetParams,
  writeDraft,
} from "@/lib/tool-worksheet";

/** A Storage stand-in over a plain map. */
function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

const throwing = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("quota");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("codecs", () => {
  it("castCodec stores the form as-is", () => {
    const c = castCodec({ a: 1, b: "x" });
    const saved = { a: 2, b: "y" };
    expect(c.serialize(c.hydrate(saved, c.defaults))).toEqual(saved);
  });

  it("mergeCodec fills top-level keys an older row lacks", () => {
    const c = mergeCodec({ a: 1, b: "x", c: [] as string[] });
    expect(c.hydrate({ a: 5 }, c.defaults)).toEqual({ a: 5, b: "x", c: [] });
    expect(c.hydrate(null, c.defaults)).toEqual(c.defaults);
  });
});

describe("browser draft", () => {
  it("reads a parsed draft, and none from missing, corrupt or blocked storage", () => {
    expect(readDraft("k", memoryStorage({ k: '{"a":1}' }))).toEqual({ a: 1 });
    expect(readDraft("k", memoryStorage())).toBeNull();
    expect(readDraft("k", memoryStorage({ k: "{not json" }))).toBeNull();
    expect(readDraft("k", throwing)).toBeNull();
    expect(readDraft("k", null)).toBeNull();
  });

  it("writes in standalone mode and marks a signed-out draft unfiled", () => {
    const s = memoryStorage();
    expect(writeDraft("k", { a: 1 }, { worldId: null, signedIn: false }, s)).toBe("written");
    expect(s.map.get("k")).toBe('{"a":1}');
    expect(hasUnfiledDraft("k", s)).toBe(true);
  });

  it("writes signed in without a world, but does not mark it unfiled", () => {
    const s = memoryStorage();
    expect(writeDraft("k", { a: 1 }, { worldId: null, signedIn: true }, s)).toBe("written");
    expect(hasUnfiledDraft("k", s)).toBe(false);
  });

  it("skips the browser when a cloud save is possible", () => {
    const s = memoryStorage();
    expect(writeDraft("k", { a: 1 }, { worldId: "w", signedIn: true }, s)).toBe("skipped");
    expect(s.map.size).toBe(0);
  });

  it("reports a failed write instead of throwing", () => {
    expect(writeDraft("k", { a: 1 }, { worldId: null, signedIn: false }, throwing)).toBe("failed");
    expect(writeDraft("k", { a: 1 }, { worldId: null, signedIn: false }, null)).toBe("failed");
    expect(writeDraft("k", { a: 1 }, { worldId: "w", signedIn: true }, null)).toBe("skipped");
  });

  it("clearing the marker keeps the draft itself", () => {
    const s = memoryStorage({ k: '{"a":1}', [unfiledKey("k")]: "1" });
    clearUnfiled("k", s);
    expect(hasUnfiledDraft("k", s)).toBe(false);
    expect(s.map.get("k")).toBe('{"a":1}');
    expect(() => clearUnfiled("k", throwing)).not.toThrow();
    expect(hasUnfiledDraft("k", throwing)).toBe(false);
  });

  it("speaks Ship's Voice in local mode", () => {
    expect(LOCAL_MODE_NOTICE).toBe("LOCAL MODE. SIGN IN TO FILE THIS WORKSHEET.");
  });
});

describe("routing rules", () => {
  it("opens the draft only in standalone mode with no sheet requested", () => {
    const base = { worldId: null, worksheetId: null, signedIn: false, authLoading: false };
    expect(shouldLoadDraft(base)).toBe(true);
    expect(shouldLoadDraft({ ...base, signedIn: true })).toBe(true);
    expect(shouldLoadDraft({ ...base, worldId: "w" })).toBe(true);
    expect(shouldLoadDraft({ ...base, worldId: "w", signedIn: true })).toBe(false);
    expect(shouldLoadDraft({ ...base, worksheetId: "s" })).toBe(false);
    expect(shouldLoadDraft({ ...base, authLoading: true })).toBe(false);
  });

  it("files an unfiled draft once signed in with a world and no sheet open", () => {
    const ctx = { worldId: "w", worksheetId: null, signedIn: true };
    expect(shouldMigrateDraft(ctx, true)).toBe(true);
    expect(shouldMigrateDraft(ctx, false)).toBe(false);
    expect(shouldMigrateDraft({ ...ctx, signedIn: false }, true)).toBe(false);
    expect(shouldMigrateDraft({ ...ctx, worldId: null }, true)).toBe(false);
    expect(shouldMigrateDraft({ ...ctx, worksheetId: "s" }, true)).toBe(false);
  });

  it("creates on first save, updates after, and stays local without a world or user", () => {
    expect(saveRoute({ worldId: "w", signedIn: true, worksheetId: null })).toBe("create");
    expect(saveRoute({ worldId: "w", signedIn: true, worksheetId: "s" })).toBe("update");
    expect(saveRoute({ worldId: null, signedIn: true, worksheetId: null })).toBe("local");
    expect(saveRoute({ worldId: "w", signedIn: false, worksheetId: "s" })).toBe("local");
  });

  it("stateKey is stable and never throws", () => {
    expect(stateKey({ a: 1 })).toBe(stateKey({ a: 1 }));
    expect(stateKey({ a: 1 })).not.toBe(stateKey({ a: 2 }));
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(stateKey(cyclic)).toBe("");
  });

  it("sets world and sheet on the URL and keeps every other param", () => {
    const next = withWorksheetParams(new URLSearchParams("entityId=e&tab=2"), "w", "s");
    expect(next.get("entityId")).toBe("e");
    expect(next.get("tab")).toBe("2");
    expect(next.get("worldId")).toBe("w");
    expect(next.get("worksheetId")).toBe("s");
    expect(withWorksheetParams(new URLSearchParams(), null, "s").has("worldId")).toBe(false);
  });
});
