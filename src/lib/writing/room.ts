// ---------------------------------------------------------------------------
// The writing room: how the Manuscript looks on THIS device.
//
// Paper, type, page geometry, atmosphere and a few chrome comforts. Stored in
// localStorage (per device, like Scribbles), never on the document: nothing
// here changes a word of anyone's prose or how it exports. Applied as CSS
// custom properties on the Manuscript root by roomStyle(), so no other page
// of the app can be affected.
//
// Pure: no React. Every read is sanitised and every storage call guarded, so
// a private window or a hand-edited value degrades to the defaults.
// ---------------------------------------------------------------------------

import {
  DEFAULT_PAPER,
  PAPER_OPACITY_MIN,
  getPaper,
  isPaperId,
  paperForLegacyTheme,
  paperOpacityFloor,
  parseColor,
  parseHex,
  luminance,
  toHex,
  type Paper,
  type PaperColors,
  type PaperId,
} from "@/lib/writing/themes";
import { VOID_PAPER_FALLBACK } from "@/lib/palettes/writing-papers";

export const ROOM_KEY = "sf-writing-room:v1";
export const LOOKS_KEY = "sf-writing-room-looks:v1";
export const MAX_LOOKS = 12;
export const MAX_LOOK_NAME = 40;

export const ROOM_FONTS = [
  "Lora",
  "Georgia",
  "Merriweather",
  "Times New Roman",
  "DM Sans",
  "Courier New",
] as const;
export type RoomFont = (typeof ROOM_FONTS)[number];

/** Every stack ends in a family the browser certainly has. */
export const ROOM_FONT_STACK: Record<RoomFont, string> = {
  Lora: "'Lora', Georgia, serif",
  Georgia: "Georgia, 'Times New Roman', serif",
  Merriweather: "'Merriweather', Georgia, serif",
  "Times New Roman": "'Times New Roman', Times, serif",
  "DM Sans": "'DM Sans', system-ui, sans-serif",
  "Courier New": "'Courier New', Courier, monospace",
};

export type RoomUiSize = "comfortable" | "large";

export interface RoomSettings {
  paper: PaperId;
  font: RoomFont;
  /** Prose size, px. */
  fontSize: number;
  /** Unitless line height. */
  lineSpacing: number;
  /** The sheet, px, side margins included. */
  pageWidth: number;
  sideMargin: number;
  topMargin: number;
  /** Space between paragraphs, em. */
  paragraphGap: number;
  /** px. */
  letterSpacing: number;
  /** First-line indent, em. */
  firstIndent: number;
  showToolbar: boolean;
  spellcheck: boolean;
  uiSize: RoomUiSize;
  binderWidth: number;
  binderCompact: boolean;
  /** "none", "world" (the world's cover) or a curated scene id. */
  scene: string;
  /** How much of the photograph shows, percent. */
  sceneVisibility: number;
  sceneBlur: number;
  /** How solid the sheet is over the photograph, percent. */
  paperOpacity: number;
}

export const ROOM_DEFAULTS: RoomSettings = {
  paper: DEFAULT_PAPER,
  font: "Lora",
  fontSize: 18,
  lineSpacing: 1.75,
  pageWidth: 786,
  sideMargin: 58,
  topMargin: 48,
  paragraphGap: 1,
  letterSpacing: 0,
  firstIndent: 0,
  showToolbar: true,
  spellcheck: true,
  uiSize: "comfortable",
  binderWidth: 264,
  binderCompact: false,
  scene: "none",
  sceneVisibility: 22,
  sceneBlur: 2,
  paperOpacity: 92,
};

/** Slider ranges: [min, max, step]. The settings sheet and the clamps share them. */
export const ROOM_RANGE = {
  fontSize: [14, 28, 1],
  lineSpacing: [1.2, 2.4, 0.05],
  pageWidth: [520, 1200, 2],
  sideMargin: [16, 100, 2],
  topMargin: [20, 120, 4],
  paragraphGap: [0, 2, 0.1],
  letterSpacing: [-0.5, 2, 0.1],
  firstIndent: [0, 3, 0.25],
  binderWidth: [232, 400, 4],
  sceneVisibility: [0, 60, 1],
  sceneBlur: [0, 12, 1],
  paperOpacity: [PAPER_OPACITY_MIN, 100, 1],
} as const satisfies Record<string, readonly [number, number, number]>;

