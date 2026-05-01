import { useMemo } from "react";
import { useWorld, type WorldTheme } from "@/hooks/use-world";
import { useWorlds } from "@/hooks/use-worlds";
import { useAudioControls } from "@/hooks/use-audio-player";
import { useUserPlaylists } from "@/hooks/use-audio-playlists";
import { findCuratedPlaylist, CURATED_PLAYLISTS } from "@/lib/audio/curated-playlists";
import type { AudioPlaylist } from "@/lib/audio/types";

// ---------------------------------------------------------------------------
// World soundtrack, reads/writes worlds.theme.soundtrack_playlist_id
// ---------------------------------------------------------------------------

export function useWorldSoundtrack(worldId: string | undefined) {
  const { data: world } = useWorld(worldId);
  const { data: userPlaylists } = useUserPlaylists();
  const { queuePlaylist } = useAudioControls();

  const playlistId = (world?.theme as WorldTheme)?.soundtrack_playlist_id ?? null;

  // Resolve the playlist object from the ID
  const playlist = useMemo<AudioPlaylist | null>(() => {
    if (!playlistId) return null;
    // Check curated first
    const curated = findCuratedPlaylist(playlistId);
    if (curated) return curated;
    // Check user playlists
    return (userPlaylists ?? []).find((p) => p.id === playlistId) ?? null;
  }, [playlistId, userPlaylists]);

  const queueWorldSoundtrack = () => {
    if (playlist) queuePlaylist(playlist);
  };

  return { playlistId, playlist, queueWorldSoundtrack };
}

export function useSetWorldSoundtrack(worldId: string | undefined) {
  const { updateWorld } = useWorlds();
  const { data: world } = useWorld(worldId);

  const setSoundtrack = async (playlistId: string | null) => {
    if (!worldId) return;
    const currentTheme = (world?.theme ?? {}) as WorldTheme;
    const theme: WorldTheme = {
      ...currentTheme,
      soundtrack_playlist_id: playlistId ?? undefined,
    };
    await updateWorld.mutateAsync({ worldId, theme });
  };

  return { setSoundtrack, isPending: updateWorld.isPending };
}

// ---------------------------------------------------------------------------
// All available playlists (curated + user) for pickers
// ---------------------------------------------------------------------------

export function useAllPlaylists(): AudioPlaylist[] {
  const { data: userPlaylists } = useUserPlaylists();
  return useMemo(
    () => [...CURATED_PLAYLISTS, ...(userPlaylists ?? [])],
    [userPlaylists]
  );
}
