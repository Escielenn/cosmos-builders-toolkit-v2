import { describe, expect, it } from "vitest";
import {
  LOOKS_KEY,
  MAX_LOOKS,
  ROOM_DEFAULTS,
  ROOM_KEY,
  ROOM_RANGE,
  VOID_FALLBACK,
  applyLook,
  clearRoom,
  effectivePaperOpacity,
  liveVoidColors,
  lookOf,
  paperTone,
  readLooks,
  readRoom,
  roomFromLegacy,
  roomStyle,
  sanitizeLooks,
  sanitizeRoom,
  saveLook,
  writeLooks,
  writeRoom,
  type KeyValueStore,
  type RoomLook,
} from "@/lib/writing/room";
import { PAPER_OPACITY_MIN, getPaper, paperOpacityFloor } from "@/lib/writing/themes";

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const brokenStore: KeyValueStore = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

describe("sanitizeRoom", () => {
  it("returns the defaults for anything that is not a room", () => {
    for (const junk of [null, undefined, 7, "void", [], [1, 2]]) {
      expect(sanitizeRoom(junk)).toEqual(ROOM_DEFAULTS);
    }
  });

  it("defaults to Scribbles-grade type: Lora 18 on a 786px sheet with 58px margins", () => {
    expect(ROOM_DEFAULTS).toMatchObject({
      paper: "void",
      font: "Lora",
      fontSize: 18,
      pageWidth: 786,
      sideMargin: 58,
      firstIndent: 0,
      scene: "none",
      showToolbar: true,
      spellcheck: true,
    });
    expect(ROOM_DEFAULTS.lineSpacing).toBeGreaterThanOrEqual(1.7);
    expect(ROOM_DEFAULTS.lineSpacing).toBeLessThanOrEqual(1.8);
  });

  it("clamps every number into its range and snaps it to its step", () => {
    const r = sanitizeRoom({
      fontSize: 400,
      lineSpacing: 0.1,
      pageWidth: 99999,
      sideMargin: -5,
      topMargin: "32",
      paragraphGap: 1.234,
      letterSpacing: 9,
      firstIndent: 1.3,
      binderWidth: 10,
      sceneVisibility: 100,
      sceneBlur: -3,
      paperOpacity: 5,
    });
    expect(r.fontSize).toBe(ROOM_RANGE.fontSize[1]);
    expect(r.lineSpacing).toBe(ROOM_RANGE.lineSpacing[0]);
    expect(r.pageWidth).toBe(ROOM_RANGE.pageWidth[1]);
    expect(r.sideMargin).toBe(ROOM_RANGE.sideMargin[0]);
    expect(r.topMargin).toBe(32);
    expect(r.paragraphGap).toBe(1.2);
    expect(r.letterSpacing).toBe(ROOM_RANGE.letterSpacing[1]);
    expect(r.firstIndent).toBe(1.25);
    expect(r.binderWidth).toBe(ROOM_RANGE.binderWidth[0]);
    expect(r.sceneVisibility).toBe(60);
    expect(r.sceneBlur).toBe(0);
    expect(r.paperOpacity).toBe(PAPER_OPACITY_MIN);
  });

  it("refuses unknown papers, fonts, scenes and non-booleans", () => {
    const r = sanitizeRoom({
      paper: "sepia",
      font: "Comic Sans MS",
      scene: "https://evil.example/x.png",
      uiSize: "huge",
      showToolbar: "no",
      spellcheck: 0,
      fontSize: Number.NaN,
    });
    expect(r).toEqual(ROOM_DEFAULTS);
  });

  it("keeps the values of a base room where the input is silent", () => {
    const base = sanitizeRoom({ paper: "parchment", fontSize: 20, binderCompact: true });
    expect(sanitizeRoom({ fontSize: 22 }, base)).toMatchObject({ paper: "parchment", fontSize: 22, binderCompact: true });
  });
});

