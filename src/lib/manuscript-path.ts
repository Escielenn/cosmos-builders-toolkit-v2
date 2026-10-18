// ---------------------------------------------------------------------------
// manuscript-path — where a Manuscript document lives (1.5 item 26).
//
// The editor used to sit at /write/:docId, outside WorldLayout, so opening a
// document dropped the four-space nav and the world with it. It now lives
// INSIDE the world: /worlds/:worldId/write/:docId. /write/:docId still works
// and redirects here once the document's world is known.
//
// Every internal link that opens a document goes through manuscriptPath() so
// the shape is written once.
// ---------------------------------------------------------------------------

export interface ManuscriptPathOptions {
  /** Open the import dialog on arrival (the Studio's "Bring a manuscript"). */
  import?: boolean;
}

/**
 * The URL of a Manuscript document, or of the world's Manuscript when no
 * document is named (which opens its latest document).
 */
export function manuscriptPath(
  worldId: string,
  docId?: string | null,
  opts: ManuscriptPathOptions = {},
): string {
  const base = `/worlds/${worldId}/write${docId ? `/${docId}` : ""}`;
  return opts.import ? `${base}?import=1` : base;
}

/**
 * True for any URL that renders the Manuscript editor: the world-scoped
 * route and the legacy /write redirects. Global chrome that must stand aside
 * for the full-height editor (the status bar) reads this.
 */
export function isManuscriptPath(pathname: string): boolean {
  if (pathname === "/write" || pathname.startsWith("/write/")) return true;
  return /^\/worlds\/[^/]+\/write(\/|$)/.test(pathname);
}

/** True when the path is this world's Manuscript (editor or its redirect). */
export function isWorldManuscriptPath(pathname: string, worldId: string): boolean {
  const base = `/worlds/${worldId}/write`;
  return pathname === base || pathname.startsWith(`${base}/`);
}
