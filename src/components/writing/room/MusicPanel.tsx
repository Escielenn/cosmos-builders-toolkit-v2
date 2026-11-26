// ---------------------------------------------------------------------------
// MusicPanel, writing music from the bar.
//
// Two sources, one panel:
//   SHIP AUDIO     the product's own player (use-audio-player): play/pause,
//                  skip, volume, and a playlist to queue. Same player the
//                  Display menu drives; this is a second handle on it.
//   YOUR PLAYLIST  a pasted Spotify or YouTube playlist link, loaded into an
//                  embedded player (MusicDock) that can be tucked away while
//                  it plays. Nothing starts on its own. Links are kept on
//                  this device.
//
// Lazy: loads when the panel is first opened.
// ---------------------------------------------------------------------------

import { useState } from "react";
import { ExternalLink, Library, Pause, Play, SkipBack, SkipForward, Square, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAudioControls, useAudioPlayer } from "@/hooks/use-audio-player";
import { useAllPlaylists } from "@/hooks/use-entity-audio";
import { OPEN_AUDIO_SELECTOR_EVENT } from "@/components/audio/audio-events";
import { ACTION_PRIMARY, ACTION_QUIET } from "@/components/writing/action-classes";
import { RoomPanel, PanelSection } from "@/components/writing/room/RoomPanel";
import {
  closePanel,
  forgetPlaylist,
  loadPlaylist,
  setPlayerMinimized,
  stopPlaylist,
  useRoom,
} from "@/lib/writing/room-store";
import { MAX_PLAYLIST_NAME, parsePlaylistLink } from "@/lib/writing/music";

const ICON_BUTTON =
  "flex min-h-hit min-w-hit items-center justify-center border border-sf-line text-t2 transition-colors duration-fast hover:border-sf-line-emphasis hover:text-t1 disabled:border-sf-disabled-line disabled:bg-sf-disabled-bg disabled:text-sf-disabled-text";

function ShipAudio(): JSX.Element {
  const player = useAudioPlayer();
  const controls = useAudioControls();
  const playlists = useAllPlaylists();
  const playing = player.status === "playing";
  const track = player.currentTrack;
  const volume = Math.round((player.muted ? 0 : player.volume) * 100);

  return (
    <PanelSection title="Ship audio">
      <p className="truncate font-sans text-[14px] text-t1" aria-live="polite">
        {track ? track.title : "No track loaded"}
        {track?.artist && <span className="text-t3"> · {track.artist}</span>}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" aria-label="Previous track" disabled={!track} onClick={controls.prev} className={ICON_BUTTON}>
          <SkipBack className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          disabled={!track}
          onClick={controls.togglePlayPause}
          className={`${ICON_BUTTON} ${playing ? "border-sf-primary text-sf-primary-text" : ""}`}
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
        </button>
        <button type="button" aria-label="Next track" disabled={!track} onClick={controls.next} className={ICON_BUTTON}>
          <SkipForward className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="ml-1 font-mono text-[12px] uppercase text-t4">
          {player.status === "error" ? "// TRACK UNAVAILABLE" : player.status === "loading" ? "LOADING" : playing ? "PLAYING" : track ? "PAUSED" : "IDLE"}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Label htmlFor="sf-room-volume" className="shrink-0">
          Volume
        </Label>
        <Slider
          id="sf-room-volume"
          aria-label="Volume"
          min={0}
          max={100}
          step={1}
          value={[volume]}
          onValueChange={([v]) => controls.setVolume(v / 100)}
          className="min-h-hit flex-1"
        />
        <span className="w-10 shrink-0 text-right font-mono text-[12px] text-t1">{volume}%</span>
      </div>
      <div className="mt-2">
        <Label htmlFor="sf-room-playlist">Playlist</Label>
        <div className="mt-1 flex gap-2">
          <Select
            value={player.currentPlaylist?.id ?? ""}
            onValueChange={(id) => {
              const pl = playlists.find((p) => p.id === id);
              // Queued, not started: the writer presses play.
              if (pl) controls.queuePlaylist(pl);
            }}
          >
            <SelectTrigger id="sf-room-playlist" className="min-h-hit min-w-0 flex-1 rounded-none">
              <SelectValue placeholder="Choose a playlist" />
            </SelectTrigger>
            <SelectContent>
              {playlists.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => {
              closePanel();
              window.dispatchEvent(new Event(OPEN_AUDIO_SELECTOR_EVENT));
            }}
            className={ACTION_QUIET}
          >
            <Library className="h-3.5 w-3.5" aria-hidden="true" />
            Library
          </button>
        </div>
      </div>
    </PanelSection>
  );
}

