import { useCallback, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronUp,
  ChevronDown,
  Music,
  ListMusic,
  AlertTriangle,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer, useAudioControls } from "@/hooks/use-audio-player";
import { OPEN_AUDIO_SELECTOR_EVENT } from "./AudioSelectorDialog";

function openAudioSelector() {
  window.dispatchEvent(new Event(OPEN_AUDIO_SELECTOR_EVENT));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// AudioPlayer — persistent bottom bar
// ---------------------------------------------------------------------------

export default function AudioPlayer() {
  const state = useAudioPlayer();
  const controls = useAudioControls();
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Don't render anything until a track has been loaded at least once
  if (!state.hasEverLoaded) return null;

  const isPlaying = state.status === "playing";
  const isLoading = state.status === "loading";
  const isError = state.status === "error";

  return state.minimized ? (
    <MinimizedBar
      trackTitle={state.currentTrack?.title ?? "No Track"}
      isPlaying={isPlaying}
      isLoading={isLoading}
      isError={isError}
      progress={state.progress}
      duration={state.duration}
      onTogglePlay={controls.togglePlayPause}
      onExpand={() => controls.setMinimized(false)}
    />
  ) : (
    <ExpandedBar
      state={state}
      controls={controls}
      progressBarRef={progressBarRef}
    />
  );
}

// ---------------------------------------------------------------------------
// Minimized bar (~40px)
// ---------------------------------------------------------------------------

interface MinimizedBarProps {
  trackTitle: string;
  isPlaying: boolean;
  isLoading: boolean;
  isError: boolean;
  progress: number;
  duration: number;
  onTogglePlay: () => void;
  onExpand: () => void;
}

function MinimizedBar({
  trackTitle,
  isPlaying,
  isLoading,
  isError,
  progress,
  duration,
  onTogglePlay,
  onExpand,
}: MinimizedBarProps) {
  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed bottom-6 inset-x-0 z-[8999] bg-sf-surface/95 backdrop-blur-xl border-t border-white/8">
      {/* Thin progress line at very top */}
      <div className="h-[2px] bg-white/5">
        <div
          className="h-full bg-primary/60 transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 h-10">
        {isError ? (
          <AlertTriangle className="w-3.5 h-3.5 text-sf-amber/70 shrink-0" />
        ) : (
          <Music className="w-3.5 h-3.5 text-primary/50 shrink-0" />
        )}

        <span className="text-xs text-t2 truncate flex-1">
          {isError ? (
            <span className="text-t4">{trackTitle} <span className="text-sf-amber/60">— Unavailable</span></span>
          ) : (
            trackTitle
          )}
        </span>

        <button
          type="button"
          onClick={onTogglePlay}
          disabled={isLoading || isError}
          className="p-1.5 text-t2 hover:text-primary transition-colors disabled:opacity-30"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={openAudioSelector}
          className="p-1.5 text-t4 hover:text-t2 transition-colors"
          aria-label="Browse tracks"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onExpand}
          className="p-1.5 text-t4 hover:text-t2 transition-colors"
          aria-label="Expand player"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded bar (~80px)
// ---------------------------------------------------------------------------

interface ExpandedBarProps {
  state: ReturnType<typeof useAudioPlayer>;
  controls: ReturnType<typeof useAudioControls>;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
}

function ExpandedBar({ state, controls, progressBarRef }: ExpandedBarProps) {
  const isPlaying = state.status === "playing";
  const isLoading = state.status === "loading";
  const isError = state.status === "error";

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current;
      if (!bar || state.duration <= 0) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      controls.seek(pct * state.duration);
    },
    [controls, state.duration, progressBarRef]
  );

  const cycleRepeat = useCallback(() => {
    const modes: Array<"none" | "all" | "one"> = ["none", "all", "one"];
    const idx = modes.indexOf(state.repeat);
    controls.setRepeat(modes[(idx + 1) % modes.length]);
  }, [state.repeat, controls]);

  const pct = state.duration > 0 ? (state.progress / state.duration) * 100 : 0;

  return (
    <div className="fixed bottom-6 inset-x-0 z-[8999] bg-sf-surface/95 backdrop-blur-xl border-t border-white/8">
      {/* Progress bar — clickable */}
      <div
        ref={progressBarRef}
        onClick={handleProgressClick}
        className="h-1 bg-white/5 cursor-pointer group"
        role="slider"
        aria-label="Track progress"
        aria-valuenow={Math.round(state.progress)}
        aria-valuemin={0}
        aria-valuemax={Math.round(state.duration)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") controls.seek(Math.min(state.duration, state.progress + 5));
          if (e.key === "ArrowLeft") controls.seek(Math.max(0, state.progress - 5));
        }}
      >
        <div
          className="h-full bg-primary/70 group-hover:bg-primary transition-colors relative"
          style={{ width: `${pct}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-[1px] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-2">
        {/* Track info (left) */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={openAudioSelector}
            className="p-1 text-primary/50 hover:text-primary transition-colors shrink-0"
            aria-label="Browse tracks"
          >
            <ListMusic className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-t2 truncate leading-tight flex items-center gap-1.5">
              {isError && <AlertTriangle className="w-3 h-3 text-sf-amber/70 shrink-0" />}
              {state.currentTrack?.title ?? "No Track"}
              {isError && <span className="text-[10px] text-sf-amber/60 shrink-0">— Unavailable</span>}
            </p>
            {state.currentTrack?.artist && !isError && (
              <p className="text-[10px] text-t4 truncate leading-tight">
                {state.currentTrack.artist}
              </p>
            )}
            {isError && (
              <p className="text-[10px] text-t4 truncate leading-tight">
                Audio file could not be loaded
              </p>
            )}
          </div>
        </div>

        {/* Transport controls (center) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={controls.toggleShuffle}
            className={`p-2 transition-colors ${
              state.shuffle ? "text-primary" : "text-t4 hover:text-t2"
            }`}
            aria-label="Toggle shuffle"
            aria-pressed={state.shuffle}
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={controls.prev}
            className="p-2 text-t3 hover:text-t1 transition-colors"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={controls.togglePlayPause}
            disabled={isLoading || isError}
            className="p-2 w-10 h-10 flex items-center justify-center bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4.5 h-4.5" />
            ) : (
              <Play className="w-4.5 h-4.5 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={controls.next}
            className="p-2 text-t3 hover:text-t1 transition-colors"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={cycleRepeat}
            className={`p-2 transition-colors ${
              state.repeat !== "none" ? "text-primary" : "text-t4 hover:text-t2"
            }`}
            aria-label={`Repeat: ${state.repeat}`}
          >
            {state.repeat === "one" ? (
              <Repeat1 className="w-3.5 h-3.5" />
            ) : (
              <Repeat className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Time + Volume (right) */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          <span className="font-mono text-[10px] text-t4 tabular-nums whitespace-nowrap hidden sm:inline">
            {formatTime(state.progress)} / {formatTime(state.duration)}
          </span>

          <button
            type="button"
            onClick={controls.toggleMute}
            className="p-1.5 text-t4 hover:text-t2 transition-colors"
            aria-label={state.muted ? "Unmute" : "Mute"}
          >
            {state.muted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          <div className="w-20 hidden sm:block">
            <Slider
              value={[state.muted ? 0 : state.volume]}
              max={1}
              step={0.01}
              onValueChange={([v]) => controls.setVolume(v)}
              aria-label="Volume"
              className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
            />
          </div>

          <button
            type="button"
            onClick={() => controls.setMinimized(true)}
            className="p-1.5 text-t4 hover:text-t2 transition-colors"
            aria-label="Minimize player"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
