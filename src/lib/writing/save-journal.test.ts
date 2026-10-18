import { describe, expect, it } from "vitest";
import {
  decideRecovery,
  deriveSaveState,
  dropJournal,
  journalKey,
  readJournal,
  retryDelay,
  settleJournal,
  writeJournal,
  type StorageLike,
} from "./save-journal";

function memory(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function throwing(): StorageLike {
  return {
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
}

describe("journal read/write", () => {
  it("round-trips an entry keyed by document", () => {
    const s = memory();
    expect(writeJournal(s, "d1", "<p>words</p>", "2026-10-18T10:00:00Z", 1000)).toBe(true);
    expect(s.map.has(journalKey("d1"))).toBe(true);
    expect(readJournal(s, "d1")).toEqual({
      v: 1,
      docId: "d1",
      html: "<p>words</p>",
      base: "2026-10-18T10:00:00Z",
      at: 1000,
    });
    expect(readJournal(s, "d2")).toBeNull();
  });

  it("treats missing or throwing storage as no journal", () => {
    expect(writeJournal(null, "d1", "x", null)).toBe(false);
    expect(readJournal(null, "d1")).toBeNull();
    expect(writeJournal(throwing(), "d1", "x", null)).toBe(false);
    expect(readJournal(throwing(), "d1")).toBeNull();
    expect(() => settleJournal(throwing(), "d1", "x", null)).not.toThrow();
    expect(() => dropJournal(throwing(), "d1")).not.toThrow();
  });

  it("ignores malformed or mismatched entries", () => {
    const s = memory();
    s.setItem(journalKey("d1"), "not json");
    expect(readJournal(s, "d1")).toBeNull();
    s.setItem(journalKey("d1"), JSON.stringify({ docId: "other", html: "x", at: 1 }));
    expect(readJournal(s, "d1")).toBeNull();
    s.setItem(journalKey("d1"), JSON.stringify({ docId: "d1", html: 3, at: 1 }));
    expect(readJournal(s, "d1")).toBeNull();
  });
});

describe("settleJournal", () => {
  it("clears the entry when exactly that text was saved", () => {
    const s = memory();
    writeJournal(s, "d1", "<p>a</p>", "b0", 1);
    settleJournal(s, "d1", "<p>a</p>", "b1");
    expect(readJournal(s, "d1")).toBeNull();
  });

  it("keeps newer words typed during the save, rebased on the saved copy", () => {
    const s = memory();
    writeJournal(s, "d1", "<p>a b</p>", "b0", 5);
    settleJournal(s, "d1", "<p>a</p>", "b1");
    expect(readJournal(s, "d1")).toMatchObject({ html: "<p>a b</p>", base: "b1", at: 5 });
  });

  it("does nothing without an entry", () => {
    const s = memory();
    settleJournal(s, "d1", "x", "b1");
    expect(s.map.size).toBe(0);
  });
});

describe("decideRecovery", () => {
  const at = Date.parse("2026-10-18T10:00:00Z");

  it("none without an entry", () => {
    expect(decideRecovery(null, { content: "x", updated_at: null })).toBe("none");
  });

  it("settled when the server already holds the text", () => {
    const e = { v: 1 as const, docId: "d", html: "<p>a</p>", base: "b0", at };
    expect(decideRecovery(e, { content: "<p>a</p>", updated_at: "b9" })).toBe("settled");
    const empty = { ...e, html: "" };
    expect(decideRecovery(empty, { content: null, updated_at: "b9" })).toBe("settled");
  });

  it("recovers when the server copy is the one the edits were made on", () => {
    const e = { v: 1 as const, docId: "d", html: "<p>new</p>", base: "2026-10-18T11:00:00Z", at };
    // Even with a later server timestamp (clock skew): the base matches.
    expect(decideRecovery(e, { content: "<p>old</p>", updated_at: "2026-10-18T11:00:00Z" })).toBe("recover");
  });

  it("recovers when the journal was written after the server copy", () => {
    const e = { v: 1 as const, docId: "d", html: "<p>new</p>", base: "x", at };
    expect(decideRecovery(e, { content: "<p>old</p>", updated_at: "2026-10-18T09:59:00Z" })).toBe("recover");
    expect(decideRecovery(e, { content: "<p>old</p>", updated_at: null })).toBe("recover");
  });

  it("only offers words older than a server copy that moved on", () => {
    const e = { v: 1 as const, docId: "d", html: "<p>mine</p>", base: "2026-10-18T09:00:00Z", at };
    expect(decideRecovery(e, { content: "<p>theirs</p>", updated_at: "2026-10-18T10:05:00Z" })).toBe("older");
  });
});

describe("retryDelay", () => {
  it("backs off and caps at 30s", () => {
    expect([1, 2, 3, 4, 5, 6, 50].map(retryDelay)).toEqual([2000, 4000, 8000, 16000, 30000, 30000, 30000]);
    expect(retryDelay(0)).toBe(2000);
  });
});

describe("deriveSaveState", () => {
  const base = { online: true, dirty: false, saving: false, failed: false, savedOnce: false };
  it("ready, then saved", () => {
    expect(deriveSaveState(base)).toBe("ready");
    expect(deriveSaveState({ ...base, savedOnce: true })).toBe("saved");
  });
  it("saving while words are unsent or in flight", () => {
    expect(deriveSaveState({ ...base, dirty: true })).toBe("saving");
    expect(deriveSaveState({ ...base, saving: true, savedOnce: true })).toBe("saving");
  });
  it("never says saved after a failure with words outstanding", () => {
    expect(deriveSaveState({ ...base, dirty: true, failed: true, savedOnce: true })).toBe("retrying");
    expect(deriveSaveState({ ...base, dirty: true, failed: true, saving: true })).toBe("retrying");
  });
  it("offline wins while anything is unsaved, and shows when idle offline", () => {
    expect(deriveSaveState({ ...base, online: false, dirty: true, failed: true })).toBe("offline");
    expect(deriveSaveState({ ...base, online: false })).toBe("offline");
  });
});
