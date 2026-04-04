import { useState, useEffect } from "react";
import { Music } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CURATED_PLAYLISTS } from "@/lib/audio/curated-playlists";
import type { AudioPlaylist } from "@/lib/audio/types";
import PlaylistCard from "./PlaylistCard";
import TrackRow from "./TrackRow";
import UserPlaylistsTab from "./UserPlaylistsTab";
import UploadTab from "./UploadTab";

// ---------------------------------------------------------------------------
// Tabs (expandable in Phases 3 + 4)
// ---------------------------------------------------------------------------

type Tab = "curated" | "playlists" | "upload";

const TABS: { id: Tab; label: string; pro?: boolean }[] = [
  { id: "curated", label: "Curated" },
  { id: "playlists", label: "My Playlists", pro: true },
  { id: "upload", label: "Upload", pro: true },
];

// ---------------------------------------------------------------------------
// AudioSelectorDialog
// ---------------------------------------------------------------------------

/** Open the audio selector from anywhere (e.g. the player bar). */
export const OPEN_AUDIO_SELECTOR_EVENT = "sf:open-audio-selector";

export default function AudioSelectorDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("curated");
  const [expandedPlaylist, setExpandedPlaylist] = useState<AudioPlaylist | null>(null);

  // Listen for external open requests (from AudioPlayer, etc.)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(OPEN_AUDIO_SELECTOR_EVENT, handler);
    return () => window.removeEventListener(OPEN_AUDIO_SELECTOR_EVENT, handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
          aria-label="Open audio selector"
        >
          <Music className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-wider">
            AUDIO
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/8 -mx-6 px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setExpandedPlaylist(null);
              }}
              className={`px-3 py-2 text-[11px] font-medium uppercase tracking-[1.5px] transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-tier-4 hover:text-tier-2"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {activeTab === "curated" && (
            <CuratedTab
              expandedPlaylist={expandedPlaylist}
              onExpandPlaylist={setExpandedPlaylist}
            />
          )}

          {activeTab === "playlists" && <UserPlaylistsTab />}

          {activeTab === "upload" && <UploadTab />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Curated tab
// ---------------------------------------------------------------------------

interface CuratedTabProps {
  expandedPlaylist: AudioPlaylist | null;
  onExpandPlaylist: (p: AudioPlaylist | null) => void;
}

function CuratedTab({ expandedPlaylist, onExpandPlaylist }: CuratedTabProps) {
  if (expandedPlaylist) {
    return (
      <div className="py-3">
        <button
          type="button"
          onClick={() => onExpandPlaylist(null)}
          className="text-[10px] text-tier-4 hover:text-tier-2 uppercase tracking-wider mb-3 transition-colors"
        >
          &larr; Back to playlists
        </button>

        <h3 className="font-heading text-sm font-light uppercase tracking-[2px] text-emerald mb-3">
          {expandedPlaylist.name}
        </h3>

        <div className="border border-white/8 divide-y divide-white/5">
          {expandedPlaylist.tracks.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} showAddButton />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 space-y-4">
      <p className="text-[10px] text-tier-4 uppercase tracking-[1.5px]">
        Ambient playlists
      </p>

      <div className="grid grid-cols-2 gap-2">
        {CURATED_PLAYLISTS.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            onSelect={onExpandPlaylist}
          />
        ))}
      </div>
    </div>
  );
}
