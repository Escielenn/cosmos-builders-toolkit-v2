import { Play, Pause, ListPlus } from "lucide-react";
import { useAudioPlayer, useAudioControls } from "@/hooks/use-audio-player";
import type { AudioTrack } from "@/lib/audio/types";
import AddToPlaylistDialog from "./AddToPlaylistDialog";

interface TrackRowProps {
  track: AudioTrack;
  index?: number;
  showAddButton?: boolean;
}

export default function TrackRow({
  track,
  index,
  showAddButton = false,
}: TrackRowProps) {
  const { currentTrack, status } = useAudioPlayer();
  const { play, pause } = useAudioControls();

  const isThis = currentTrack?.id === track.id;
  const isPlaying = isThis && status === "playing";

  return (
    <div
      className={`group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-white/[0.03] ${
        isThis ? "bg-primary/[0.04]" : ""
      }`}
    >
      {/* Index / play indicator */}
      <div className="w-6 text-right shrink-0">
        {isThis ? (
          <button
            type="button"
            onClick={() => (isPlaying ? pause() : play(track))}
            className="text-primary"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => play(track)}
            className="text-t4 group-hover:text-t2 transition-colors"
            aria-label={`Play ${track.title}`}
          >
            <span className="group-hover:hidden font-mono text-[10px]">
              {index != null ? index + 1 : "-"}
            </span>
            <Play className="w-3.5 h-3.5 hidden group-hover:block" />
          </button>
        )}
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm truncate leading-tight ${
            isThis ? "text-primary" : "text-t2"
          }`}
        >
          {track.title}
        </p>
        {track.artist && (
          <p className="text-[10px] text-t4 truncate leading-tight">
            {track.artist}
          </p>
        )}
      </div>

      {/* Duration (if known) */}
      {track.duration != null && track.duration > 0 && (
        <span className="font-mono text-[10px] text-t4 tabular-nums shrink-0">
          {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, "0")}
        </span>
      )}

      {/* Add to playlist */}
      {showAddButton && (
        <AddToPlaylistDialog track={track}>
          <button
            type="button"
            className="p-1 text-t4 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Add to playlist"
          >
            <ListPlus className="w-3.5 h-3.5" />
          </button>
        </AddToPlaylistDialog>
      )}
    </div>
  );
}
