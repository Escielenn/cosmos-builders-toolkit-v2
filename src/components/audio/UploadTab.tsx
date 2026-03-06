import { useRef } from "react";
import { Upload, Trash2, Play, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import {
  useUserAudioTracks,
  useUploadAudioTrack,
  useDeleteAudioTrack,
  ACCEPTED_EXTENSIONS,
  MAX_FILE_SIZE,
} from "@/hooks/use-audio-uploads";
import { useAudioPlayer, useAudioControls } from "@/hooks/use-audio-player";

export default function UploadTab() {
  const { isSubscribed } = useSubscription();
  const { data: tracks, isLoading } = useUserAudioTracks();
  const uploadTrack = useUploadAudioTrack();
  const deleteTrack = useDeleteAudioTrack();
  const { currentTrack, status } = useAudioPlayer();
  const { play, pause } = useAudioControls();
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isSubscribed) {
    return (
      <div className="py-8 text-center space-y-2">
        <p className="text-tier-3 text-xs uppercase tracking-wider">
          Pro feature
        </p>
        <p className="text-tier-4 text-[11px]">
          Upgrade to Pro to upload your own audio tracks.
        </p>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadTrack.mutate({ file });
    // Reset input so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="py-3 space-y-4">
      {/* Upload button */}
      <div className="border-2 border-dashed border-white/10 p-4 text-center space-y-2">
        <Upload className="w-5 h-5 mx-auto text-tier-4" />
        <p className="text-[11px] text-tier-3">
          Drop an audio file or click to browse
        </p>
        <p className="text-[9px] text-tier-5 font-mono uppercase tracking-wider">
          {ACCEPTED_EXTENSIONS.join(", ")} — Max {MAX_FILE_SIZE / 1024 / 1024}MB
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => inputRef.current?.click()}
          disabled={uploadTrack.isPending}
        >
          {uploadTrack.isPending ? "Uploading..." : "Choose File"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>

      {/* Track list */}
      {isLoading ? (
        <p className="text-tier-4 text-xs text-center animate-pulse">
          Loading uploads...
        </p>
      ) : (tracks ?? []).length === 0 ? (
        <p className="text-tier-4 text-xs text-center">
          No uploaded tracks yet.
        </p>
      ) : (
        <div className="border border-white/8 divide-y divide-white/5">
          {(tracks ?? []).map((track) => {
            const isThis = currentTrack?.id === track.id;
            const isPlaying = isThis && status === "playing";

            return (
              <div
                key={track.id}
                className={`group flex items-center gap-3 px-3 py-2 transition-colors hover:bg-white/[0.03] ${
                  isThis ? "bg-primary/[0.04]" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => (isPlaying ? pause() : play(track))}
                  className={`shrink-0 ${isThis ? "text-primary" : "text-tier-4 hover:text-tier-2"}`}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Music className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm truncate ${isThis ? "text-primary" : "text-tier-2"}`}>
                    {track.title}
                  </p>
                </div>

                {track.duration != null && track.duration > 0 && (
                  <span className="font-mono text-[10px] text-tier-4 tabular-nums">
                    {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, "0")}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => deleteTrack.mutate({ trackId: track.id })}
                  className="p-1 text-tier-4 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Delete track"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