function OwnPlaylist(): JSX.Element {
  const music = useRoom((s) => s.music);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  const current = music.current;

  const load = (link: string, label: string) => {
    const r = loadPlaylist(link, label);
    setError(!r.ok);
    if (r.ok) {
      setUrl("");
      setName("");
    }
  };

  return (
    <PanelSection title="Your playlist">
      {current && (
        <div className="mb-3 border border-sf-line bg-sf-surface p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="min-w-0 truncate font-sans text-[14px] font-medium text-t1">{current.name}</p>
            <span className="shrink-0 font-mono text-[12px] uppercase text-t4">{current.provider} · LOADED</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => setPlayerMinimized(!music.minimized)} className={ACTION_PRIMARY}>
              {music.minimized ? "Show player" : "Hide player"}
            </button>
            <button type="button" onClick={stopPlaylist} className={ACTION_QUIET}>
              <Square className="h-3.5 w-3.5" aria-hidden="true" />
              Stop
            </button>
            <a href={current.url} target="_blank" rel="noopener noreferrer" className={ACTION_QUIET}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              Open in {current.provider}
            </a>
          </div>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load(url, name);
        }}
        className="space-y-2"
      >
        <div>
          <Label htmlFor="sf-room-playlist-url">Spotify or YouTube playlist link</Label>
          <Input
            id="sf-room-playlist-url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(false);
            }}
            placeholder="https://open.spotify.com/playlist/…"
            className="mt-1"
            autoComplete="off"
            aria-invalid={error}
            aria-describedby={error ? "sf-room-playlist-error" : undefined}
          />
        </div>
        <div>
          <Label htmlFor="sf-room-playlist-name">Name (optional)</Label>
          <Input
            id="sf-room-playlist-name"
            value={name}
            maxLength={MAX_PLAYLIST_NAME}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
            autoComplete="off"
          />
        </div>
        {error && (
          <p id="sf-room-playlist-error" role="alert" className="font-mono text-[12px] uppercase leading-snug text-sf-crimson-text">
            {"// LINK NOT RECOGNISED. PASTE A SPOTIFY PLAYLIST LINK, OR A YOUTUBE LINK WITH LIST=."}
          </p>
        )}
        <button type="submit" disabled={!url.trim()} className={ACTION_PRIMARY}>
          Load playlist
        </button>
      </form>

      {music.saved.length > 0 && (
        <div className="mt-4">
          <h4 className="font-sans text-[12px] font-medium uppercase text-t3">Saved on this device</h4>
          <ul className="mt-1">
            {music.saved.map((item) => {
              const provider = parsePlaylistLink(item.url)?.provider ?? "";
              return (
                <li key={item.url} className="flex items-center gap-1 border-b border-sf-line-hairline last:border-b-0">
                  <button
                    type="button"
                    onClick={() => load(item.url, item.name)}
                    className="flex min-h-hit min-w-0 flex-1 items-center justify-between gap-2 text-left font-sans text-[14px] text-t2 transition-colors duration-fast hover:text-t1"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="shrink-0 font-mono text-[12px] uppercase text-t4">{provider}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => forgetPlaylist(item.url)}
                    className="flex min-h-hit min-w-hit items-center justify-center text-t3 transition-colors duration-fast hover:text-sf-crimson-text"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="mt-3 font-sans text-[12px] leading-snug text-t3">
        Loading a playlist contacts Spotify or YouTube. Nothing plays until you press play in the player; hide it to
        keep listening while you write. Spotify may offer previews unless you are signed in there.
      </p>
    </PanelSection>
  );
}

export default function MusicPanel(): JSX.Element {
  return (
    <RoomPanel title="Writing music">
      <ShipAudio />
      <OwnPlaylist />
    </RoomPanel>
  );
}
