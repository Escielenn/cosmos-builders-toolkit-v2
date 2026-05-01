import { lazy, Suspense, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, ArrowRight, ArrowLeft, Plus, Link2, X } from "lucide-react";
import type { TimelineEvent, TimelineTrack, EventType, ImportanceLevel } from "@/lib/timeline/types";
import { EARTH_CALENDAR_ID } from "@/lib/timeline/types";
import { EVENT_TYPES, EVENT_TYPE_MAP, IMPORTANCE_LEVELS, LINK_TYPE_CONFIG } from "@/lib/timeline/constants";
import { formatDateRange, formatEventDateRange, calendarDateToEarthYear, getEventLinks, getEventElementLinks } from "@/lib/timeline/utils";
import { getToolDisplayName } from "@/lib/worksheet-links-config";
import { getToolIcon } from "@/components/icons/tool-icons";
import { useTimeline } from "@/lib/timeline/context";
import CalendarDateInput from "./CalendarDateInput";
import { cn } from "@/lib/utils";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

interface EventDetailPanelProps {
  event: TimelineEvent | null;
  tracks: TimelineTrack[];
  events: TimelineEvent[];
  onClose: () => void;
  onUpdate: (event: TimelineEvent) => void;
  onDelete: (eventId: string) => void;
  onAddLink?: (sourceEventId: string) => void;
  onEditLink?: (linkId: string) => void;
  onAddElementLink?: (eventId: string) => void;
  onDeleteElementLink?: (linkId: string) => void;
  worldId?: string | null;
}

const eventCategories = [
  { label: "Character", types: EVENT_TYPES.filter((et) => et.category === "character") },
  { label: "Civilization", types: EVENT_TYPES.filter((et) => et.category === "civilization") },
  { label: "Conflict", types: EVENT_TYPES.filter((et) => et.category === "conflict") },
  { label: "Discovery", types: EVENT_TYPES.filter((et) => et.category === "discovery") },
  { label: "Settlement", types: EVENT_TYPES.filter((et) => et.category === "settlement") },
  { label: "Journey", types: EVENT_TYPES.filter((et) => et.category === "journey") },
  { label: "Other", types: EVENT_TYPES.filter((et) => et.category === "custom") },
];

