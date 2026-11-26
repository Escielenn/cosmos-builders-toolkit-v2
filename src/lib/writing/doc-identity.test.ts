import { describe, expect, it } from "vitest";
import { EMPTY_DOC_META, markerOf, readDocMeta, writeDocMeta } from "@/lib/document-meta";
import {
  ACCENT_BG,
  countCharacters,
  docAccent,
  folderPath,
  isDocColor,
  readMinutes,
  readTimeLabel,
  statusAccent,
  statusName,
} from "@/lib/writing/doc-identity";
import { hasAllTags, parseTagQuery, tagToken } from "@/lib/writing/tag-query";
import { matchingDocIds, searchBinder } from "@/lib/binder-search";
import {
  MARKER_GROUPS,
  MAX_RECENT_MARKERS,
  pushRecentMarker,
  sanitizeRecentMarkers,
  searchMarkers,
} from "@/lib/writing/emoji";
import {
  SCENES,
  SCENE_WORLD,
  findScene,
  photoLink,
  photographerLink,
  resolveScene,
  safeCoverUrl,
  scenePhotoUrl,
} from "@/lib/writing/atmosphere";
import type { WritingLabel } from "@/lib/writing-labels";

describe("document marker and colour in metadata", () => {
  it("reads nothing where nothing was stored, so old documents are unchanged", () => {
    const meta = readDocMeta({ synopsis: "s" });
    expect(meta).not.toHaveProperty("marker");
    expect(meta).not.toHaveProperty("color");
    expect(readDocMeta({})).toEqual({ ...EMPTY_DOC_META, keywords: [] });
  });

  it("keeps one visible character, joined emoji included", () => {
    expect(markerOf("🌒")).toBe("🌒");
    expect(markerOf("  🌒🧭  ")).toBe("🌒");
    expect(markerOf("🧑‍🚀")).toBe("🧑‍🚀");
    expect(markerOf("🛠️")).toBe("🛠️");
    expect(markerOf("A")).toBe("A");
    expect(markerOf("")).toBe("");
    expect(markerOf(42)).toBe("");
    expect(markerOf(null)).toBe("");
  });

  it("writes through the existing metadata patch and preserves every other key", () => {
    const stored = { synopsis: "Ix lands.", status: "draft", somethingElse: { kept: true } };
    const next = writeDocMeta(stored, { marker: "🌒", color: "amber" });
    expect(next).toMatchObject({ synopsis: "Ix lands.", status: "draft", somethingElse: { kept: true }, marker: "🌒", color: "amber" });
    expect(readDocMeta(next)).toMatchObject({ marker: "🌒", color: "amber", synopsis: "Ix lands.", status: "draft" });
  });

  it("removes the key when cleared, and refuses a colour that is not a name", () => {
    const next = writeDocMeta({ marker: "🌒", color: "amber" }, { marker: "", color: "" });
    expect(next).not.toHaveProperty("marker");
    expect(next).not.toHaveProperty("color");
    expect(writeDocMeta({}, { color: "url(javascript:1)" })).not.toHaveProperty("color");
    expect(readDocMeta({ color: "#FF0000" })).not.toHaveProperty("color");
  });
});

describe("a document's accent", () => {
  const labels: WritingLabel[] = [{ id: "l1", name: "Flashback", hue: "violet" }];

  it("is the writer's colour, else the label's, else the status's", () => {
    expect(docAccent({ color: "amber", labelId: "l1", status: "final" }, labels)).toBe("amber");
    expect(docAccent({ color: "", labelId: "l1", status: "final" }, labels)).toBe("violet");
    expect(docAccent({ labelId: "", status: "final" }, labels)).toBe("primary");
    expect(docAccent({ labelId: "", status: "draft" }, labels)).toBe("amber");
    expect(docAccent({ labelId: "gone", status: "" }, labels)).toBe("none");
    expect(docAccent({ color: "chartreuse", labelId: "", status: "revised" }, labels)).toBe("stellar");
  });

  it("has a class for every accent and names every status", () => {
    for (const a of ["amber", "azure", "emerald", "magenta", "stellar", "violet", "teal", "crimson", "primary", "none"] as const) {
      expect(ACCENT_BG[a]).toMatch(/^bg-sf-/);
    }
    expect(isDocColor("teal")).toBe(true);
    expect(isDocColor("primary")).toBe(false);
    expect(statusAccent("")).toBe("none");
    expect(statusName("revised")).toBe("Revised");
    expect(statusName("")).toBe("No status");
  });
});

