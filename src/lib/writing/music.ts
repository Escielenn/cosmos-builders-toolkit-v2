// ---------------------------------------------------------------------------
// music, the writer's own playlist links.
//
// A pasted Spotify or YouTube playlist link becomes an embed URL on the one
// origin each provider serves embeds from (the CSP's frame-src lists exactly
// those two). Anything else is refused: a link is only ever turned into an
// iframe src when it parses as one of the shapes below.
//
// Pure: no React, no storage.
// ---------------------------------------------------------------------------

export type MusicProvider = "Spotify" | "YouTube";

export interface PlaylistLink {
  provider: MusicProvider;
  /** Canonical page URL ("Open in Spotify"). */
  url: string;
  /** The iframe src. */
  embed: string;
}

export interface SavedPlaylist {
  name: string;
  url: string;
}

export const MAX_SAVED_PLAYLISTS = 20;
export const MAX_PLAYLIST_NAME = 80;

const SPOTIFY_PATH = /^\/(?:intl-[a-z-]+\/)?(playlist|album)\/([a-z0-9]{22})\/?$/i;
const YOUTUBE_HOSTS = new Set(["www.youtube.com", "youtube.com", "music.youtube.com", "m.youtube.com"]);

export function parsePlaylistLink(value: string): PlaylistLink | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  if (url.hostname === "open.spotify.com") {
    const m = SPOTIFY_PATH.exec(url.pathname);
    if (!m) return null;
    const kind = m[1].toLowerCase();
    return {
      provider: "Spotify",
      url: `https://open.spotify.com/${kind}/${m[2]}`,
      embed: `https://open.spotify.com/embed/${kind}/${m[2]}`,
    };
  }
  if (YOUTUBE_HOSTS.has(url.hostname) && (url.pathname === "/playlist" || url.pathname === "/watch")) {
    const list = url.searchParams.get("list") ?? "";
    if (!/^[A-Za-z0-9_-]{10,150}$/.test(list)) return null;
    return {
      provider: "YouTube",
      url: `https://www.youtube.com/playlist?list=${list}`,
      embed: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`,
    };
  }
  return null;
}

/** Stored value -> valid saved links, newest first, capped. */
export function sanitizeSavedPlaylists(raw: unknown): SavedPlaylist[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedPlaylist[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const link = typeof r.url === "string" ? parsePlaylistLink(r.url) : null;
    if (!link || out.some((p) => p.url === link.url)) continue;
    const name = typeof r.name === "string" ? r.name.trim().slice(0, MAX_PLAYLIST_NAME) : "";
    out.push({ name: name || `${link.provider} playlist`, url: link.url });
    if (out.length >= MAX_SAVED_PLAYLISTS) break;
  }
  return out;
}

/** The list with `item` first (a reload of a saved link moves it up). */
export function rememberPlaylist(list: readonly SavedPlaylist[], item: SavedPlaylist): SavedPlaylist[] {
  return sanitizeSavedPlaylists([item, ...list.filter((p) => p.url !== item.url)]);
}
