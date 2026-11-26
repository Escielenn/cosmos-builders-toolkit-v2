import { describe, expect, it } from "vitest";
import { MAX_SAVED_PLAYLISTS, parsePlaylistLink, rememberPlaylist, sanitizeSavedPlaylists } from "./music";

const SPOTIFY = "37i9dQZF1DX8NTLI2TtZa6";

describe("parsePlaylistLink", () => {
  it("reads a Spotify playlist or album, with or without a locale or tracking", () => {
    expect(parsePlaylistLink(`https://open.spotify.com/playlist/${SPOTIFY}?si=abc`)).toEqual({
      provider: "Spotify",
      url: `https://open.spotify.com/playlist/${SPOTIFY}`,
      embed: `https://open.spotify.com/embed/playlist/${SPOTIFY}`,
    });
    expect(parsePlaylistLink(`https://open.spotify.com/intl-pt/album/${SPOTIFY}`)?.embed).toBe(
      `https://open.spotify.com/embed/album/${SPOTIFY}`,
    );
  });
  it("reads a YouTube playlist from a playlist or watch link", () => {
    const list = "PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI";
    const want = {
      provider: "YouTube",
      url: `https://www.youtube.com/playlist?list=${list}`,
      embed: `https://www.youtube-nocookie.com/embed/videoseries?list=${list}`,
    };
    expect(parsePlaylistLink(`https://www.youtube.com/playlist?list=${list}`)).toEqual(want);
    expect(parsePlaylistLink(`https://music.youtube.com/watch?v=abc&list=${list}`)).toEqual(want);
  });
  it("refuses everything else", () => {
    for (const bad of [
      "",
      "spotify",
      `http://open.spotify.com/playlist/${SPOTIFY}`,
      `https://open.spotify.com.evil.example/playlist/${SPOTIFY}`,
      `https://user:pw@open.spotify.com/playlist/${SPOTIFY}`,
      `https://open.spotify.com:8443/playlist/${SPOTIFY}`,
      "https://open.spotify.com/playlist/short",
      "https://open.spotify.com/track/37i9dQZF1DX8NTLI2TtZa6",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/playlist?list=\"><script>",
      "https://vimeo.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI",
      "javascript:alert(1)",
    ]) {
      expect(parsePlaylistLink(bad), bad).toBeNull();
    }
  });
});

describe("saved playlists", () => {
  const a = { name: "Drift", url: `https://open.spotify.com/playlist/${SPOTIFY}` };
  const b = { name: "", url: "https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI" };
  it("drops invalid and duplicate links and names the unnamed", () => {
    expect(sanitizeSavedPlaylists([a, { ...a, name: "Again" }, b, { name: "x", url: "https://example.com" }, 4])).toEqual([
      a,
      { name: "YouTube playlist", url: b.url },
    ]);
  });
  it("moves a reloaded link to the top and caps the list", () => {
    expect(rememberPlaylist([a, { name: "B", url: b.url }], { name: "B2", url: b.url }).map((p) => p.name)).toEqual(["B2", "Drift"]);
    const many = Array.from({ length: 30 }, (_, i) => ({
      name: `P${i}`,
      url: `https://www.youtube.com/playlist?list=PLAYLIST${String(i).padStart(4, "0")}`,
    }));
    expect(sanitizeSavedPlaylists(many)).toHaveLength(MAX_SAVED_PLAYLISTS);
  });
});
