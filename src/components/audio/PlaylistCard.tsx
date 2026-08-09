import { Play, Music } from "lucide-react";
import { useAudioPlayer, useAudioControls } from "@/hooks/use-audio-player";
import type { AudioPlaylist } from "@/lib/audio/types";

interface PlaylistCardProps {
  playlist: AudioPlaylist;
  onSelect?: (playlist: AudioPlaylist) => void;
}

export default function PlaylistCard({ playlist, onSelect }: PlaylistCardProps) {
  const { currentPlaylist, status } = useAudioPlayer();
  const { loadPlaylist } = useAudioControls();

  const isActive = currentPlaylist?.id === playlist.id;
  const isPlaying = isActive && status === "playing";

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    loadPlaylist(playlist);
  };

  return (
    <button
      type="button"
      onClick={() => onSelect?.(playlist)}
      className={`group relative text-left w-full p-3 border transition-colors ${
        isActive
          ? "bg-primary/[0.06] border-primary/20"
          : "bg-white/[0.02] border-white/8 hover:border-white/15 hover:bg-white/[0.04]"
      }`}
    >
      {/* Icon */}
      <div className="flex items-center gap-2 mb-1.5">
        <Music className={`w-4 h-4 ${isActive ? "text-primary" : "text-t4"}`} />
        <span
          className={`text-sm font-medium truncate ${
            isActive ? "text-primary" : "text-t2"
          }`}
        >
          {playlist.name}
        </span>
      </div>

      {/* Meta */}
      <p className="text-[12px] text-t4 font-mono uppercase tracking-wider">
        {playlist.tracks.length} {playlist.tracks.length === 1 ? "track" : "tracks"}
      </p>

      {/* Play button (on hover) */}
      <button
        type="button"
        onClick={handlePlay}
        className={`absolute top-2 right-2 p-1.5 transition-all ${
          isPlaying
            ? "text-primary opacity-100"
            : "text-t3 opacity-0 group-hover:opacity-100 hover:text-primary"
        }`}
        aria-label={`Play ${playlist.name}`}
      >
        <Play className="w-4 h-4" />
      </button>
    </button>
  );
}
