// ---------------------------------------------------------------------------
// MapSheetSection — the writer's own drawn map, attached to a world.
//
// F5 scope addition (owner, 2026-09-07). A writer who has drawn their planet
// in Wonderdraft, Azgaar or on paper has had nowhere to put it; the Atlas
// generates nothing and could only show pins on a grid. With a sheet attached,
// planet zoom in the Atlas becomes THEIR map, with their places pinned on it.
//
// The sheet is a TEXTURE. It is never read for facts: tilt, spin, lock,
// atmosphere and star colour keep coming from canon. Uploading a picture must
// not be a way to assert a number.
// ---------------------------------------------------------------------------

import { useCallback, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  MAP_PROJECTIONS,
  MAP_PROJECTION_LABELS,
  type MapProjection,
} from "@/lib/atlas/placement";
import { mapError } from "@/lib/ship-voice";
import { uploadMapSheet } from "@/services/storage-urls";
import { useStorageUrl } from "@/hooks/use-storage-url";

interface MapSheetSectionProps {
  entryId: string;
  /** The entry's world. Map sheets are filed under it so world readers can see them. */
  worldId: string;
  /** Current sheet, if any. */
  url: string | null;
  projection: MapProjection;
  canEdit: boolean;
  onChange: (patch: {
    map_sheet_url?: string | null;
    map_sheet_projection?: MapProjection;
  }) => void;
}

/**
 * Sheets are filed in the PRIVATE `map-sheets` bucket at
 * <user>/<world>/<entry>-<ts>.<ext> (migration 20261018_private_storage_buckets).
 * The owner, collaborators and readers of a community world see them through
 * signed URLs. Older sheets in the public `world-headers` bucket keep loading
 * as they are.
 */
const MAX_BYTES = 12 * 1024 * 1024;

export function MapSheetSection({
  entryId,
  worldId,
  url,
  projection,
  canEdit,
  onChange,
}: MapSheetSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const display = useStorageUrl(url);

  const upload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !user) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "UNSUPPORTED FILE.",
          description: "A map sheet must be an image.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast({
          title: "FILE TOO LARGE.",
          description: `Map sheets are capped at ${MAX_BYTES / 1024 / 1024} MB.`,
          variant: "destructive",
        });
        return;
      }

      setBusy(true);
      try {
        const storedUrl = await uploadMapSheet({
          userId: user.id,
          worldId,
          entityId: entryId,
          body: file,
          ext: file.name.split(".").pop() || "png",
        });
        onChange({ map_sheet_url: storedUrl });
        toast({ title: "MAP SHEET ATTACHED." });
      } catch (err) {
        toast({
          title: "UPLOAD FAILED.",
          description: mapError(err),
          variant: "destructive",
        });
      } finally {
        setBusy(false);
      }
    },
    [user, worldId, entryId, onChange, toast],
  );

  if (!url && !canEdit) return null;

  return (
    <>
      <div className="sf-wiki-section-header">Map Sheet</div>

      {url ? (
        <div className="space-y-2">
          {display.url ? (
            <img
              src={display.url}
              alt="Surface map sheet"
              className="w-full border border-sf-line"
            />
          ) : (
            <div
              className="flex aspect-[2/1] w-full items-center justify-center border border-sf-line bg-sf-surface text-[12px] uppercase text-t3"
              aria-busy={display.isLoading}
            >
              {display.isError ? "// SHEET UNAVAILABLE." : "RETRIEVING SHEET."}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] uppercase tracking-wider text-t4">
              Projection
            </span>
            {canEdit ? (
              <select
                value={projection}
                onChange={(ev) =>
                  onChange({ map_sheet_projection: ev.target.value as MapProjection })
                }
                aria-label="Map projection"
                className="px-3 py-0.5 text-[12px] uppercase tracking-wider text-t2"
              >
                {MAP_PROJECTIONS.map((p) => (
                  <option key={p} value={p}>
                    {MAP_PROJECTION_LABELS[p]}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[13px] text-t2">
                {MAP_PROJECTION_LABELS[projection]}
              </span>
            )}
            {canEdit && (
              <button
                type="button"
                onClick={() => onChange({ map_sheet_url: null })}
                className="ml-auto flex min-h-hit items-center gap-1.5 border border-sf-line px-3 text-[12px] uppercase tracking-wider text-t3 transition-colors hover:border-sf-crimson hover:text-sf-crimson-text"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
                Remove
              </button>
            )}
          </div>
          <p className="text-[12px] leading-relaxed text-t3">
            Shown as the map itself at this world's zoom level in the Codex
            Atlas. It is a picture, not a source of facts.
          </p>
        </div>
      ) : (
        <label className="flex min-h-hit cursor-pointer items-center gap-2 border border-sf-line px-3 text-[13px] text-t3 transition-colors hover:border-sf-primary hover:text-t1">
          <ImagePlus className="h-3.5 w-3.5" aria-hidden />
          {busy ? "Uploading…" : "Attach a surface map"}
          <input
            type="file"
            accept="image/*"
            onChange={upload}
            disabled={busy}
            className="sr-only"
          />
        </label>
      )}
    </>
  );
}

export default MapSheetSection;
