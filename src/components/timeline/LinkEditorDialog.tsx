import { useState, useEffect, useMemo } from "react";
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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { EventLink, LinkType } from "@/lib/timeline/types";
import { LINK_TYPE_CONFIG, LINK_TYPES } from "@/lib/timeline/constants";
import { useTimeline } from "@/lib/timeline/context";
import { cn } from "@/lib/utils";

interface LinkEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLink?: EventLink | null;
  defaultSourceEventId?: string;
}

const LinkEditorDialog = ({
  open,
  onOpenChange,
  editingLink,
  defaultSourceEventId,
}: LinkEditorDialogProps) => {
  const { state, dispatch } = useTimeline();

  const [sourceEventId, setSourceEventId] = useState("");
  const [targetEventId, setTargetEventId] = useState("");
  const [linkType, setLinkType] = useState<LinkType>("caused");
  const [strength, setStrength] = useState<1 | 2 | 3>(2);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (open) {
      if (editingLink) {
        setSourceEventId(editingLink.sourceEventId);
        setTargetEventId(editingLink.targetEventId);
        setLinkType(editingLink.linkType);
        setStrength(editingLink.strength);
        setLabel(editingLink.label || "");
      } else {
        setSourceEventId(defaultSourceEventId || "");
        setTargetEventId("");
        setLinkType("caused");
        setStrength(2);
        setLabel("");
      }
    }
  }, [open, editingLink, defaultSourceEventId]);

  // Events grouped by track for the selector
  const eventsByTrack = useMemo(() => {
    const groups: { trackName: string; trackColor: string; events: { id: string; name: string }[] }[] = [];
    for (const track of state.tracks) {
      const trackEvents = state.events
        .filter((e) => e.trackId === track.id)
        .map((e) => ({ id: e.id, name: e.name }));
      if (trackEvents.length > 0) {
        groups.push({ trackName: track.name, trackColor: track.color, events: trackEvents });
      }
    }
    return groups;
  }, [state.tracks, state.events]);

  const handleSubmit = () => {
    if (!sourceEventId || !targetEventId || sourceEventId === targetEventId) return;

    if (editingLink) {
      dispatch({
        type: "UPDATE_LINK",
        payload: {
          id: editingLink.id,
          sourceEventId,
          targetEventId,
          linkType,
          strength,
          label: label.trim() || undefined,
        },
      });
    } else {
      dispatch({
        type: "CREATE_LINK",
        payload: {
          sourceEventId,
          targetEventId,
          linkType,
          strength,
          label: label.trim() || undefined,
        },
      });
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editingLink) {
      dispatch({ type: "DELETE_LINK", payload: editingLink.id });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingLink ? "Edit Causality Link" : "Create Causality Link"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Source Event */}
          <div className="space-y-2">
            <Label className="text-xs">Source Event</Label>
            <Select value={sourceEventId} onValueChange={setSourceEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source event..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {eventsByTrack.map((group) => (
                  <div key={group.trackName}>
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: group.trackColor }}
                      />
                      <span className="text-[10px] font-semibold text-t3 uppercase">
                        {group.trackName}
                      </span>
                    </div>
                    {group.events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Link Type */}
          <div className="space-y-2">
            <Label className="text-xs">Relationship</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {LINK_TYPES.map((lt) => {
                const config = LINK_TYPE_CONFIG[lt.id];
                return (
                  <button
                    key={lt.id}
                    type="button"
                    onClick={() => setLinkType(lt.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md border text-xs font-medium transition-colors",
                      linkType === lt.id
                        ? "border-primary bg-primary/10 text-t1"
                        : "border-sf-border text-t3 hover:border-sf-border"
                    )}
                  >
                    <span
                      className="w-3 h-0.5 rounded-full"
                      style={{
                        backgroundColor: config.color,
                        borderBottom: config.dashArray ? "1px dashed" : undefined,
                      }}
                    />
                    {lt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Event */}
          <div className="space-y-2">
            <Label className="text-xs">Target Event</Label>
            <Select value={targetEventId} onValueChange={setTargetEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target event..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {eventsByTrack.map((group) => (
                  <div key={group.trackName}>
                    <div className="flex items-center gap-1.5 px-2 py-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: group.trackColor }}
                      />
                      <span className="text-[10px] font-semibold text-t3 uppercase">
                        {group.trackName}
                      </span>
                    </div>
                    {group.events
                      .filter((e) => e.id !== sourceEventId)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Strength */}
          <div className="space-y-2">
            <Label className="text-xs">
              Strength: {strength === 1 ? "Weak" : strength === 2 ? "Moderate" : "Strong"}
            </Label>
            <Slider
              value={[strength]}
              onValueChange={(v) => setStrength(v[0] as 1 | 2 | 3)}
              min={1}
              max={3}
              step={1}
            />
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label className="text-xs">Label (optional)</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Led to the founding of..."
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between">
          {editingLink ? (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!sourceEventId || !targetEventId || sourceEventId === targetEventId}
            >
              {editingLink ? "Save" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkEditorDialog;
