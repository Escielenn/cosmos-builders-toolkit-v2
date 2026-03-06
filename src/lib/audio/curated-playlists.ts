import type { AudioTrack, AudioPlaylist } from "./types";

// ---------------------------------------------------------------------------
// Curated tracks — static files in /public/music/
// All tracks licensed via Envato Elements.
// ---------------------------------------------------------------------------

export const CURATED_TRACKS: AudioTrack[] = [
  // ── Cinematic & Epic ──
  {
    id: "curated-birth-galaxy",
    title: "Birth of New Galaxy",
    artist: "PremiumBeat",
    url: "/music/Birth_of_New_Galaxy.wav",
    source: "curated",
  },
  {
    id: "curated-space-exploration",
    title: "Space Exploration",
    artist: "keithmerrill",
    url: "/music/Space_Exploration-Epic_Cinematic.mp3",
    source: "curated",
  },
  {
    id: "curated-undiscovered-worlds",
    title: "Undiscovered Worlds",
    artist: "ScoreStudio",
    url: "/music/Undiscovered_Worlds.mp3",
    source: "curated",
  },
  {
    id: "curated-universe-cinematic-v1",
    title: "Universe Cinematic",
    artist: "Alec_Koff",
    url: "/music/Universe_Space_Sci-Fi_Cinematic.wav",
    source: "curated",
  },
  {
    id: "curated-universe-cinematic-v2",
    title: "Universe Cinematic II",
    artist: "Alec_Koff",
    url: "/music/Universe_Space_Sci-Fi_Cinematic_v2.wav",
    source: "curated",
  },
  {
    id: "curated-universe-cinematic-v3",
    title: "Universe Cinematic III",
    artist: "Alec_Koff",
    url: "/music/Universe_Space_Sci-Fi_Cinematic_v3.wav",
    source: "curated",
  },
  {
    id: "curated-universe-cinematic-v4",
    title: "Universe Cinematic IV",
    artist: "Alec_Koff",
    url: "/music/Universe_Space_Sci-Fi_Cinematic_v4.wav",
    source: "curated",
  },

  // ── Ambient & Atmospheric ──
  {
    id: "curated-interstellar-gravity",
    title: "Interstellar Gravity Nebula",
    artist: "Stereo_Color",
    url: "/music/Interstellar_Gravity_Nebula-No_Vocals.mp3",
    source: "curated",
  },
  {
    id: "curated-space-ambient",
    title: "Space Ambient Background",
    artist: "cleanmindsounds",
    url: "/music/Space_Ambient_Background.mp3",
    source: "curated",
  },
  {
    id: "curated-slow-motion",
    title: "Slow Motion Ambient Cinematic",
    artist: "puremusic",
    url: "/music/Slow_Motion_Ambient_Cinematic-Main_Track.mp3",
    source: "curated",
  },
  {
    id: "curated-space-soundscape",
    title: "Space Soundscape",
    artist: "DHDMusicStudio",
    url: "/music/Space_Soundscape.wav",
    source: "curated",
  },
  {
    id: "curated-scifi-soundscape",
    title: "Sci-Fi Soundscape",
    artist: "GentleJammers",
    url: "/music/Sci-Fi_Soundscape.wav",
    source: "curated",
  },
  {
    id: "curated-scifi-space-future",
    title: "Sci-Fi Space Future",
    artist: "PetRUalitY",
    url: "/music/Sci-Fi_Space_Future.mp3",
    source: "curated",
  },

  // ── Science Fiction Suite ──
  {
    id: "curated-scifi-01",
    title: "Science Fiction I",
    artist: "Crypt-of-Insomnia",
    url: "/music/Science_Fiction_01.mp3",
    source: "curated",
  },
  {
    id: "curated-scifi-02",
    title: "Science Fiction II",
    artist: "Crypt-of-Insomnia",
    url: "/music/Science_Fiction_02.mp3",
    source: "curated",
  },
  {
    id: "curated-scifi-03",
    title: "Science Fiction III",
    artist: "Crypt-of-Insomnia",
    url: "/music/Science_Fiction_03-Main_Full.wav",
    source: "curated",
  },

  // ── Loops (for sustained worldbuilding) ──
  {
    id: "curated-loop-01",
    title: "Sci-Fi Loop I",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_loop-01.wav",
    source: "curated",
  },
  {
    id: "curated-loop-02",
    title: "Sci-Fi Loop II",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_loop-02.wav",
    source: "curated",
  },
  {
    id: "curated-loop-03",
    title: "Sci-Fi Loop III",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_loop-03.wav",
    source: "curated",
  },
  {
    id: "curated-loop-04",
    title: "Sci-Fi Loop IV",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_loop-04.wav",
    source: "curated",
  },
  {
    id: "curated-loop-05",
    title: "Sci-Fi Loop V",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_loop-05.wav",
    source: "curated",
  },
  {
    id: "curated-loop-06",
    title: "Sci-Fi Loop VI",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_loop-06.wav",
    source: "curated",
  },
  {
    id: "curated-loop-07",
    title: "Sci-Fi Loop VII",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_loop-07.wav",
    source: "curated",
  },

  // ── Stems & Shorts ──
  {
    id: "curated-short-01",
    title: "Sci-Fi Short I",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_short-01_18sec.wav",
    source: "curated",
  },
  {
    id: "curated-short-02",
    title: "Sci-Fi Short II",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_short-02_32sec.wav",
    source: "curated",
  },
  {
    id: "curated-short-03",
    title: "Sci-Fi Short III",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_short-03_62sec.wav",
    source: "curated",
  },
  {
    id: "curated-stem-01",
    title: "Sci-Fi Stem I",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_stem-01.wav",
    source: "curated",
  },
  {
    id: "curated-stem-02",
    title: "Sci-Fi Stem II",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_stem-02.wav",
    source: "curated",
  },
  {
    id: "curated-stem-03",
    title: "Sci-Fi Stem III",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_stem-03.wav",
    source: "curated",
  },
  {
    id: "curated-stem-04",
    title: "Sci-Fi Stem IV",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_stem-04.wav",
    source: "curated",
  },
  {
    id: "curated-stem-05",
    title: "Sci-Fi Stem V",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_stem-05.wav",
    source: "curated",
  },
  {
    id: "curated-stem-06",
    title: "Sci-Fi Stem VI",
    artist: "Crypt-of-Insomnia",
    url: "/music/science-fiction_stem-06.wav",
    source: "curated",
  },
];

