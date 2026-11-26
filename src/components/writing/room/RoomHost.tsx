// ---------------------------------------------------------------------------
// RoomHost, the part of the writing room that must not unmount.
//
// The Manuscript mounts the tools in the bar (hidden in focus mode), in the
// phone menu (mounted only while it is open) and in the status bar. Panels,
// the assistant's engine and the embedded music player have to outlive all
// of that, so each mount offers a host slot and exactly one wins
// (room-store.hosts, best rank first). The status bar's slot ranks first:
// it is the one mount that is always there.
//
// Everything rendered here is a portal or an effect; the slot itself draws
// nothing where it stands.
// ---------------------------------------------------------------------------

import { Suspense, lazy, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Minus, Music, Square } from "lucide-react";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import {
  registerHost,
  setPlayerMinimized,
  setRoomContext,
  stopPlaylist,
  useRoom,
} from "@/lib/writing/room-store";
import {
  configureAssistant,
  setAssistantLexicon,
  startAssistant,
  stopAssistant,
  syncAssistantEditor,
} from "@/lib/writing/assistant/controller";
import { useWorldLexicon } from "@/components/writing/room/use-world-lexicon";
import "./room.css";

const AssistantPanel = lazy(() => import("@/components/writing/room/AssistantPanel"));
const MusicPanel = lazy(() => import("@/components/writing/room/MusicPanel"));

export interface RoomHostSlotProps {
  worldId: string | null;
  documentId: string | null;
  /** Lower wins. */
  rank: number;
}

/** Offer to host; render the host if this slot is the one chosen. */
export function RoomHostSlot({ worldId, documentId, rank }: RoomHostSlotProps): JSX.Element | null {
  const id = useId();
  const hosting = useRoom((s) => s.hosts[0]?.id === id);
  useEffect(() => registerHost(id, rank), [id, rank]);
  useEffect(() => {
    if (hosting) setRoomContext(worldId, documentId);
  }, [hosting, worldId, documentId]);
  return hosting ? <RoomHost worldId={worldId} documentId={documentId} /> : null;
}

function RoomHost({ worldId, documentId }: { worldId: string | null; documentId: string | null }): JSX.Element {
  const enabled = useRoom((s) => s.assistant.settings.enabled);
  const panel = useRoom((s) => s.panel);
  return (
    <>
      {(enabled || panel === "assistant") && (
        <AssistantRuntime worldId={worldId} documentId={documentId} enabled={enabled} open={panel === "assistant"} />
      )}
      {panel === "music" && (
        <Suspense fallback={null}>
          <MusicPanel />
        </Suspense>
      )}
      <MusicDock />
    </>
  );
}

// ---------------------------------------------------------------------------
// Assistant: lexicon in, engine follows the open editor
// ---------------------------------------------------------------------------

/** How often the engine is pointed at the open editor (an identity check). */
const EDITOR_POLL_MS = 400;

function AssistantRuntime({
  worldId,
  documentId,
  enabled,
  open,
}: {
  worldId: string | null;
  documentId: string | null;
  enabled: boolean;
  open: boolean;
}): JSX.Element | null {
  const world = useWorldLexicon(worldId);
  const dialect = useRoom((s) => s.assistant.settings.dialect);
  const auto = useRoom((s) => s.assistant.settings.auto);
  const { lexicon } = world;

  useEffect(() => {
    setAssistantLexicon(lexicon);
  }, [lexicon]);
  useEffect(() => () => setAssistantLexicon(null), []);

  // On: load the engine and keep it on the open document's editor. The
  // Manuscript swaps editors on a document switch and has none in Board or
  // Outline view, so the binding is re-checked on a slow tick.
  // Off, or the Manuscript unmounts: the worker is terminated.
  useEffect(() => {
    if (!enabled) return;
    void startAssistant();
    const tick = setInterval(() => syncAssistantEditor(), EDITOR_POLL_MS);
    return () => {
      clearInterval(tick);
      stopAssistant();
    };
  }, [enabled]);

  useEffect(() => {
    syncAssistantEditor();
  }, [documentId]);

  useEffect(() => {
    configureAssistant({ dialect, auto });
  }, [dialect, auto]);

  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <AssistantPanel worldId={worldId} world={world} />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// The embedded player for a pasted playlist
// ---------------------------------------------------------------------------

function MusicDock(): JSX.Element | null {
  const music = useRoom((s) => s.music);
  const panel = useRoom((s) => s.panel);
  const { hasEverLoaded, minimized: shipBarMinimized } = useAudioPlayer();
  const current = music.current;
  if (!current || typeof document === "undefined") return null;

  // Clear the ship's own player bar when it is on screen (the same lift the
  // help button does), and stand left of an open panel instead of under it.
  const bottom = hasEverLoaded ? (shipBarMinimized ? 84 : 132) : 44;
  const hidden = music.minimized;

  return createPortal(
    <aside
      aria-label="Playlist player"
      aria-hidden={hidden}
      style={{ bottom: `calc(${bottom}px + env(safe-area-inset-bottom))` }}
      className={
        hidden
          ? // Tucked away, still mounted: the music keeps playing.
            "pointer-events-none fixed left-0 h-0 w-0 overflow-hidden"
          : `fixed inset-x-2 z-40 border border-sf-line bg-sf-surface-elevated/95 shadow-lg backdrop-blur-sf-panel sm:left-auto sm:w-[340px] ${
              panel ? "max-sm:pointer-events-none max-sm:h-0 max-sm:overflow-hidden max-sm:border-0 sm:right-[424px]" : "sm:right-3"
            }`
      }
    >
      <div className="flex items-center gap-2 border-b border-sf-line-hairline pl-3">
        <Music className="h-3.5 w-3.5 shrink-0 text-sf-primary" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate font-sans text-[13px] text-t1">{current.name}</p>
        <button
          type="button"
          tabIndex={hidden ? -1 : 0}
          aria-label="Hide the player and keep listening"
          title="Hide the player and keep listening"
          onClick={() => setPlayerMinimized(true)}
          className="flex min-h-hit min-w-hit items-center justify-center text-t3 transition-colors duration-fast hover:text-t1"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          tabIndex={hidden ? -1 : 0}
          aria-label="Stop and unload the playlist"
          title="Stop and unload the playlist"
          onClick={stopPlaylist}
          className="flex min-h-hit min-w-hit items-center justify-center text-t3 transition-colors duration-fast hover:text-sf-crimson-text"
        >
          <Square className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <iframe
        key={current.embed}
        title={`${current.provider} playlist: ${current.name}`}
        src={current.embed}
        height={current.provider === "Spotify" ? 232 : 200}
        tabIndex={hidden ? -1 : 0}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        className="block w-full border-0 bg-sf-void"
      />
      <a
        href={current.url}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={hidden ? -1 : 0}
        className="flex min-h-hit items-center gap-1.5 border-t border-sf-line-hairline px-3 font-sans text-[12px] font-medium uppercase text-t3 transition-colors duration-fast hover:text-sf-primary-text"
      >
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        Open in {current.provider}
      </a>
    </aside>,
    document.body,
  );
}
