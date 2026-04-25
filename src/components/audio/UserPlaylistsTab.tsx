import { useState } from "react";
import { Plus, Trash2, ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscription } from "@/hooks/use-subscription";
import {
  useUserPlaylists,
  useCreatePlaylist,
  useDeletePlaylist,
  useRemoveTrackFromPlaylist,
} from "@/hooks/use-audio-playlists";
import type { AudioPlaylist } from "@/lib/audio/types";
import PlaylistCard from "./PlaylistCard";
import TrackRow from "./TrackRow";

export default function UserPlaylistsTab() {
  const { isSubscribed } = useSubscription();
  const { data: playlists, isLoading } = useUserPlaylists();
  const createPlaylist = useCreatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const removeTrack = useRemoveTrackFromPlaylist();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [expanded, setExpanded] = useState<AudioPlaylist | null>(null);

  if (!isSubscribed) {
    return (
      <div className="py-8 text-center space-y-2">
        <p className="text-tier-3 text-xs uppercase tracking-wider">
          Pro feature
        </p>
        <p className="text-tier-4 text-[11px]">
          Upgrade to Pro to create custom playlists.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-tier-4 text-xs uppercase tracking-wider animate-pulse">
          Loading playlists...
        </p>
      </div>
    );
  }

  // ── Expanded playlist detail ──
  if (expanded) {
    return (
      <div className="py-3">
        <button
          type="button"
          onClick={() => setExpanded(null)}
          className="text-[10px] text-tier-4 hover:text-tier-2 uppercase tracking-wider mb-3 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>

        <h3 className="font-heading text-sm font-light uppercase tracking-[2px] text-emerald mb-3">
          {expanded.name}
        </h3>

        {expanded.tracks.length === 0 ? (
          <p className="text-tier-4 text-xs py-4 text-center">
            No tracks yet. Browse curated tracks and add them to this playlist.
          </p>
        ) : (
          <div className="border border-white/8 divide-y divide-white/5">
            {expanded.tracks.map((track, i) => (
              <div key={`${track.id}-${i}`} className="flex items-center">
                <div className="flex-1">
                  <TrackRow track={track} index={i} />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    removeTrack.mutate({
                      playlistId: expanded.id,
                      trackIndex: i,
                      currentTracks: expanded.tracks,
                    })
                  }
                  className="px-2 text-tier-4 hover:text-sf-crimson transition-colors"
                  aria-label="Remove track"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Playlist list ──
  return (
    <div className="py-3 space-y-4">
      {/* Create new */}
      {showCreate ? (
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist name..."
            autoFocus
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                createPlaylist.mutate(newName.trim(), {
                  onSuccess: () => {
                    setNewName("");
                    setShowCreate(false);
                  },
                });
              }
              if (e.key === "Escape") {
                setShowCreate(false);
                setNewName("");
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => {
              if (!newName.trim()) return;
              createPlaylist.mutate(newName.trim(), {
                onSuccess: () => {
                  setNewName("");
                  setShowCreate(false);
                },
              });
            }}
            disabled={!newName.trim() || createPlaylist.isPending}
          >
            Create
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="w-3.5 h-3.5" /> New Playlist
        </Button>
      )}

      {/* Playlists grid */}
      {(playlists ?? []).length === 0 ? (
        <p className="text-tier-4 text-xs text-center py-4">
          No playlists yet. Create one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {(playlists ?? []).map((playlist) => (
            <div key={playlist.id} className="relative group">
              <PlaylistCard
                playlist={playlist}
                onSelect={setExpanded}
              />
              <button
                type="button"
                onClick={() => deletePlaylist.mutate(playlist.id)}
                className="absolute bottom-2 right-2 p-1 text-tier-4 hover:text-sf-crimson opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Delete playlist"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