export type RoomRangeKey = keyof typeof ROOM_RANGE;

function clamp(v: unknown, key: RoomRangeKey, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  const [min, max, step] = ROOM_RANGE[key];
  const snapped = Math.round(n / step) * step;
  // Round away float dust (1.2000000000000002) so stored values stay tidy.
  return Number(Math.min(max, Math.max(min, snapped)).toFixed(2));
}

const SCENE_RE = /^[a-z0-9-]{1,40}$/;

/** Any value in, a complete and in-range RoomSettings out. Never throws. */
export function sanitizeRoom(raw: unknown, base: RoomSettings = ROOM_DEFAULTS): RoomSettings {
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const num = (key: RoomRangeKey) => clamp(r[key], key, base[key]);
  const bool = (key: "showToolbar" | "spellcheck" | "binderCompact") =>
    typeof r[key] === "boolean" ? (r[key] as boolean) : base[key];
  return {
    paper: isPaperId(r.paper) ? r.paper : base.paper,
    font: (ROOM_FONTS as readonly string[]).includes(r.font as string) ? (r.font as RoomFont) : base.font,
    fontSize: num("fontSize"),
    lineSpacing: num("lineSpacing"),
    pageWidth: num("pageWidth"),
    sideMargin: num("sideMargin"),
    topMargin: num("topMargin"),
    paragraphGap: num("paragraphGap"),
    letterSpacing: num("letterSpacing"),
    firstIndent: num("firstIndent"),
    showToolbar: bool("showToolbar"),
    spellcheck: bool("spellcheck"),
    uiSize: r.uiSize === "large" || r.uiSize === "comfortable" ? r.uiSize : base.uiSize,
    binderWidth: num("binderWidth"),
    binderCompact: bool("binderCompact"),
    scene: typeof r.scene === "string" && SCENE_RE.test(r.scene) ? r.scene : base.scene,
    sceneVisibility: num("sceneVisibility"),
    sceneBlur: num("sceneBlur"),
    paperOpacity: num("paperOpacity"),
  };
}

// ---- the account-wide preferences this replaces in the Manuscript ----------

/** The pre-1.7 writing preferences that had a say in how the page looked. */
export interface LegacyWritingLook {
  themeId?: string;
  lineSpacing?: string;
  writingFont?: string;
  writingMeasure?: string;
}

const LEGACY_LEADING: Record<string, number> = { "1": 1.35, "1.5": 1.75, "2": 2.2 };
const LEGACY_WIDTH: Record<string, number> = { narrow: 680, default: 786, wide: 960, full: 1200 };

/**
 * The room a writer sees before they have touched any room setting: the
 * defaults, bent to what they had already chosen in the old Type and Page
 * theme menus, so 1.7 does not reset anyone's page.
 */
export function roomFromLegacy(legacy: LegacyWritingLook | null | undefined): RoomSettings {
  if (!legacy) return ROOM_DEFAULTS;
  return sanitizeRoom({
    paper: paperForLegacyTheme(legacy.themeId),
    font: legacy.writingFont,
    lineSpacing: LEGACY_LEADING[legacy.lineSpacing ?? ""],
    pageWidth: LEGACY_WIDTH[legacy.writingMeasure ?? ""],
  });
}

