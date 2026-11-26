// ---------------------------------------------------------------------------
// WorldCoverDialog (1.7): set or change a world's cover from its card menu.
//
// The same upload as the Bridge (HeaderImageUpload: file or moodboard pick,
// public world-headers bucket) and the same vertical-position slider, saved
// to the same columns (header_image_url, header_image_focus_y). Nothing
// else about the world is touched.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader } from "@/components/ui/loader";
import HeaderImageUpload from "@/components/world/HeaderImageUpload";
import { useWorlds } from "@/hooks/use-worlds";

interface WorldCoverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  worldName: string;
  currentUrl: string | null;
  currentFocusY?: number | null;
}

export default function WorldCoverDialog({
  open,
  onOpenChange,
  worldId,
  worldName,
  currentUrl,
  currentFocusY,
}: WorldCoverDialogProps) {
  const { updateWorld } = useWorlds();
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [focusY, setFocusY] = useState<number>(currentFocusY ?? 50);

  useEffect(() => {
    if (!open) return;
    setUrl(currentUrl);
    setFocusY(currentFocusY ?? 50);
  }, [open, currentUrl, currentFocusY]);

  const dirty = url !== currentUrl || (url !== null && focusY !== (currentFocusY ?? 50));

  const save = async () => {
    try {
      await updateWorld.mutateAsync({
        worldId,
        header_image_url: url,
        header_image_focus_y: url ? focusY : 50,
      });
      onOpenChange(false);
    } catch {
      // useWorlds reported it; keep the dialog open to retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{currentUrl ? "Change cover" : "Set cover"}</DialogTitle>
          <DialogDescription>
            The cover heads {worldName}'s Bridge and shows, faded, behind its card.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <HeaderImageUpload
            currentImageUrl={url}
            onImageChange={(next) => {
              setUrl(next);
              if (next === null) setFocusY(50);
            }}
            focusY={focusY}
          />
          {url && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="world-cover-focus">Vertical position</Label>
                <span className="font-mono text-sf-mono text-t3 tabular-nums">{focusY}%</span>
              </div>
              <Slider
                id="world-cover-focus"
                value={[focusY]}
                onValueChange={([v]) => setFocusY(v)}
                min={0}
                max={100}
                step={1}
                aria-label="Vertical image position"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="sf-ghost" size="sf-md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="sf-primary" size="sf-md" onClick={() => void save()} disabled={!dirty || updateWorld.isPending}>
            {updateWorld.isPending && <Loader variant="inline" size="sm" />}
            Save cover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
