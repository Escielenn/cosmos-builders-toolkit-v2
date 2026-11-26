// ---------------------------------------------------------------------------
// Display preferences: the shell's ambient budget (1.6 "Quiet Instrument").
//
// Device-local settings, set from the header's Display menu:
//
//   telemetry  where the fixed bottom telemetry bar may render.
//              "marketing" (default): signed-out marketing pages only, never
//              inside the app. "everywhere": app pages too (never over the
//              Manuscript or a simulator canvas). "off": nowhere.
//   ambient    "on" (default) or "off". Off sets data-ambient="off" on <html>,
//              which zeroes --sf-ambient, so every decorative layer that
//              multiplies it (grain, scanlines, starfield, bloom) goes dark.
//   worldArt   "on" (default) or "off". On, a world's cover image shows,
//              faded, behind its card (Home, Worlds, shared worlds).
//
// Stored in localStorage; a module-level subscriber set keeps every mounted
// reader in step without a context provider.
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";

export type TelemetryPref = "marketing" | "everywhere" | "off";
export type AmbientPref = "on" | "off";
export type WorldArtPref = "on" | "off";

interface DisplayPrefs {
  telemetry: TelemetryPref;
  ambient: AmbientPref;
  worldArt: WorldArtPref;
}

const KEYS: Record<keyof DisplayPrefs, string> = {
  telemetry: "sf-display-telemetry",
  ambient: "sf-display-ambient",
  worldArt: "sf-display-world-art",
};

const DEFAULTS: DisplayPrefs = { telemetry: "marketing", ambient: "on", worldArt: "on" };

const VALID: { [K in keyof DisplayPrefs]: readonly DisplayPrefs[K][] } = {
  telemetry: ["marketing", "everywhere", "off"],
  ambient: ["on", "off"],
  worldArt: ["on", "off"],
};

const listeners = new Set<() => void>();

function read<K extends keyof DisplayPrefs>(key: K): DisplayPrefs[K] {
  try {
    const raw = window.localStorage.getItem(KEYS[key]);
    if (raw && (VALID[key] as readonly string[]).includes(raw)) return raw as DisplayPrefs[K];
  } catch {
    /* storage blocked: fall through to the default */
  }
  return DEFAULTS[key];
}

export function getDisplayPref<K extends keyof DisplayPrefs>(key: K): DisplayPrefs[K] {
  if (typeof window === "undefined") return DEFAULTS[key];
  return read(key);
}

export function setDisplayPref<K extends keyof DisplayPrefs>(key: K, value: DisplayPrefs[K]): void {
  try {
    window.localStorage.setItem(KEYS[key], value);
  } catch {
    /* storage blocked: the change still applies for this session below */
  }
  if (key === "ambient") applyAmbient(value as AmbientPref);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key && Object.values(KEYS).includes(e.key)) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useDisplayPref<K extends keyof DisplayPrefs>(key: K): DisplayPrefs[K] {
  return useSyncExternalStore(
    subscribe,
    () => getDisplayPref(key),
    () => DEFAULTS[key],
  );
}

/** Reflect the ambient preference on <html> (tokens.css reads data-ambient). */
export function applyAmbient(value: AmbientPref = getDisplayPref("ambient")): void {
  if (typeof document === "undefined") return;
  if (value === "off") document.documentElement.setAttribute("data-ambient", "off");
  else document.documentElement.removeAttribute("data-ambient");
}

// ---------------------------------------------------------------------------
// Route classification for the shell
// ---------------------------------------------------------------------------

/**
 * Marketing routes: public pages that sell or explain the product. The
 * signed-in "/" is Home, an app page, so callers pass `signedIn`.
 */
const MARKETING_PREFIXES = [
  "/features",
  "/pricing",
  "/learn",
  "/about",
  "/roadmap",
  "/community",
  "/bookshelf",
  "/getting-started",
  "/contact",
  "/changelog",
  "/privacy",
  "/terms",
  "/credits",
];

export function isMarketingPath(pathname: string, signedIn: boolean): boolean {
  if (pathname === "/") return !signedIn;
  return MARKETING_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
