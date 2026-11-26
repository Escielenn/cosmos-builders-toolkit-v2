// ---------------------------------------------------------------------------
// Atmosphere: an optional, faded photograph behind the page.
//
// "none" is the default. "world" is the world's own cover image: the world
// pushes into the room. The rest is a small curated gallery hot-linked from
// images.unsplash.com (already allowed by the CSP in index.html), the three
// scenes from Scribbles plus four that suit this instrument.
//
// Text never sits on a photograph: the sheet stays between them and its
// opacity has a floor (lib/writing/themes.ts, paperOpacityFloor).
// Pure: no React, no network.
// ---------------------------------------------------------------------------

export interface SceneCredit {
  /** Shown as written. */
  photographer: string;
  /** Unsplash username, for the profile link. */
  username: string;
  /** Unsplash photo id, for the photo link. */
  photoId: string;
}

export interface Scene {
  id: string;
  name: string;
  /** Path on images.unsplash.com: `photo-…`. */
  photo: string;
  /** Null: the scene came from Scribbles without a recorded photographer. */
  credit: SceneCredit | null;
}

export const SCENE_NONE = "none";
export const SCENE_WORLD = "world";

export const SCENES: Scene[] = [
  // From Scribbles (src/ambience.js), credited there as "Photography via Unsplash".
  { id: "lake", name: "Mountain lake", photo: "photo-1470770841072-f978cf4d019e", credit: null },
  { id: "forest", name: "Forest light", photo: "photo-1441974231531-c6227db76b6e", credit: null },
  { id: "shore", name: "Quiet shore", photo: "photo-1507525428034-b723cf961d3e", credit: null },
  // Added for StellarForge (Unsplash, credits as listed on each photo's page).
  {
    id: "nebula",
    name: "Nebula",
    photo: "photo-1462332420958-a05d1e002413",
    credit: { photographer: "NASA", username: "nasa", photoId: "-hI5dX2ObAs" },
  },
  {
    id: "earthset",
    name: "Earthset",
    photo: "photo-1777195680785-23dbb7768b60",
    credit: { photographer: "NASA", username: "nasa", photoId: "aB5tmNaOsYA" },
  },
  {
    id: "summit-stars",
    name: "Stars over the summit",
    photo: "photo-1519681393784-d120267933ba",
    credit: { photographer: "Benjamin Voros", username: "vorosbenisop", photoId: "phIFdC6lA4E" },
  },
  {
    id: "dunes",
    name: "Dunes at dusk",
    photo: "photo-1548272475-4a32d90e4f91",
    credit: { photographer: "Mikk Tõnissoo", username: "themikk", photoId: "PWf-Dr2qpOo" },
  },
];

const UTM = "utm_source=stellarforge&utm_medium=referral";

export function findScene(id: string | null | undefined): Scene | null {
  return SCENES.find((s) => s.id === id) ?? null;
}

/** An Unsplash CDN url for a curated scene at a given width. */
export function scenePhotoUrl(scene: Scene, width = 1920, quality = 80): string {
  return `https://images.unsplash.com/${scene.photo}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

/**
 * A world cover is user content from anywhere the app already allows
 * (Supabase storage, Unsplash, a data: url). Only https, data:image and
 * blob: urls are drawn; anything else is treated as no cover.
 */
export function safeCoverUrl(value: string | null | undefined): string {
  if (typeof value !== "string") return "";
  const v = value.trim();
  if (!v || v.length > 200_000) return "";
  if (/^data:image\/(?:jpeg|png|webp|avif|gif);base64,[a-z0-9+/=]+$/i.test(v)) return v;
  if (/^blob:/i.test(v)) return v;
  try {
    const url = new URL(v);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

export interface ResolvedScene {
  /** Url to draw, or "" for no photograph. */
  url: string;
  /** Who to credit under the page, when known. */
  credit: SceneCredit | null;
  /** "world" | "gallery" | "none". */
  source: "world" | "gallery" | "none";
  name: string;
}

/**
 * What to draw for a stored scene id. An unknown id, or "world" on a world
 * with no cover, resolves to no photograph rather than a broken image.
 */
export function resolveScene(sceneId: string, worldCover: string | null | undefined, worldName = ""): ResolvedScene {
  const none: ResolvedScene = { url: "", credit: null, source: "none", name: "No image" };
  if (sceneId === SCENE_WORLD) {
    const url = safeCoverUrl(worldCover);
    return url ? { url, credit: null, source: "world", name: worldName ? `${worldName} cover` : "World cover" } : none;
  }
  const scene = findScene(sceneId);
  return scene ? { url: scenePhotoUrl(scene), credit: scene.credit, source: "gallery", name: scene.name } : none;
}

export const photographerLink = (c: SceneCredit): string =>
  `https://unsplash.com/@${encodeURIComponent(c.username)}?${UTM}`;
export const photoLink = (c: SceneCredit): string =>
  `https://unsplash.com/photos/${encodeURIComponent(c.photoId)}?${UTM}`;
export const UNSPLASH_LINK = `https://unsplash.com/?${UTM}`;