const EventDetailPanel = ({
  event,
  tracks,
  events,
  onClose,
  onUpdate,
  onDelete,
  onAddLink,
  onEditLink,
  onAddElementLink,
  onDeleteElementLink,
  worldId,
}: EventDetailPanelProps) => {
  const { state } = useTimeline();
  const calendars = state.calendars;

  if (!event) return null;

  const track = tracks.find((t) => t.id === event.trackId);
  const eventConfig = EVENT_TYPE_MAP[event.eventType];
  const color = event.color || eventConfig?.defaultColor || track?.color || "#6366f1";

  const selectedCalendar = calendars.find((c) => c.id === event.calendarId);
  const isCustomCalendar = !!selectedCalendar;

  const update = (partial: Partial<TimelineEvent>) => {
    onUpdate({ ...event, ...partial });
  };

  const handleCalendarChange = (newCalendarId: string) => {
    if (newCalendarId === EARTH_CALENDAR_ID) {
      update({ calendarId: undefined, startDate: undefined, endDate: undefined });
    } else {
      update({ calendarId: newCalendarId });
    }
  };

  const parentOptions = events.filter(
    (e) => e.trackId === event.trackId && e.hasDuration && e.id !== event.id
  );

  // Display date range (calendar-aware)
  const dateRangeDisplay = formatEventDateRange(event, calendars);

  return (
    <Sheet open={!!event} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <SheetTitle className="text-lg">{event.name}</SheetTitle>
          </div>
          <p className="text-xs text-t3">{dateRangeDisplay}</p>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={event.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>

          {/* Track */}
          <div className="space-y-1.5">
            <Label className="text-xs">Track</Label>
            <Select value={event.trackId} onValueChange={(v) => update({ trackId: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tracks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event Type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Event Type</Label>
            <Select
              value={event.eventType}
              onValueChange={(v) => update({ eventType: v as EventType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventCategories.map((cat) => (
                  <SelectGroup key={cat.label}>
                    <SelectLabel>{cat.label}</SelectLabel>
                    {cat.types.map((et) => (
                      <SelectItem key={et.id} value={et.id}>
                        {et.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Importance */}
          <div className="space-y-1.5">
            <Label className="text-xs">Importance</Label>
            <div className="flex gap-1.5">
              {IMPORTANCE_LEVELS.map((il) => (
                <button
                  key={il.id}
                  type="button"
                  onClick={() => update({ importance: il.id })}
                  className={cn(
                    "flex-1 px-2 py-1 rounded border text-[11px] font-medium transition-colors",
                    event.importance === il.id
                      ? "border-primary bg-primary/10 text-t1"
                      : "border-sf-border text-t3 hover:border-sf-border"
                  )}
                >
                  {il.label}
                </button>
              ))}
            </div>
          </div>

          {/* Short Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Short Description</Label>
            <Textarea
              value={event.shortDescription}
              onChange={(e) => update({ shortDescription: e.target.value })}
              rows={2}
              placeholder="Brief description..."
            />
          </div>

          {/* Extended Description */}
          <div className="space-y-1.5">
            <Label className="text-xs">Extended Description</Label>
            <Suspense fallback={<div className="h-32 bg-muted/20 rounded animate-pulse" />}>
              <RichTextEditor
                content={event.extendedDescription || ""}
                onChange={(html) => update({ extendedDescription: html })}
                placeholder="Detailed notes about this event..."
              />
            </Suspense>
          </div>

          {/* Calendar Selector */}
          {calendars.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Calendar</Label>
              <Select
                value={event.calendarId || EARTH_CALENDAR_ID}
                onValueChange={handleCalendarChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EARTH_CALENDAR_ID}>Earth Standard</SelectItem>
                  {calendars.map((cal) => (
                    <SelectItem key={cal.id} value={cal.id}>
                      {cal.name}
                      {cal.epochLabel ? ` (${cal.epochLabel})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Start Date, Earth or Custom Calendar */}
          <div className="space-y-1.5">
            <Label className="text-xs">Start Date</Label>
            {isCustomCalendar && selectedCalendar ? (
              <CalendarDateInput
                calendar={selectedCalendar}
                value={event.startDate}
                onChange={(date) => {
                  const earthYear = Math.round(calendarDateToEarthYear(date, selectedCalendar));
                  update({ startDate: date, startYear: earthYear, startMonth: undefined, startDay: undefined });
                }}
              />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={event.startYear}
                  onChange={(e) => update({ startYear: Number(e.target.value) })}
                  placeholder="Year"
                />
                <Input
                  type="number"
                  value={event.startMonth ?? ""}
                  onChange={(e) =>
                    update({ startMonth: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="Mo"
                  min={1}
                  max={12}
                />
                <Input
                  type="number"
                  value={event.startDay ?? ""}
                  onChange={(e) =>
                    update({ startDay: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="Day"
                  min={1}
                  max={31}
                />
              </div>
            )}
          </div>

          {/* Duration toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={event.hasDuration}
              onCheckedChange={(checked) =>
                update({
                  hasDuration: checked,
                  endYear: checked ? event.endYear ?? event.startYear + 10 : undefined,
                })
              }
            />
            <Label className="text-xs cursor-pointer">Spans a period of time</Label>
          </div>

          {/* End Date */}
          {event.hasDuration && (
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              {isCustomCalendar && selectedCalendar ? (
                <CalendarDateInput
                  calendar={selectedCalendar}
                  value={event.endDate}
                  onChange={(date) => {
                    const earthYear = Math.round(calendarDateToEarthYear(date, selectedCalendar));
                    update({ endDate: date, endYear: earthYear, endMonth: undefined, endDay: undefined });
                  }}
                />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={event.endYear ?? ""}
                    onChange={(e) =>
                      update({ endYear: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="Year"
                  />
                  <Input
                    type="number"
                    value={event.endMonth ?? ""}
                    onChange={(e) =>
                      update({ endMonth: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="Mo"
                    min={1}
                    max={12}
                  />
                  <Input
                    type="number"
                    value={event.endDay ?? ""}
                    onChange={(e) =>
                      update({ endDay: e.target.value ? Number(e.target.value) : undefined })
                    }
                    placeholder="Day"
                    min={1}
                    max={31}
                  />
                </div>
              )}
            </div>
          )}

          {/* Parent Event */}
          {parentOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Parent Event</Label>
              <Select
                value={event.parentEventId || "none"}
                onValueChange={(v) => update({ parentEventId: v === "none" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentOptions.map((pe) => (
                    <SelectItem key={pe.id} value={pe.id}>
                      {pe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Secondary Tracks (Also Affects) */}
          {tracks.length > 1 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Also Affects Tracks</Label>
              <div className="flex flex-wrap gap-1">
                {tracks
                  .filter((t) => t.id !== event.trackId)
                  .map((t) => {
                    const isActive = event.secondaryTrackIds?.includes(t.id) ?? false;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          const current = event.secondaryTrackIds || [];
                          const updated = isActive
                            ? current.filter((id) => id !== t.id)
                            : [...current, t.id];
                          update({ secondaryTrackIds: updated.length > 0 ? updated : undefined });
                        }}
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-colors",
                          isActive
                            ? "border-primary bg-primary/10 text-t1"
                            : "border-sf-border text-t3 hover:border-sf-border"
                        )}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        {t.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Causality Links */}
          {event && (() => {
            const { outgoing, incoming } = getEventLinks(event.id, state.eventLinks);
            const hasLinks = outgoing.length > 0 || incoming.length > 0;
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Causality Links</Label>
                  {onAddLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1"
                      onClick={() => onAddLink(event.id)}
                    >
                      <Plus className="w-3 h-3" />
                      Add Link
                    </Button>
                  )}
                </div>
                {hasLinks ? (
                  <div className="space-y-1">
                    {outgoing.map((link) => {
                      const target = events.find((e) => e.id === link.targetEventId);
                      const config = LINK_TYPE_CONFIG[link.linkType];
                      return (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => onEditLink?.(link.id)}
                          className="flex items-center gap-1.5 w-full px-2 py-1 rounded text-[11px] hover:bg-muted/50 transition-colors text-left"
                        >
                          <ArrowRight className="w-3 h-3 shrink-0" style={{ color: config.color }} />
                          <span className="font-medium" style={{ color: config.color }}>
                            {config.label}
                          </span>
                          <span className="truncate text-t3">
                            {target?.name || "Unknown"}
                          </span>
                        </button>
                      );
                    })}
                    {incoming.map((link) => {
                      const source = events.find((e) => e.id === link.sourceEventId);
                      const config = LINK_TYPE_CONFIG[link.linkType];
                      return (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => onEditLink?.(link.id)}
                          className="flex items-center gap-1.5 w-full px-2 py-1 rounded text-[11px] hover:bg-muted/50 transition-colors text-left"
                        >
                          <ArrowLeft className="w-3 h-3 shrink-0" style={{ color: config.color }} />
                          <span className="font-medium" style={{ color: config.color }}>
                            {config.label} by
                          </span>
                          <span className="truncate text-t3">
                            {source?.name || "Unknown"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-t3">
                    No causality links yet.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Linked Elements */}
          {worldId && event && (() => {
            const elementLinks = getEventElementLinks(event.id, state.elementLinks);
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Linked Elements</Label>
                  {onAddElementLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] gap-1"
                      onClick={() => onAddElementLink(event.id)}
                    >
                      <Plus className="w-3 h-3" />
                      Link Element
                    </Button>
                  )}
                </div>
                {elementLinks.length > 0 ? (
                  <div className="space-y-1">
                    {elementLinks.map((link) => {
                      const ToolIcon = getToolIcon(link.toolType);
                      return (
                        <div
                          key={link.id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] group"
                        >
                          {ToolIcon ? (
                            <ToolIcon className="w-3.5 h-3.5 rounded-sm shrink-0" />
                          ) : (
                            <Link2 className="w-3 h-3 shrink-0 text-t3" />
                          )}
                          <span className="truncate text-t3">
                            {link.worksheetTitle}
                          </span>
                          <span className="text-[9px] text-t3/50 shrink-0">
                            {getToolDisplayName(link.toolType)}
                          </span>
                          {onDeleteElementLink && (
                            <button
                              type="button"
                              title="Remove link"
                              onClick={() => onDeleteElementLink(link.id)}
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-t3 hover:text-sf-crimson shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-t3">
                    No linked elements yet.
                  </p>
                )}
              </div>
            );
          })()}

          {/* Delete */}
          <div className="pt-4 border-t border-sf-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Event
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{event.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This event will be permanently removed. Any child events will become top-level events.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(event.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default EventDetailPanel;
