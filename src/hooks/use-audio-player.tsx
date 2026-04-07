import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type {
  AudioTrack,
  AudioPlaylist,
  RepeatMode,
} from "@/lib/audio/types";

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------

const LS_VOLUME = "sf-audio-volume";
const LS_MUTED = "sf-audio-muted";
const LS_SHUFFLE = "sf-audio-shuffle";
const LS_REPEAT = "sf-audio-repeat";
const LS_MINIMIZED = "sf-audio-minimized";
const LS_LAST_TRACK = "sf-audio-last-track";
const LS_LAST_PLAYLIST = "sf-audio-last-playlist";

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — ignore
  }
}

// ---------------------------------------------------------------------------
// Shuffle helper (Fisher-Yates)
// ---------------------------------------------------------------------------

function shuffleIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

interface AudioStateValue {
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
  hasEverLoaded: boolean;
}

interface AudioControlsValue {
  play: (track: AudioTrack) => void;
  pause: () => void;
  resume: () => void;
  togglePlayPause: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  setRepeat: (mode: RepeatMode) => void;
  loadPlaylist: (playlist: AudioPlaylist, startIndex?: number) => void;
  queuePlaylist: (playlist: AudioPlaylist) => void;
  setMinimized: (v: boolean) => void;
}

const AudioStateContext = createContext<AudioStateValue | null>(null);
const AudioControlsContext = createContext<AudioControlsValue | null>(null);

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAudioPlayer(): AudioStateValue {
  const ctx = useContext(AudioStateContext);
  if (!ctx) throw new Error("useAudioPlayer must be used within AudioProvider");
  return ctx;
}

