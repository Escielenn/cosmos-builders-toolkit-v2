import { useState } from "react";
import { Plus, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserPlaylists, useCreatePlaylist, useAddTrackToPlaylist } from "@/hooks/use-audio-playlists";
import { useSubscription } from "@/hooks/use-subscription";
import type { AudioTrack } from "@/lib/audio/types";

interface AddToPlaylistDialogProps {
  track: AudioTrack;
  children: React.ReactNode;
}

export default function AddToPlaylistDialog({ track, children }: AddToPlaylistDialogProps) {
  const { isSubscribed } = useSubscription();
  const { data: playlists } = useUserPlaylists();
  const createPlaylist = useCreatePlaylist();
  const addTrack = useAddTrackToPlaylist();

  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  if (!isSubscribed) return <>{children}</>;

  const handleAdd = (playlistId: string, currentTracks: AudioTrack[]) => {
    addTrack.mutate({ playlistId, track, currentTracks });
  };

  const handleCreateAndAdd = () => {
    if (!newName.trim()) return;
    createPlaylist.mutate(newName.trim(), {
      onSuccess: (playlist) => {
        addTrack.mutate({ playlistId: playlist.id, track, currentTracks: [] });
        setNewName("");
        setShowNew(false);
        setOpen(false);
      },
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <p className="text-[10px] text-t4 uppercase tracking-wider px-2 py-1 mb-1">
          Add to playlist
        </p>

        <div className="max-h-40 overflow-y-auto space-y-0.5">
          {(playlists ?? []).map((p) => {
            const alreadyIn = p.tracks.some((t) => t.id === track.id);
            return (
              <button
                key={p.id}
                type="button"
                disabled={alreadyIn}
                onClick={() => handleAdd(p.id, p.tracks)}
                className="w-full text-left px-2 py-1.5 text-xs text-t2 hover:bg-white/[0.04] transition-colors flex items-center gap-2 disabled:opacity-40"
              >
                {alreadyIn && <Check className="w-3 h-3 text-primary shrink-0" />}
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}
        </div>

        {showNew ? (
          <div className="flex items-center gap-1 mt-1.5 px-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name..."
              autoFocus
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateAndAdd();
                if (e.key === "Escape") {
                  setShowNew(false);
                  setNewName("");
                }
              }}
            />
            <Button size="sm" className="h-7 px-2" onClick={handleCreateAndAdd}>
              OK
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="w-full text-left px-2 py-1.5 text-xs text-t4 hover:text-t2 transition-colors flex items-center gap-1.5 mt-1 border-t border-white/5 pt-1.5"
          >
            <Plus className="w-3 h-3" /> New Playlist
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