// ---- storage ---------------------------------------------------------------

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** localStorage, or null where it is unavailable (private mode, SSR, tests). */
export function roomStorage(): KeyValueStore | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/** The stored room, or null when this device has never saved one. */
export function readRoom(store: KeyValueStore | null): RoomSettings | null {
  if (!store) return null;
  try {
    const raw = store.getItem(ROOM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return sanitizeRoom(parsed);
  } catch {
    return null;
  }
}

export function writeRoom(store: KeyValueStore | null, room: RoomSettings): boolean {
  if (!store) return false;
  try {
    store.setItem(ROOM_KEY, JSON.stringify(sanitizeRoom(room)));
    return true;
  } catch {
    return false;
  }
}

export function clearRoom(store: KeyValueStore | null): void {
  try {
    store?.removeItem(ROOM_KEY);
  } catch {
    /* nothing to clear */
  }
}

// ---- saved looks -----------------------------------------------------------

/** A look is the whole room except the per-device chrome comforts. */
export type RoomLookSettings = Omit<RoomSettings, "binderWidth" | "binderCompact" | "uiSize">;

export interface RoomLook {
  id: string;
  name: string;
  settings: RoomLookSettings;
}

export function lookOf(room: RoomSettings): RoomLookSettings {
  const { binderWidth: _w, binderCompact: _c, uiSize: _u, ...look } = room;
  return look;
}

export function sanitizeLooks(raw: unknown): RoomLook[] {
  if (!Array.isArray(raw)) return [];
  const out: RoomLook[] = [];
  const ids = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim().slice(0, MAX_LOOK_NAME) : "";
    if (!id || !name || ids.has(id)) continue;
    ids.add(id);
    out.push({ id, name, settings: lookOf(sanitizeRoom(r.settings)) });
    if (out.length >= MAX_LOOKS) break;
  }
  return out;
}