describe("storage", () => {
  it("says null on a device that has never saved a room", () => {
    expect(readRoom(memoryStore())).toBeNull();
    expect(readRoom(null)).toBeNull();
  });

  it("round-trips a room", () => {
    const store = memoryStore();
    const room = sanitizeRoom({ paper: "parchment", fontSize: 20, scene: "nebula", uiSize: "large" });
    expect(writeRoom(store, room)).toBe(true);
    expect(readRoom(store)).toEqual(room);
    clearRoom(store);
    expect(readRoom(store)).toBeNull();
  });

  it("never throws when storage does (private mode, quota), and degrades to defaults", () => {
    expect(readRoom(brokenStore)).toBeNull();
    expect(writeRoom(brokenStore, ROOM_DEFAULTS)).toBe(false);
    expect(() => clearRoom(brokenStore)).not.toThrow();
    expect(readLooks(brokenStore)).toEqual([]);
    expect(writeLooks(brokenStore, [])).toBe(false);
  });

  it("survives a corrupted value", () => {
    const store = memoryStore();
    store.data.set(ROOM_KEY, "{not json");
    expect(readRoom(store)).toBeNull();
    store.data.set(ROOM_KEY, JSON.stringify(["a"]));
    expect(readRoom(store)).toBeNull();
    store.data.set(ROOM_KEY, JSON.stringify({ paper: "black", fontSize: "big" }));
    expect(readRoom(store)).toMatchObject({ paper: "black", fontSize: ROOM_DEFAULTS.fontSize });
    store.data.set(LOOKS_KEY, "nope");
    expect(readLooks(store)).toEqual([]);
  });
});

describe("the room a writer sees before changing anything", () => {
  it("is the defaults for a new writer", () => {
    expect(roomFromLegacy(null)).toEqual(ROOM_DEFAULTS);
    expect(roomFromLegacy({})).toEqual(ROOM_DEFAULTS);
  });

  it("keeps the page theme, font, spacing and width chosen before 1.7", () => {
    const r = roomFromLegacy({ themeId: "captains-log", writingFont: "Georgia", lineSpacing: "2", writingMeasure: "wide" });
    expect(r).toMatchObject({ paper: "parchment", font: "Georgia", lineSpacing: 2.2, pageWidth: 960 });
    expect(roomFromLegacy({ themeId: "deep-space", lineSpacing: "1.5", writingMeasure: "default" })).toEqual(ROOM_DEFAULTS);
  });
});

describe("saved looks", () => {
  const room = sanitizeRoom({ paper: "parchment", fontSize: 20, binderWidth: 320, uiSize: "large" });

  it("saves a look without the device's chrome comforts", () => {
    const looks = saveLook([], "  Morning pages ", room)!;
    expect(looks).toHaveLength(1);
    expect(looks[0].name).toBe("Morning pages");
    expect(looks[0].settings).toEqual(lookOf(room));
    expect(looks[0].settings).not.toHaveProperty("binderWidth");
    expect(looks[0].settings).not.toHaveProperty("uiSize");
  });

  it("replaces a look of the same name instead of stacking copies", () => {
    const one = saveLook([], "Night", room)!;
    const two = saveLook(one, "night", sanitizeRoom({ paper: "black" }))!;
    expect(two).toHaveLength(1);
    expect(two[0].id).toBe(one[0].id);
    expect(two[0].settings.paper).toBe("black");
  });

  it("holds twelve and refuses a thirteenth without dropping any", () => {
    let looks: RoomLook[] = [];
    for (let i = 0; i < MAX_LOOKS; i++) looks = saveLook(looks, `Look ${i}`, room)!;
    expect(looks).toHaveLength(MAX_LOOKS);
    expect(saveLook(looks, "One more", room)).toBeNull();
    expect(saveLook(looks, "Look 3", room)).toHaveLength(MAX_LOOKS);
    expect(saveLook(looks, "   ", room)).toBeNull();
  });

  it("recalls a look over the room and leaves the chrome comforts alone", () => {
    const [look] = saveLook([], "Parchment", room)!;
    const here = sanitizeRoom({ paper: "void", binderWidth: 240, binderCompact: true, uiSize: "comfortable" });
    const after = applyLook(here, look);
    expect(after).toMatchObject({ paper: "parchment", fontSize: 20, binderWidth: 240, binderCompact: true, uiSize: "comfortable" });
  });

  it("round-trips through storage and drops malformed entries", () => {
    const store = memoryStore();
    const looks = saveLook([], "Parchment", room)!;
    expect(writeLooks(store, looks)).toBe(true);
    expect(readLooks(store)).toEqual(looks);
    expect(sanitizeLooks([{ id: "a", name: "" }, { name: "no id" }, null, { id: "b", name: "Ok", settings: { paper: "x" } }])).toEqual([
      { id: "b", name: "Ok", settings: lookOf(ROOM_DEFAULTS) },
    ]);
    const many = Array.from({ length: 30 }, (_, i) => ({ id: `l${i}`, name: `L${i}`, settings: {} }));
    expect(sanitizeLooks(many)).toHaveLength(MAX_LOOKS);
  });
});