describe("status bar readouts", () => {
  it("counts read time at 250 words a minute, never under one", () => {
    expect(readMinutes(0)).toBe(1);
    expect(readMinutes(250)).toBe(1);
    expect(readMinutes(251)).toBe(2);
    expect(readTimeLabel(207)).toBe("1 MIN READ");
    expect(readTimeLabel(80_000)).toBe("5 H 20 MIN READ");
    expect(readTimeLabel(15_000)).toBe("1 H READ");
  });

  it("counts characters as written, without markup or paragraph breaks", () => {
    expect(countCharacters("<p>Hello, Ix.</p>")).toBe(10);
    expect(countCharacters("<p>one</p><p>two</p>")).toBe(6);
    expect(countCharacters("<p>a &amp; b&nbsp;c</p>")).toBe(7);
    expect(countCharacters("<p>🌒 moon</p>")).toBe(6);
    expect(countCharacters("")).toBe(0);
    expect(countCharacters(null)).toBe(0);
  });
});

describe("the page's eyebrow path", () => {
  const entries = [
    { id: "p1", title: "Part one", parent_id: null, entry_type: "folder" },
    { id: "c1", title: "Dayside", parent_id: "p1", entry_type: "folder" },
    { id: "d1", title: "Scene", parent_id: "c1", entry_type: "document" },
    { id: "d2", title: "Loose", parent_id: null, entry_type: "document" },
    { id: "loop", title: "Loop", parent_id: "loop", entry_type: "folder" },
    { id: "d3", title: "In a loop", parent_id: "loop", entry_type: "document" },
  ];

  it("lists the folders above a document, outermost first", () => {
    expect(folderPath("d1", entries)).toEqual(["Part one", "Dayside"]);
    expect(folderPath("d2", entries)).toEqual([]);
    expect(folderPath(undefined, entries)).toEqual([]);
    expect(folderPath("missing", entries)).toEqual([]);
  });

  it("does not hang on a folder that is its own parent", () => {
    expect(folderPath("d3", entries)).toEqual(["Loop"]);
  });
});

describe("#tag in binder search", () => {
  const docs = [
    { id: "a", title: "Arrival", content: "<p>The gravity was heavy.</p>", metadata: { keywords: ["arrival", "gravity"] } },
    { id: "b", title: "Seam", content: "<p>Gravity again.</p>", metadata: { keywords: ["First Contact"] } },
    { id: "c", title: "Notes on #arrival", content: "<p>nothing</p>", metadata: {} },
  ];
  const opts = { regex: false, caseSensitive: false };

  it("parses tags out of a query and leaves the rest to search", () => {
    expect(parseTagQuery("#arrival gravity")).toEqual({ tags: ["arrival"], text: "gravity" });
    expect(parseTagQuery("the #Arrival and #gravity scenes")).toEqual({ tags: ["arrival", "gravity"], text: "the and scenes" });
    expect(parseTagQuery("no tags here")).toEqual({ tags: [], text: "no tags here" });
    expect(parseTagQuery("issue#42")).toEqual({ tags: [], text: "issue#42" });
  });

  it("matches tags whatever their case or spacing", () => {
    expect(hasAllTags(["First Contact"], ["first-contact"])).toBe(true);
    expect(hasAllTags(["arrival", "gravity"], ["gravity", "arrival"])).toBe(true);
    expect(hasAllTags(["arrival"], ["arrival", "gravity"])).toBe(false);
    expect(hasAllTags([], [])).toBe(true);
    expect(tagToken("First Contact")).toBe("#first-contact");
  });

  it("a tag alone lists every document carrying it", () => {
    expect(matchingDocIds(docs, "#arrival", opts)).toEqual(["a"]);
    expect(matchingDocIds(docs, "#first-contact", opts)).toEqual(["b"]);
    const out = searchBinder(docs, "#arrival", opts);
    expect(out.totalHits).toBe(1);
    expect(out.results[0].hits[0]).toMatchObject({ field: "keywords", match: "#arrival" });
  });

  it("a tag with words searches those words inside the tagged documents only", () => {
    expect(matchingDocIds(docs, "gravity", opts)).toEqual(["a", "b"]);
    expect(matchingDocIds(docs, "#arrival gravity", opts)).toEqual(["a"]);
    expect(matchingDocIds(docs, "#arrival seam", opts)).toEqual([]);
  });

  it("leaves a regular expression alone", () => {
    expect(matchingDocIds(docs, "#arrival", { regex: true, caseSensitive: false })).toEqual(["c"]);
  });
});

