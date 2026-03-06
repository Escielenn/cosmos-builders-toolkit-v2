import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { AudioTrack } from "@/lib/audio/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
];
const ACCEPTED_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a", ".aac"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AudioTrackRow {
  id: string;
  user_id: string;
  title: string;
  artist: string | null;
  filename: string;
  storage_path: string;
  url: string;
  duration_seconds: number | null;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
}

function rowToTrack(row: AudioTrackRow): AudioTrack {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist ?? undefined,
    url: row.url,
    duration: row.duration_seconds ?? undefined,
    source: "upload",
  };
}

// ---------------------------------------------------------------------------
// Extract duration from file using temporary Audio element
// ---------------------------------------------------------------------------

function extractDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";

    const cleanup = () => {
      URL.revokeObjectURL(url);
      audio.src = "";
    };

    audio.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(audio.duration) ? Math.round(audio.duration) : null;
      cleanup();
      resolve(duration);
    });

    audio.addEventListener("error", () => {
      cleanup();
      resolve(null);
    });

    // Timeout after 10s
    setTimeout(() => {
      cleanup();
      resolve(null);
    }, 10_000);

    audio.src = url;
  });
}

// ---------------------------------------------------------------------------
// Query: user's uploaded tracks
// ---------------------------------------------------------------------------

export function useUserAudioTracks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-audio-tracks", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_audio_tracks" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data ?? []) as unknown as AudioTrackRow[]).map(rowToTrack);
    },
    enabled: !!user,
  });
}

// ---------------------------------------------------------------------------
// Mutation: upload audio track
// ---------------------------------------------------------------------------

export function useUploadAudioTrack() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title?: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
      }

      // Validate MIME type
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !ACCEPTED_EXTENSIONS.includes(`.${ext}`)) {
          throw new Error("Unsupported audio format. Use MP3, WAV, OGG, or M4A.");
        }
      }

      // Extract duration
      const durationSeconds = await extractDuration(file);

      // Upload to Supabase Storage
      const ext = file.name.split(".").pop() ?? "mp3";
      const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("audio-tracks")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("audio-tracks")
        .getPublicUrl(storagePath);

      // Save metadata
      const trackTitle = title?.trim() || file.name.replace(/\.[^.]+$/, "");

      const { data, error } = await supabase
        .from("user_audio_tracks" as any)
        .insert({
          user_id: user.id,
          title: trackTitle,
          filename: file.name,
          storage_path: storagePath,
          url: publicUrl,
          duration_seconds: durationSeconds,
          file_size_bytes: file.size,
          mime_type: file.type || `audio/${ext}`,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return rowToTrack(data as unknown as AudioTrackRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-audio-tracks"] });
      toast({ title: "TRACK UPLOADED." });
    },
    onError: (err) => {
      toast({
        title: "UPLOAD FAILED.",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: delete audio track
// ---------------------------------------------------------------------------

export function useDeleteAudioTrack() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ trackId, storagePath }: { trackId: string; storagePath?: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Delete from storage if path known
      if (storagePath) {
        await supabase.storage.from("audio-tracks").remove([storagePath]).catch(() => {});
      }

      // Delete metadata
      const { error } = await supabase
        .from("user_audio_tracks" as any)
        .delete()
        .eq("id", trackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-audio-tracks"] });
      toast({ title: "TRACK DELETED." });
    },
    onError: (err) => {
      toast({
        title: "DELETE FAILED.",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });
}

export { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE };
