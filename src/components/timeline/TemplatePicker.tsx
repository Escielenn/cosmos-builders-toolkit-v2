import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingDown,
  Eye,
  Rocket,
  Swords,
  TreePine,
  type LucideIcon,
} from "lucide-react";
import {
  TIMELINE_TEMPLATES,
  type TimelineTemplate,
  type TemplateCategory,
} from "@/lib/timeline/templates";
import { TRACK_COLOR_PALETTE } from "@/lib/timeline/constants";
import { generateId } from "@/lib/timeline/utils";
import type { TimelineState, TimelineTrack, TimelineEvent } from "@/lib/timeline/types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingDown,
  Eye,
  Rocket,
  Swords,
  TreePine,
};

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  civilization: "Civilization",
  character: "Character",
  conflict: "Conflict",
  exploration: "Exploration",
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  civilization: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  character: "bg-violet-500/20 text-sf-violet border-violet-500/30",
  conflict: "bg-red-500/20 text-sf-crimson border-red-500/30",
  exploration: "bg-emerald-500/20 text-sf-emerald border-emerald-500/30",
};

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (state: TimelineState) => void;
  hasExistingData: boolean;
}

/** Convert a template definition into a full TimelineState */
function buildStateFromTemplate(
  template: TimelineTemplate,
  centerYear: number
): TimelineState {
  // Create tracks with real IDs
  const tracks: TimelineTrack[] = template.tracks.map((t, i) => ({
    id: generateId(),
    name: t.name,
    type: t.type,
    color: t.color || TRACK_COLOR_PALETTE[i % TRACK_COLOR_PALETTE.length],
    order: i,
    isCollapsed: false,
  }));

  // Create events with real IDs, mapping trackIndex and parentIndex
  const eventIds: string[] = [];
  const events: TimelineEvent[] = template.events.map((te) => {
    const id = generateId();
    eventIds.push(id);
    const trackId = tracks[te.trackIndex]?.id || tracks[0].id;
    return {
      id,
      trackId,
      name: te.name,
      eventType: te.eventType,
      importance: te.importance,
      shortDescription: te.shortDescription,
      hasDuration: te.hasDuration,
      startYear: centerYear + te.relativeYear,
      endYear: te.relativeEndYear != null ? centerYear + te.relativeEndYear : undefined,
      parentEventId: te.parentIndex != null ? eventIds[te.parentIndex] : undefined,
    };
  });

  return {
    tracks,
    events,
    viewState: { pixelsPerYear: 0.5, centerYear },
    generalNotes: "",
    moodboard: [],
    calendars: [],
    compressions: [],
    expandedEventIds: [],
    eventLinks: [],
    causalityLinksVisible: true,
    elementLinks: [],
  };
}

const TemplatePicker = ({
  open,
  onOpenChange,
  onApply,
  hasExistingData,
}: TemplatePickerProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (template: TimelineTemplate) => {
    if (hasExistingData) {
      setSelectedId(template.id);
      setConfirming(true);
    } else {
      applyTemplate(template);
    }
  };

  const applyTemplate = (template: TimelineTemplate) => {
    const state = buildStateFromTemplate(template, 2200);
    onApply(state);
    setConfirming(false);
    setSelectedId(null);
    onOpenChange(false);
  };

  const confirmedTemplate = TIMELINE_TEMPLATES.find((t) => t.id === selectedId);

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        setConfirming(false);
        setSelectedId(null);
      }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Timeline Templates</DialogTitle>
        </DialogHeader>

        {confirming && confirmedTemplate ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-t3">
              Applying <span className="font-medium text-t1">{confirmedTemplate.name}</span> will
              replace your current tracks, events, and links. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirming(false);
                  setSelectedId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => applyTemplate(confirmedTemplate)}
              >
                Replace Timeline
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {TIMELINE_TEMPLATES.map((template) => {
              const Icon = ICON_MAP[template.icon] || Rocket;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleSelect(template)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-none border border-sf-border",
                    "bg-muted/20 hover:bg-muted/40 hover:border-sf-border transition-colors text-left"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="w-5 h-5 text-t3 shrink-0" />
                    <span className="text-sm font-medium flex-1 truncate">
                      {template.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] py-0", CATEGORY_COLORS[template.category])}
                    >
                      {CATEGORY_LABELS[template.category]}
                    </Badge>
                  </div>
                  <p className="text-xs text-t3 leading-relaxed">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-t3/70">
                    <span>{template.tracks.length} tracks</span>
                    <span>{template.events.length} events</span>
                    <div className="flex items-center gap-0.5">
                      {template.tracks.map((t, i) => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePicker;
