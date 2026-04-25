import { Music, X } from "lucide-react";
import { useAllPlaylists } from "@/hooks/use-entity-audio";
import type { AudioPlaylist } from "@/lib/audio/types";

interface SoundtrackPickerProps {
  value: string | null;
  onChange: (playlistId: string | null) => void;
}

export default function SoundtrackPicker({ value, onChange }: SoundtrackPickerProps) {
  const allPlaylists = useAllPlaylists();

  const selected = value ? allPlaylists.find((p) => p.id === value) : null;

  return (
    <div className="space-y-2">
      {selected ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/[0.06] border border-primary/15">
          <Music className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-sm text-t2 flex-1 truncate">
            {selected.name}
          </span>
          <span className="font-mono text-[9px] text-t4">
            {selected.tracks.length} tracks
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-0.5 text-t4 hover:text-t2 transition-colors"
            aria-label="Remove soundtrack"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-t4">No soundtrack set</p>
      )}

      {/* Playlist picker */}
      <div className="max-h-32 overflow-y-auto border border-white/8 divide-y divide-white/5">
        {allPlaylists.map((p) => (
          <PlaylistOption
            key={p.id}
            playlist={p}
            isSelected={p.id === value}
            onSelect={() => onChange(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PlaylistOption({
  playlist,
  isSelected,
  onSelect,
}: {
  playlist: AudioPlaylist;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors ${
        isSelected
          ? "bg-primary/[0.06] text-primary"
          : "hover:bg-white/[0.03] text-t3"
      }`}
    >
      <Music className="w-3 h-3 shrink-0" />
      <span className="text-xs truncate flex-1">{playlist.name}</span>
      <span className="font-mono text-[9px] text-t5">
        {playlist.source === "curated" ? "CURATED" : "CUSTOM"}
      </span>
    </button>
  );
}