// ---------------------------------------------------------------------------
// Curated playlists
// ---------------------------------------------------------------------------

export const CURATED_PLAYLISTS: AudioPlaylist[] = [
  {
    id: "playlist-cinematic",
    name: "Cinematic & Epic",
    source: "curated",
    tracks: CURATED_TRACKS.filter((t) =>
      ["curated-birth-galaxy", "curated-space-exploration", "curated-undiscovered-worlds",
       "curated-universe-cinematic-v1", "curated-universe-cinematic-v2",
       "curated-universe-cinematic-v3", "curated-universe-cinematic-v4"].includes(t.id)
    ),
  },
  {
    id: "playlist-ambient",
    name: "Ambient & Atmospheric",
    source: "curated",
    tracks: CURATED_TRACKS.filter((t) =>
      ["curated-interstellar-gravity", "curated-space-ambient", "curated-slow-motion",
       "curated-space-soundscape", "curated-scifi-soundscape", "curated-scifi-space-future"].includes(t.id)
    ),
  },
  {
    id: "playlist-scifi-suite",
    name: "Science Fiction Suite",
    source: "curated",
    tracks: CURATED_TRACKS.filter((t) => t.id.startsWith("curated-scifi-0")),
  },
  {
    id: "playlist-loops",
    name: "Worldbuilding Loops",
    source: "curated",
    tracks: CURATED_TRACKS.filter((t) => t.id.startsWith("curated-loop")),
  },
  {
    id: "playlist-all-curated",
    name: "All Curated Tracks",
    source: "curated",
    tracks: CURATED_TRACKS.filter((t) =>
      !t.id.startsWith("curated-stem") && !t.id.startsWith("curated-short")
    ),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function findCuratedPlaylist(id: string): AudioPlaylist | undefined {
  return CURATED_PLAYLISTS.find((p) => p.id === id);
}

export function findCuratedTrack(id: string): AudioTrack | undefined {
  return CURATED_TRACKS.find((t) => t.id === id);
}
