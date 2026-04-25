import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Globe,
  Building2,
  Globe2,
  Rocket,
  Sun,
  Gem,
  Cpu,
  Dna,
  Palette,
  Swords,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { TimelineTrack, TrackType } from "@/lib/timeline/types";
import { TRACK_TYPES, TRACK_COLOR_PALETTE } from "@/lib/timeline/constants";
import { cn } from "@/lib/utils";

const TRACK_ICON_MAP: Record<string, LucideIcon> = {
  User,
  Globe,
  Building2,
  Globe2,
  Rocket,
  Sun,
  Gem,
  Cpu,
  Dna,
  Palette,
  Swords,
  BookOpen,
};

interface TrackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (track: any) => void;
  editingTrack?: TimelineTrack | null;
  usedColors?: string[];
}

const TrackFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editingTrack,
  usedColors = [],
}: TrackFormDialogProps) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<TrackType>("character");
  const [color, setColor] = useState(TRACK_COLOR_PALETTE[0]);

  useEffect(() => {
    if (open) {
      if (editingTrack) {
        setName(editingTrack.name);
        setType(editingTrack.type);
        setColor(editingTrack.color);
      } else {
        setName("");
        setType("character");
        // Pick first unused color
        const unused = TRACK_COLOR_PALETTE.find((c) => !usedColors.includes(c));
        setColor(unused || TRACK_COLOR_PALETTE[0]);
      }
    }
  }, [open, editingTrack, usedColors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTrack) {
      onSubmit({ ...editingTrack, name: name.trim(), type, color });
    } else {
      onSubmit({ name: name.trim(), type, color });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingTrack ? "Edit Track" : "Create Track"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="track-name">Name</Label>
            <Input
              id="track-name"
              placeholder="e.g., Humanity, The Rocinante, Hari Seldon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {TRACK_TYPES.map((tt) => {
                const Icon = TRACK_ICON_MAP[tt.icon];
                return (
                  <button
                    key={tt.id}
                    type="button"
                    onClick={() => setType(tt.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors text-left",
                      type === tt.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-sf-border text-t3 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                    {tt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {TRACK_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    color === c
                      ? "border-white scale-110 shadow-lg"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {editingTrack ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TrackFormDialog;