describe("the marker shelf", () => {
  it("is small, grouped and searchable by plain words", () => {
    const all = MARKER_GROUPS.flatMap((g) => g.items);
    expect(all.length).toBeGreaterThan(60);
    expect(all.length).toBeLessThan(160);
    expect(searchMarkers("moon")).toContain("🌒");
    expect(searchMarkers("FIGHT")).toContain("⚔️");
    expect(searchMarkers("full moon")).toEqual(["🌕"]);
    expect(searchMarkers("")).toEqual([]);
    expect(searchMarkers("zzzz")).toEqual([]);
    for (const [emoji] of all) expect(markerOf(emoji)).toBe(emoji);
  });

  it("remembers recent markers: newest first, no repeats, capped", () => {
    expect(pushRecentMarker(["🌒", "⚔️"], "⚔️")).toEqual(["⚔️", "🌒"]);
    expect(pushRecentMarker(["🌒"], "  ")).toEqual(["🌒"]);
    let list: string[] = [];
    for (let i = 0; i < 30; i++) list = pushRecentMarker(list, String.fromCodePoint(0x1f600 + i));
    expect(list).toHaveLength(MAX_RECENT_MARKERS);
    expect(sanitizeRecentMarkers(["🌒", "🌒", 4, "", "x".repeat(99)])).toEqual(["🌒"]);
    expect(sanitizeRecentMarkers("nope")).toEqual([]);
  });
});

describe("atmosphere scenes", () => {
  it("keeps Scribbles's three scenes and adds credited ones", () => {
    expect(SCENES.slice(0, 3).map((s) => s.id)).toEqual(["lake", "forest", "shore"]);
    expect(SCENES.length).toBeGreaterThanOrEqual(6);
    for (const s of SCENES) {
      expect(s.photo).toMatch(/^photo-[a-z0-9-]+$/);
      expect(scenePhotoUrl(s)).toMatch(/^https:\/\/images\.unsplash\.com\/photo-[a-z0-9-]+\?auto=format&fit=crop&w=1920&q=80$/);
    }
    for (const s of SCENES.slice(3)) expect(s.credit).not.toBeNull();
    const nebula = findScene("nebula")!;
    expect(photographerLink(nebula.credit!)).toContain("unsplash.com/@nasa?utm_source=stellarforge");
    expect(photoLink(nebula.credit!)).toContain("unsplash.com/photos/");
  });

  it("resolves none, a gallery scene and the world's own cover", () => {
    expect(resolveScene("none", null)).toMatchObject({ url: "", source: "none" });
    expect(resolveScene("made-up", null)).toMatchObject({ url: "", source: "none" });
    expect(resolveScene("lake", null)).toMatchObject({ source: "gallery", credit: null });
    expect(resolveScene("nebula", null).credit?.photographer).toBe("NASA");
    expect(resolveScene(SCENE_WORLD, "https://x.supabase.co/storage/v1/object/public/c.jpg", "Kepler Reach")).toMatchObject({
      source: "world",
      name: "Kepler Reach cover",
    });
    expect(resolveScene(SCENE_WORLD, null)).toMatchObject({ url: "", source: "none" });
  });

  it("draws only https, data:image and blob covers", () => {
    expect(safeCoverUrl("https://images.unsplash.com/photo-1?w=1")).toBe("https://images.unsplash.com/photo-1?w=1");
    expect(safeCoverUrl("data:image/png;base64,AAAA")).toBe("data:image/png;base64,AAAA");
    expect(safeCoverUrl("blob:https://stellarforge.tools/abc")).toBe("blob:https://stellarforge.tools/abc");
    expect(safeCoverUrl("http://insecure.example/a.jpg")).toBe("");
    expect(safeCoverUrl("javascript:alert(1)")).toBe("");
    expect(safeCoverUrl("data:text/html;base64,AAAA")).toBe("");
    expect(safeCoverUrl("https://user:pw@example.com/a.jpg")).toBe("");
    expect(safeCoverUrl(null)).toBe("");
    expect(safeCoverUrl("   ")).toBe("");
  });
});