export function useAudioControls(): AudioControlsValue {
  const ctx = useContext(AudioControlsContext);
  if (!ctx) throw new Error("useAudioControls must be used within AudioProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number>(0);

  // ---- persisted state ----
  const [volume, setVolumeState] = useState(() => lsGet<number>(LS_VOLUME, 0.5));
  const [muted, setMutedState] = useState(() => lsGet<boolean>(LS_MUTED, false));
  const [shuffle, setShuffleState] = useState(() => lsGet<boolean>(LS_SHUFFLE, false));
  const [repeat, setRepeatState] = useState<RepeatMode>(() => lsGet<RepeatMode>(LS_REPEAT, "none"));
  const [minimized, setMinimizedState] = useState(() => lsGet<boolean>(LS_MINIMIZED, true));

  // ---- volatile state ----
  const [status, setStatus] = useState<AudioStateValue["status"]>("idle");
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<AudioPlaylist | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasEverLoaded, setHasEverLoaded] = useState(false);

  // shuffle indices for current playlist
  const shuffleOrderRef = useRef<number[]>([]);

  // ---- lazy Audio element init ----
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audio.muted = muted;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- progress tick via rAF ----
  const startProgressTick = useCallback(() => {
    const tick = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        setProgress(audio.currentTime);
        setDuration(audio.duration || 0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopProgressTick = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  // ---- internal: play a src ----
  const playSource = useCallback(
    async (track: AudioTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      setStatus("loading");
      setCurrentTrack(track);
      setHasEverLoaded(true);
      audio.src = track.url;
      audio.load();

      try {
        await audio.play();
        setStatus("playing");
        startProgressTick();
      } catch (err: unknown) {
        // Browser autoplay blocked — pause state, user can click play
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setStatus("paused");
        } else {
          setStatus("error");
        }
      }
    },
    [startProgressTick]
  );

  // ---- resolve index considering shuffle ----
  const resolveIndex = useCallback(
    (idx: number, playlist: AudioPlaylist): number => {
      if (!shuffle || shuffleOrderRef.current.length !== playlist.tracks.length) {
        return idx;
      }
      return shuffleOrderRef.current[idx] ?? idx;
    },
    [shuffle]
  );

  // ---- controls ----

  const play = useCallback(
    (track: AudioTrack) => {
      playSource(track);
      lsSet(LS_LAST_TRACK, track);
    },
    [playSource]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus("paused");
    stopProgressTick();
  }, [stopProgressTick]);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    try {
      await audio.play();
      setStatus("playing");
      startProgressTick();
    } catch {
      setStatus("paused");
    }
  }, [startProgressTick]);

  const togglePlayPause = useCallback(() => {
    if (status === "playing") {
      pause();
    } else {
      resume();
    }
  }, [status, pause, resume]);

  const next = useCallback(() => {
    if (!currentPlaylist) return;
    const len = currentPlaylist.tracks.length;
    if (len === 0) return;

    let nextIdx = currentIndex + 1;

    if (repeat === "one") {
      // replay current
      const track = currentPlaylist.tracks[resolveIndex(currentIndex, currentPlaylist)];
      if (track) playSource(track);
      return;
    }

    if (nextIdx >= len) {
      if (repeat === "all") {
        nextIdx = 0;
        // re-shuffle for a fresh order
        if (shuffle) {
          shuffleOrderRef.current = shuffleIndices(len);
        }
      } else {
        // end of playlist
        pause();
        return;
      }
    }

    setCurrentIndex(nextIdx);
    const track = currentPlaylist.tracks[resolveIndex(nextIdx, currentPlaylist)];
    if (track) playSource(track);
  }, [currentPlaylist, currentIndex, repeat, shuffle, resolveIndex, playSource, pause]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    // If more than 3s into the track, restart it instead
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (!currentPlaylist) return;
    const len = currentPlaylist.tracks.length;
    let prevIdx = currentIndex - 1;
    if (prevIdx < 0) {
      prevIdx = repeat === "all" ? len - 1 : 0;
    }

    setCurrentIndex(prevIdx);
    const track = currentPlaylist.tracks[resolveIndex(prevIdx, currentPlaylist)];
    if (track) playSource(track);
  }, [currentPlaylist, currentIndex, repeat, resolveIndex, playSource]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setProgress(time);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    lsSet(LS_VOLUME, clamped);
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      if (audioRef.current) audioRef.current.muted = next;
      lsSet(LS_MUTED, next);
      return next;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleState((prev) => {
      const next = !prev;
      lsSet(LS_SHUFFLE, next);
      if (next && currentPlaylist) {
        shuffleOrderRef.current = shuffleIndices(currentPlaylist.tracks.length);
      }
      return next;
    });
  }, [currentPlaylist]);

  const setRepeat = useCallback((mode: RepeatMode) => {
    setRepeatState(mode);
    lsSet(LS_REPEAT, mode);
  }, []);

  const loadPlaylist = useCallback(
    (playlist: AudioPlaylist, startIndex = 0) => {
      setCurrentPlaylist(playlist);
      setCurrentIndex(startIndex);
      lsSet(LS_LAST_PLAYLIST, { id: playlist.id, source: playlist.source });

      if (shuffle) {
        shuffleOrderRef.current = shuffleIndices(playlist.tracks.length);
      }

      const track = playlist.tracks[shuffle ? (shuffleOrderRef.current[startIndex] ?? startIndex) : startIndex];
      if (track) {
        playSource(track);
        lsSet(LS_LAST_TRACK, track);
      }
    },
    [shuffle, playSource]
  );

  const queuePlaylist = useCallback(
    (playlist: AudioPlaylist) => {
      // Load playlist into player but do NOT auto-play
      setCurrentPlaylist(playlist);
      setCurrentIndex(0);
      setHasEverLoaded(true);
      lsSet(LS_LAST_PLAYLIST, { id: playlist.id, source: playlist.source });

      if (shuffle) {
        shuffleOrderRef.current = shuffleIndices(playlist.tracks.length);
      }

      const idx = shuffle ? (shuffleOrderRef.current[0] ?? 0) : 0;
      const track = playlist.tracks[idx];
      if (track) {
        setCurrentTrack(track);
        setStatus("paused");
        // Pre-load the source without playing
        const audio = audioRef.current;
        if (audio) {
          audio.src = track.url;
          audio.load();
        }
      }
    },
    [shuffle]
  );

  const setMinimized = useCallback((v: boolean) => {
    setMinimizedState(v);
    lsSet(LS_MINIMIZED, v);
  }, []);

  // ---- ended event → next ----
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      next();
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleError = () => {
      setStatus("error");
      stopProgressTick();
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
    };
  }, [next, stopProgressTick]);

  // ---- context values (memoized) ----
  const stateValue = useMemo<AudioStateValue>(
    () => ({
      status,
      currentTrack,
      currentPlaylist,
      currentIndex,
      volume,
      muted,
      shuffle,
      repeat,
      progress,
      duration,
      minimized,
      hasEverLoaded,
    }),
    [status, currentTrack, currentPlaylist, currentIndex, volume, muted, shuffle, repeat, progress, duration, minimized, hasEverLoaded]
  );

  const controlsValue = useMemo<AudioControlsValue>(
    () => ({
      play,
      pause,
      resume,
      togglePlayPause,
      next,
      prev,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      setRepeat,
      loadPlaylist,
      queuePlaylist,
      setMinimized,
    }),
    [play, pause, resume, togglePlayPause, next, prev, seek, setVolume, toggleMute, toggleShuffle, setRepeat, loadPlaylist, queuePlaylist, setMinimized]
  );

  return (
    <AudioControlsContext.Provider value={controlsValue}>
      <AudioStateContext.Provider value={stateValue}>
        {children}
      </AudioStateContext.Provider>
    </AudioControlsContext.Provider>
  );
}