describe("roomStyle", () => {
  it("draws Void from the instrument's tokens and names no token of its own", () => {
    const style = roomStyle(ROOM_DEFAULTS);
    expect(style["--room-paper"]).toBe("var(--sf-void)");
    expect(style["--room-ink"]).toBe("var(--t2)");
    expect(style["--room-link"]).toBe("var(--sf-stellar-text)");
    expect(style["--room-accent"]).toBe("var(--sf-primary)");
    expect(style["--room-graphic-ink"]).toBe("0%");
    for (const key of Object.keys(style)) {
      expect(key.startsWith("--room-") || key.startsWith("--sf-writing-")).toBe(true);
    }
  });

  it("draws a fixed paper from its table and folds its ink into the theme's hues", () => {
    const style = roomStyle(sanitizeRoom({ paper: "parchment" }));
    const c = getPaper("parchment").colors!;
    expect(style["--room-paper"]).toBe(c.paper);
    expect(style["--room-ink"]).toBe(c.ink);
    expect(style["--room-link"]).toBe(`color-mix(in srgb, var(--sf-stellar), ${c.inkStrong} 68%)`);
    expect(style["--room-accent"]).toBe(`color-mix(in srgb, var(--sf-primary), ${c.inkStrong} 50%)`);
    expect(style["--room-graphic-ink"]).toBe("50%");
  });

  it("makes the prose column the sheet minus its side margins", () => {
    const style = roomStyle(sanitizeRoom({ pageWidth: 786, sideMargin: 58, fontSize: 19, lineSpacing: 1.8, firstIndent: 1.5 }));
    expect(style["--sf-writing-measure"]).toBe("670px");
    expect(style["--room-page-width"]).toBe("786px");
    expect(style["--sf-writing-size"]).toBe("19px");
    expect(style["--sf-writing-leading"]).toBe("1.8");
    expect(style["--room-indent"]).toBe("1.5em");
    expect(style["--sf-writing-font"]).toContain("Lora");
  });

  it("scales only the chrome for a large interface", () => {
    expect(roomStyle(ROOM_DEFAULTS)["--room-ui-zoom"]).toBe("1");
    expect(roomStyle(sanitizeRoom({ uiSize: "large" }))["--room-ui-zoom"]).toBe("1.125");
  });
});

describe("atmosphere in the room", () => {
  it("draws no photograph and a solid sheet by default", () => {
    const style = roomStyle(ROOM_DEFAULTS);
    expect(style["--room-scene-visibility"]).toBe("0");
    expect(style["--room-paper-opacity"]).toBe("100%");
    expect(effectivePaperOpacity(ROOM_DEFAULTS)).toBe(100);
  });

  it("never draws the sheet thinner than its contrast floor", () => {
    for (const paper of ["void", "charcoal", "black", "parchment", "cream", "grey"] as const) {
      const room = sanitizeRoom({ paper, scene: "nebula", sceneVisibility: 60, paperOpacity: 60 });
      const p = getPaper(paper);
      const colors = p.colors ?? VOID_FALLBACK;
      const floor = paperOpacityFloor(colors, paperTone(p, colors), 60);
      expect(effectivePaperOpacity(room)).toBe(Math.max(60, floor));
      expect(roomStyle(room)["--room-paper-opacity"]).toBe(`${Math.max(60, floor)}%`);
    }
  });

  it("honours a thicker sheet when the writer asks for one", () => {
    const room = sanitizeRoom({ paper: "parchment", scene: "lake", sceneVisibility: 10, paperOpacity: 97 });
    expect(effectivePaperOpacity(room)).toBe(97);
  });

  it("reads Void's tone off the live theme: a light theme is a light sheet", () => {
    const voidPaper = getPaper("void");
    expect(paperTone(voidPaper, VOID_FALLBACK)).toBe("dark");
    expect(paperTone(voidPaper, { ...VOID_FALLBACK, paper: "#F4F1EA" })).toBe("light");
    expect(paperTone(getPaper("parchment"), VOID_FALLBACK)).toBe("light");
  });

  it("reads the live tokens however the browser reports them", () => {
    const tokens: Record<string, string> = {
      "--sf-void": " #0A0E17",
      "--t1": "rgb(250, 250, 250)",
      "--t2": "#C9CDD3",
      "--t3": "#A7AAB0",
      "--t4": "#9799A0",
    };
    const live = liveVoidColors((n) => tokens[n] ?? "");
    expect(live).toMatchObject({ paper: "#0A0E17", inkStrong: "#FAFAFA", ink: "#C9CDD3" });
    expect(liveVoidColors(() => "")).toBeNull();
  });
});
