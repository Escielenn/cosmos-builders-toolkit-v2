import type { AudioTrack, AudioPlaylist } from "./types";

// ---------------------------------------------------------------------------
// Curated tracks — static files in /public/audio/curated/
//
// Drop mp3 files into that directory and reference them here.
// These are placeholder entries — update titles/artists/filenames to match
// your actual audio files.
// ---------------------------------------------------------------------------

export const CURATED_TRACKS: AudioTrack[] = [
  // ── Deep Space Ambient ──
  {
    id: "curated-deep-space-01",
    title: "Void Resonance",
    artist: "StellarForge Ambient",
    url: "/audio/curated/void-resonance.mp3",
    source: "curated",
  },
  {
    id: "curated-deep-space-02",
    title: "Cosmic Background",
    artist: "StellarForge Ambient",
    url: "/audio/curated/cosmic-background.mp3",
    source: "curated",
  },
  {
    id: "curated-deep-space-03",
    title: "Interstellar Drift",
    artist: "StellarForge Ambient",
    url: "/audio/curated/interstellar-drift.mp3",
    source: "curated",
  },
  {
    id: "curated-deep-space-04",
    title: "Dark Matter Pulse",
    artist: "StellarForge Ambient",
    url: "/audio/curated/dark-matter-pulse.mp3",
    source: "curated",
  },

  // ── Planetary Atmospheres ──
  {
    id: "curated-planetary-01",
    title: "Atmospheric Entry",
    artist: "StellarForge Ambient",
    url: "/audio/curated/atmospheric-entry.mp3",
    source: "curated",
  },
  {
    id: "curated-planetary-02",
    title: "Tidal Harmonics",
    artist: "StellarForge Ambient",
    url: "/audio/curated/tidal-harmonics.mp3",
    source: "curated",
  },
  {
    id: "curated-planetary-03",
    title: "Surface Winds",
    artist: "StellarForge Ambient",
    url: "/audio/curated/surface-winds.mp3",
    source: "curated",
  },
  {
    id: "curated-planetary-04",
    title: "Subsurface Ocean",
    artist: "StellarForge Ambient",
    url: "/audio/curated/subsurface-ocean.mp3",
    source: "curated",
  },

  // ── Stellar Drift ──
  {
    id: "curated-stellar-01",
    title: "Solar Flare",
    artist: "StellarForge Ambient",
    url: "/audio/curated/solar-flare.mp3",
    source: "curated",
  },
  {
    id: "curated-stellar-02",
    title: "Neutron Star",
    artist: "StellarForge Ambient",
    url: "/audio/curated/neutron-star.mp3",
    source: "curated",
  },
  {
    id: "curated-stellar-03",
    title: "Binary Orbit",
    artist: "StellarForge Ambient",
    url: "/audio/curated/binary-orbit.mp3",
    source: "curated",
  },
  {
    id: "curated-stellar-04",
    title: "Event Horizon",
    artist: "StellarForge Ambient",
    url: "/audio/curated/event-horizon.mp3",
    source: "curated",
  },
];

// ---------------------------------------------------------------------------
// Curated playlists
// ---------------------------------------------------------------------------

export const CURATED_PLAYLISTS: AudioPlaylist[] = [
  {
    id: "playlist-deep-space",
    name: "Deep Space Ambient",
    source: "curated",
    tracks: CURATED_TRACKS.filter((t) => t.id.startsWith("curated-deep-space")),
  },
  {
    id: "playlist-planetary",
    name: "Planetary Atmospheres",
    source: "curated",
    tracks: CURATED_TRACKS.filter((t) => t.id.startsWith("curated-planetary")),
  },
  {
    id: "playlist-stellar",
    name: "Stellar Drift",
    source: "curated",
    tracks: CURATED_TRACKS.filter((t) => t.id.startsWith("curated-stellar")),
  },
  {
    id: "playlist-all-curated",
    name: "All Curated Tracks",
    source: "curated",
    tracks: CURATED_TRACKS,
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
