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
import type { TimelineEvent, TimelineTrack, EventType, ImportanceLevel, CalendarDate } from "@/lib/timeline/types";
import { EARTH_CALENDAR_ID } from "@/lib/timeline/types";
import { EVENT_TYPES, IMPORTANCE_LEVELS } from "@/lib/timeline/constants";
import { calendarDateToEarthYear, getEventNestingLevel, getDescendants } from "@/lib/timeline/utils";
import { MAX_NESTING_DEPTH } from "@/lib/timeline/constants";
import { useTimeline } from "@/lib/timeline/context";
import CalendarDateInput from "./CalendarDateInput";
import { cn } from "@/lib/utils";

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: Omit<TimelineEvent, "id"> | TimelineEvent) => void;
  tracks: TimelineTrack[];
  events: TimelineEvent[];
  editingEvent?: TimelineEvent | null;
  defaultTrackId?: string;
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

const EventFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  tracks,
  events,
  editingEvent,
  defaultTrackId,
}: EventFormDialogProps) => {
  const { state } = useTimeline();
  const calendars = state.calendars;

  const [name, setName] = useState("");
  const [trackId, setTrackId] = useState("");
  const [eventType, setEventType] = useState<EventType>("custom");
  const [importance, setImportance] = useState<ImportanceLevel>("moderate");
  const [shortDescription, setShortDescription] = useState("");
  const [startYear, setStartYear] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startDay, setStartDay] = useState("");
  const [hasDuration, setHasDuration] = useState(false);
  const [endYear, setEndYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endDay, setEndDay] = useState("");
  const [parentEventId, setParentEventId] = useState("");
  // Phase 2: Calendar
  const [calendarId, setCalendarId] = useState<string>(EARTH_CALENDAR_ID);
  const [startDate, setStartDate] = useState<CalendarDate | undefined>();
  const [endDate, setEndDate] = useState<CalendarDate | undefined>();
  const [secondaryTrackIds, setSecondaryTrackIds] = useState<string[]>([]);

  const selectedCalendar = useMemo(
    () => calendars.find((c) => c.id === calendarId),
    [calendars, calendarId]
  );
  const isCustomCalendar = !!selectedCalendar;

  useEffect(() => {
    if (open) {
      if (editingEvent) {
        setName(editingEvent.name);
        setTrackId(editingEvent.trackId);
        setEventType(editingEvent.eventType);
        setImportance(editingEvent.importance);
        setShortDescription(editingEvent.shortDescription);
        setStartYear(String(editingEvent.startYear));
        setStartMonth(editingEvent.startMonth != null ? String(editingEvent.startMonth) : "");
        setStartDay(editingEvent.startDay != null ? String(editingEvent.startDay) : "");
        setHasDuration(editingEvent.hasDuration);
        setEndYear(editingEvent.endYear != null ? String(editingEvent.endYear) : "");
        setEndMonth(editingEvent.endMonth != null ? String(editingEvent.endMonth) : "");
        setEndDay(editingEvent.endDay != null ? String(editingEvent.endDay) : "");
        setParentEventId(editingEvent.parentEventId || "");
        setCalendarId(editingEvent.calendarId || EARTH_CALENDAR_ID);
        setStartDate(editingEvent.startDate);
        setEndDate(editingEvent.endDate);
        setSecondaryTrackIds(editingEvent.secondaryTrackIds || []);
      } else {
        setName("");
        setTrackId(defaultTrackId || tracks[0]?.id || "");
        setEventType("custom");
        setImportance("moderate");
        setShortDescription("");
        setStartYear("2200");
        setStartMonth("");
        setStartDay("");
        setHasDuration(false);
        setEndYear("");
        setEndMonth("");
        setEndDay("");
        setParentEventId("");
        setCalendarId(EARTH_CALENDAR_ID);
        setStartDate(undefined);
        setEndDate(undefined);
        setSecondaryTrackIds([]);
      }
    }
  }, [open, editingEvent, defaultTrackId, tracks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // For custom calendars, compute Earth-equivalent years from CalendarDate
    let finalStartYear = Number(startYear);
    let finalStartMonth = startMonth ? Number(startMonth) : undefined;
    let finalStartDay = startDay ? Number(startDay) : undefined;
    let finalEndYear = hasDuration && endYear ? Number(endYear) : undefined;
    let finalEndMonth = hasDuration && endMonth ? Number(endMonth) : undefined;
    let finalEndDay = hasDuration && endDay ? Number(endDay) : undefined;

    if (isCustomCalendar && selectedCalendar && startDate) {
      finalStartYear = Math.round(calendarDateToEarthYear(startDate, selectedCalendar));
      finalStartMonth = undefined;
      finalStartDay = undefined;
      if (hasDuration && endDate) {
        finalEndYear = Math.round(calendarDateToEarthYear(endDate, selectedCalendar));
        finalEndMonth = undefined;
        finalEndDay = undefined;
      }
    }

    if (!name.trim() || !trackId || (isCustomCalendar ? !startDate : !startYear)) return;

    const event: Omit<TimelineEvent, "id"> = {
      trackId,
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      eventType,
      importance,
      startYear: finalStartYear,
      startMonth: finalStartMonth,
      startDay: finalStartDay,
      hasDuration,
      endYear: finalEndYear,
      endMonth: finalEndMonth,
      endDay: finalEndDay,
      parentEventId: parentEventId || undefined,
      calendarId: isCustomCalendar ? calendarId : undefined,
      startDate: isCustomCalendar ? startDate : undefined,
      endDate: isCustomCalendar && hasDuration ? endDate : undefined,
      secondaryTrackIds: secondaryTrackIds.length > 0 ? secondaryTrackIds : undefined,
    };

    onSubmit(event);
  };

  // Potential parent events: same track, duration, at level 0-1, not self or descendants
  const editingDescendants = editingEvent
    ? getDescendants(editingEvent.id, events).map((d) => d.id)
    : [];
  const parentOptions = events.filter((e) => {
    if (e.trackId !== trackId || !e.hasDuration || e.id === editingEvent?.id) return false;
    if (editingDescendants.includes(e.id)) return false;
    const level = getEventNestingLevel(e.id, events);
    return level < MAX_NESTING_DEPTH;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? "Edit Event" : "Create Event"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="event-name">Event Name</Label>
            <Input
              id="event-name"
              placeholder="e.g., First Contact, Fall of the Empire"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Track */}
          <div className="space-y-2">
            <Label>Track</Label>
            <Select value={trackId} onValueChange={setTrackId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a track" />
              </SelectTrigger>
              <SelectContent>
                {tracks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Also Affects Tracks (secondary tracks) */}
          {tracks.length > 1 && (
            <div className="space-y-2">
              <Label>Also Affects Tracks</Label>
              <div className="flex flex-wrap gap-1.5">
                {tracks
                  .filter((t) => t.id !== trackId)
                  .map((t) => {
                    const isActive = secondaryTrackIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setSecondaryTrackIds((prev) =>
                            isActive ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                          )
                        }
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors",
                          isActive
                            ? "border-primary bg-primary/10 text-t1"
                            : "border-sf-border text-t3 hover:border-sf-border"
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        {t.name}
                      </button>
                    );
                  })}
              </div>
              <p className="text-[12px] text-t3">
                Select tracks where this event should also appear as a reference.
              </p>
            </div>
          )}

          {/* Event Type */}
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
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
          <div className="space-y-2">
            <Label>Importance</Label>
            <div className="flex gap-2">
              {IMPORTANCE_LEVELS.map((il) => (
                <button
                  key={il.id}
                  type="button"
                  onClick={() => setImportance(il.id)}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors",
                    importance === il.id
                      ? "border-primary bg-primary/10 text-t1"
                      : "border-sf-border text-t3 hover:border-sf-border"
                  )}
                >
                  {il.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-desc">Short Description</Label>
            <Textarea
              id="event-desc"
              placeholder="Brief description of this event..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Calendar Selector (only shown when custom calendars exist) */}
          {calendars.length > 0 && (
            <div className="space-y-2">
              <Label>Calendar</Label>
              <Select value={calendarId} onValueChange={setCalendarId}>
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

          {/* Start Date, Earth or Custom */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            {isCustomCalendar && selectedCalendar ? (
              <CalendarDateInput
                calendar={selectedCalendar}
                value={startDate}
                onChange={setStartDate}
              />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="Year"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                  />
                  <span className="text-[12px] text-t3 mt-0.5 block">Year (required)</span>
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Month"
                    min={1}
                    max={12}
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                  />
                  <span className="text-[12px] text-t3 mt-0.5 block">Month (1-12)</span>
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Day"
                    min={1}
                    max={31}
                    value={startDay}
                    onChange={(e) => setStartDay(e.target.value)}
                  />
                  <span className="text-[12px] text-t3 mt-0.5 block">Day (1-31)</span>
                </div>
              </div>
            )}
          </div>

          {/* Duration toggle */}
          <div className="flex items-center gap-3">
            <Switch
              checked={hasDuration}
              onCheckedChange={setHasDuration}
              id="has-duration"
            />
            <Label htmlFor="has-duration" className="cursor-pointer">
              This event spans a period of time
            </Label>
          </div>

          {/* End Date, Earth or Custom */}
          {hasDuration && (
            <div className="space-y-2">
              <Label>End Date</Label>
              {isCustomCalendar && selectedCalendar ? (
                <CalendarDateInput
                  calendar={selectedCalendar}
                  value={endDate}
                  onChange={setEndDate}
                />
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      type="number"
                      placeholder="Year"
                      value={endYear}
                      onChange={(e) => setEndYear(e.target.value)}
                    />
                    <span className="text-[12px] text-t3 mt-0.5 block">Year</span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Month"
                      min={1}
                      max={12}
                      value={endMonth}
                      onChange={(e) => setEndMonth(e.target.value)}
                    />
                    <span className="text-[12px] text-t3 mt-0.5 block">Month</span>
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Day"
                      min={1}
                      max={31}
                      value={endDay}
                      onChange={(e) => setEndDay(e.target.value)}
                    />
                    <span className="text-[12px] text-t3 mt-0.5 block">Day</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parent Event */}
          {parentOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Parent Event (optional)</Label>
              <Select value={parentEventId || "none"} onValueChange={(v) => setParentEventId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="None (top-level)" />
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

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !trackId || (isCustomCalendar ? !startDate : !startYear)}
            >
              {editingEvent ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;