export function readLooks(store: KeyValueStore | null): RoomLook[] {
  if (!store) return [];
  try {
    return sanitizeLooks(JSON.parse(store.getItem(LOOKS_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function writeLooks(store: KeyValueStore | null, looks: RoomLook[]): boolean {
  if (!store) return false;
  try {
    store.setItem(LOOKS_KEY, JSON.stringify(sanitizeLooks(looks)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Save the room under a name. A look of the same name (any case) is
 * replaced in place; a new one goes on top. Returns null when the shelf is
 * full (12) or the name is empty: the caller says so, nothing is dropped.
 */
export function saveLook(looks: RoomLook[], name: string, room: RoomSettings): RoomLook[] | null {
  const clean = name.trim().slice(0, MAX_LOOK_NAME);
  if (!clean) return null;
  const settings = lookOf(room);
  const at = looks.findIndex((l) => l.name.toLowerCase() === clean.toLowerCase());
  if (at >= 0) return looks.map((l, i) => (i === at ? { ...l, name: clean, settings } : l));
  if (looks.length >= MAX_LOOKS) return null;
  const id = `look-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  return [{ id, name: clean, settings }, ...looks];
}

/** Recall a look: its settings over the room, chrome comforts left alone. */
export function applyLook(room: RoomSettings, look: RoomLook): RoomSettings {
  return sanitizeRoom({ ...room, ...look.settings }, room);
}

// ---- to CSS ----------------------------------------------------------------

/** The live value of the tokens a "Void" page is made of, for measuring. */
export function liveVoidColors(read: (name: string) => string): PaperColors | null {
  const get = (name: string): string | null => {
    const c = parseColor(read(name));
    return c ? toHex(c) : null;
  };
  const paper = get("--sf-void");
  const ink = get("--t2");
  const inkStrong = get("--t1");
  const inkSoft = get("--t3");
  const inkFaint = get("--t4");
  if (!paper || !ink || !inkStrong || !inkSoft || !inkFaint) return null;
  return {
    paper,
    ink,
    inkStrong,
    inkSoft,
    inkFaint,
    rule: get("--sf-line-hairline") ?? inkFaint,
    selection: get("--sf-surface-elevated") ?? paper,
    wash: get("--sf-surface") ?? paper,
  };
}

/** Default Void·Teal, for when the live tokens cannot be read (tests, SSR). */
export const VOID_FALLBACK: PaperColors = VOID_PAPER_FALLBACK;

/**
 * The sheet opacity actually drawn: what the writer asked for, never below
 * the floor that keeps every text colour AA over the photograph.
 */
export function effectivePaperOpacity(room: RoomSettings, voidColors: PaperColors = VOID_FALLBACK): number {
  if (room.scene === "none") return 100;
  const paper = getPaper(room.paper);
  const colors = paper.colors ?? voidColors;
  const floor = paperOpacityFloor(colors, paperTone(paper, colors), room.sceneVisibility);
  return Math.max(room.paperOpacity, floor);
}

/**
 * Light or dark. A fixed paper says; "Void" follows the instrument theme,
 * and 24 of the 60 themes are light, so its tone is read off its colour.
 */
export function paperTone(paper: Paper, colors: PaperColors): Paper["tone"] {
  if (paper.colors) return paper.tone;
  return luminance(parseHex(colors.paper)) > 0.18 ? "light" : "dark";
}

export type RoomStyle = Record<`--${string}`, string>;

/**
 * The room as custom properties for the Manuscript root. `--room-*` names
 * only, plus the three `--sf-writing-*` properties the editor has always
 * read. The prose column is the sheet minus its side margins.
 */
export function roomStyle(room: RoomSettings, voidColors: PaperColors = VOID_FALLBACK): RoomStyle {
  const paper = getPaper(room.paper);
  const c = paper.colors;
  const measure = Math.max(240, room.pageWidth - room.sideMargin * 2);
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  // A theme hue as drawn on this sheet. On "Void" the theme's own stops are
  // already solved for its planes. On a fixed sheet the hue's base stop is
  // folded toward the sheet's strongest ink: enough for a line or a dot
  // (graphic, 3:1) or for coloured words (text, 4.5:1), whichever of the 60
  // themes is active (themes.test.ts measures them all).
  const graphic = (base: string) =>
    c ? `color-mix(in srgb, var(${base}), ${c.inkStrong} ${pct(paper.graphicMix)})` : `var(${base})`;
  const text = (base: string) =>
    c ? `color-mix(in srgb, var(${base}), ${c.inkStrong} ${pct(paper.textMix)})` : `var(${base}-text)`;
  return {
    "--room-paper": c ? c.paper : "var(--sf-void)",
    "--room-ink": c ? c.ink : "var(--t2)",
    "--room-ink-strong": c ? c.inkStrong : "var(--t1)",
    "--room-ink-soft": c ? c.inkSoft : "var(--t3)",
    "--room-ink-faint": c ? c.inkFaint : "var(--t4)",
    "--room-rule": c ? c.rule : "var(--sf-line-hairline)",
    "--room-selection": c ? c.selection : "var(--sf-selection-bg)",
    "--room-wash": c ? c.wash : "rgb(var(--sf-amber-rgb) / 0.1)",
    "--room-accent": graphic("--sf-primary"),
    "--room-accent-text": text("--sf-primary"),
    "--room-link": text("--sf-stellar"),
    "--room-warn": graphic("--sf-amber"),
    "--room-warn-text": text("--sf-amber"),
    "--room-stop-text": text("--sf-crimson"),
    // The share of ink folded into any other hue drawn on the sheet (a cited
    // fact's cascade colour, an entity's own colour).
    "--room-graphic-ink": c ? pct(paper.graphicMix) : "0%",
    "--sf-writing-font": ROOM_FONT_STACK[room.font],
    "--sf-writing-size": `${room.fontSize}px`,
    "--sf-writing-leading": String(room.lineSpacing),
    "--sf-writing-measure": `${measure}px`,
    "--room-page-width": `${room.pageWidth}px`,
    "--room-page-margin": `${room.sideMargin}px`,
    "--room-page-top": `${room.topMargin}px`,
    "--room-para-gap": `${room.paragraphGap}em`,
    "--room-letter-spacing": `${room.letterSpacing}px`,
    "--room-indent": `${room.firstIndent}em`,
    "--room-binder-width": `${room.binderWidth}px`,
    "--room-ui-zoom": room.uiSize === "large" ? "1.125" : "1",
    "--room-scene-visibility": String(room.scene === "none" ? 0 : room.sceneVisibility / 100),
    "--room-scene-blur": `${room.sceneBlur}px`,
    "--room-paper-opacity": `${effectivePaperOpacity(room, voidColors)}%`,
  };
}
