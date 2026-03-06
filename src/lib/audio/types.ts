// ---------------------------------------------------------------------------
// Audio system shared types
// ---------------------------------------------------------------------------

export interface AudioTrack {
  id: string;
  title: string;
  artist?: string;
  url: string;
  /** Duration in seconds (populated after loading) */
  duration?: number;
  source: "curated" | "upload" | "url";
}

export interface AudioPlaylist {
  id: string;
  name: string;
  tracks: AudioTrack[];
  source: "curated" | "user";
}

export type RepeatMode = "none" | "all" | "one";

export interface AudioPlayerState {
  status: "idle" | "loading" | "playing" | "paused" | "error";
  currentTrack: AudioTrack | null;
  currentPlaylist: AudioPlaylist | null;
  currentIndex: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  progress: number;
  duration: number;
  minimized: boolean;
}
