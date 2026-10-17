import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { AudioTrack, AudioPlaylist } from "@/lib/audio/types";
import type { Json, TablesUpdate } from "@/integrations/supabase/types";
import { mapError } from "@/lib/ship-voice";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
  tracks: AudioTrack[];
  created_at: string;
  updated_at: string;
}

/** AudioTrack is a plain JSON-serialisable record; the column is typed Json. */
function tracksToJson(tracks: AudioTrack[]): Json {
  return tracks as unknown as Json;
}

function rowToPlaylist(row: PlaylistRow): AudioPlaylist {
  return {
    id: row.id,
    name: row.name,
    tracks: Array.isArray(row.tracks) ? row.tracks : [],
    source: "user",
  };
}

// ---------------------------------------------------------------------------
// Query: all user playlists
// ---------------------------------------------------------------------------

export function useUserPlaylists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-playlists", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data ?? []) as unknown as PlaylistRow[]).map(rowToPlaylist);
    },
    enabled: !!user,
  });
}

// ---------------------------------------------------------------------------
// Mutation: create playlist
// ---------------------------------------------------------------------------

export function useCreatePlaylist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_playlists")
        .insert({ user_id: user.id, name })
        .select()
        .single();

      if (error) throw error;
      return rowToPlaylist(data as unknown as PlaylistRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    },
    onError: (err) => {
      toast({
        title: "PLAYLIST CREATION FAILED.",
        description: mapError(err),
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: update playlist (rename or reorder tracks)
// ---------------------------------------------------------------------------

export function useUpdatePlaylist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      tracks,
    }: {
      id: string;
      name?: string;
      tracks?: AudioTrack[];
    }) => {
      const updates: TablesUpdate<"user_playlists"> = {};
      if (name !== undefined) updates.name = name;
      if (tracks !== undefined) updates.tracks = tracksToJson(tracks);

      const { error } = await supabase
        .from("user_playlists")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    },
    onError: (err) => {
      toast({
        title: "UPDATE FAILED.",
        description: mapError(err),
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: delete playlist
// ---------------------------------------------------------------------------

export function useDeletePlaylist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("user_playlists")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    },
    onError: (err) => {
      toast({
        title: "DELETE FAILED.",
        description: mapError(err),
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: add track to playlist
// ---------------------------------------------------------------------------

export function useAddTrackToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      track,
      currentTracks,
    }: {
      playlistId: string;
      track: AudioTrack;
      currentTracks: AudioTrack[];
    }) => {
      // Prevent duplicates
      if (currentTracks.some((t) => t.id === track.id)) return;
      if (currentTracks.length >= 100) throw new Error("Playlist track limit reached (100)");

      const updated = [...currentTracks, track];
      const { error } = await supabase
        .from("user_playlists")
        .update({ tracks: tracksToJson(updated) })
        .eq("id", playlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: remove track from playlist
// ---------------------------------------------------------------------------

export function useRemoveTrackFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      trackIndex,
      currentTracks,
    }: {
      playlistId: string;
      trackIndex: number;
      currentTracks: AudioTrack[];
    }) => {
      const updated = currentTracks.filter((_, i) => i !== trackIndex);
      const { error } = await supabase
        .from("user_playlists")
        .update({ tracks: tracksToJson(updated) })
        .eq("id", playlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-playlists"] });
    },
  });
}
