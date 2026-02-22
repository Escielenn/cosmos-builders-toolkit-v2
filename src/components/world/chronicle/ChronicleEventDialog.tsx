import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  EVENT_TYPES,
  CHRONICLE_LAYERS,
  estimateSortValue,
} from "@/services/chronicle-data";
import type { ChronicleEvent, CreateEventInput } from "@/services/chronicle-data";

interface ChronicleEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  event?: ChronicleEvent | null;
  parentEvents?: ChronicleEvent[];
  onSubmit: (input: CreateEventInput) => void;
  onDelete?: (eventId: string) => void;
}

export function ChronicleEventDialog({
  open,
  onOpenChange,
  worldId,
  event,
  parentEvents = [],
  onSubmit,
  onDelete,
}: ChronicleEventDialogProps) {
  const isEditing = !!event;

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [sortValue, setSortValue] = useState(0);
  const [isDuration, setIsDuration] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [endSortValue, setEndSortValue] = useState(0);
  const [eventType, setEventType] = useState("event");
  const [layer, setLayer] = useState("");
  const [description, setDescription] = useState("");
  const [linkedEntryId, setLinkedEntryId] = useState("");
  const [parentId, setParentId] = useState("");
  const [entrySearch, setEntrySearch] = useState("");
  const [entryResults, setEntryResults] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [linkedEntryTitle, setLinkedEntryTitle] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (event) {
      setTitle(event.title);
      setEventDate(event.eventDate);
      setSortValue(event.sortValue);
      setIsDuration(!!event.endDate);
      setEndDate(event.endDate || "");
      setEndSortValue(event.endSortValue || 0);
      setEventType(event.eventType);
      setLayer(event.layer || "");
      setDescription(event.description || "");
      setLinkedEntryId(event.linkedEntryId || "");
      setLinkedEntryTitle(event.linkedEntryTitle || "");
      setParentId(event.parentId || "");
    } else {
      setTitle("");
      setEventDate("");
      setSortValue(0);
      setIsDuration(false);
      setEndDate("");
      setEndSortValue(0);
      setEventType("event");
      setLayer("");
      setDescription("");
      setLinkedEntryId("");
      setLinkedEntryTitle("");
      setParentId("");
    }
    setEntrySearch("");
    setEntryResults([]);
  }, [open, event]);

  const handleDateChange = useCallback((val: string) => {
    setEventDate(val);
    setSortValue(estimateSortValue(val));
  }, []);

  const handleEndDateChange = useCallback((val: string) => {
    setEndDate(val);
    setEndSortValue(estimateSortValue(val));
  }, []);

  // Search wiki entries for linking
  const handleEntrySearch = useCallback(
    async (query: string) => {
      setEntrySearch(query);
      if (query.length < 2) {
        setEntryResults([]);
        return;
      }
      const { data } = await supabase
        .from("world_entries")
        .select("id, title")
        .eq("world_id", worldId)
        .ilike("title", `%${query}%`)
        .limit(6);
      setEntryResults(data || []);
    },
    [worldId]
  );

  const handleSubmit = () => {
    if (!title.trim() || !eventDate.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      eventDate: eventDate.trim(),
      sortValue,
      endDate: isDuration && endDate.trim() ? endDate.trim() : undefined,
      endSortValue: isDuration && endDate.trim() ? endSortValue : undefined,
      eventType,
      layer: layer || undefined,
      parentId: parentId || undefined,
      linkedEntryId: linkedEntryId || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#0C1019] border-border/10 rounded-none p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="sf-tool-section text-left">
            {isEditing ? "Edit Event" : "New Event"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="sf-chronicle-form-label">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Divine Order Is Founded"
              className="rounded-none bg-transparent border-border/15 font-[--sf-font-body]"
            />
          </div>

          {/* Date + Sort */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="sf-chronicle-form-label">
                Date (display)
              </label>
              <Input
                value={eventDate}
                onChange={(e) => handleDateChange(e.target.value)}
                placeholder="1128 EO"
                className="rounded-none bg-transparent border-border/15 font-mono text-sm"
              />
            </div>
            <div>
              <label className="sf-chronicle-form-label">Sort Position</label>
              <Input
                type="number"
                value={sortValue}
                onChange={(e) => setSortValue(Number(e.target.value))}
                className="rounded-none bg-transparent border-border/15 font-mono text-sm"
              />
            </div>
          </div>

          {/* Duration toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-duration"
              checked={isDuration}
              onChange={(e) => setIsDuration(e.target.checked)}
              className="rounded-none"
            />
            <label
              htmlFor="is-duration"
              className="sf-chronicle-form-label cursor-pointer !mb-0"
            >
              Duration event
            </label>
          </div>

          {isDuration && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="sf-chronicle-form-label">End Date</label>
                <Input
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  placeholder="1350 EO"
                  className="rounded-none bg-transparent border-border/15 font-mono text-sm"
                />
              </div>
              <div>
                <label className="sf-chronicle-form-label">
                  End Sort Position
                </label>
                <Input
                  type="number"
                  value={endSortValue}
                  onChange={(e) => setEndSortValue(Number(e.target.value))}
                  className="rounded-none bg-transparent border-border/15 font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Event Type */}
          <div>
            <label className="sf-chronicle-form-label">Event Type</label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="rounded-none bg-transparent border-border/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="rounded-none">
                    {t.replace(/_/g, " ").toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Layer */}
          <div>
            <label className="sf-chronicle-form-label">Layer</label>
            <Select value={layer || "none"} onValueChange={(v) => setLayer(v === "none" ? "" : v)}>
              <SelectTrigger className="rounded-none bg-transparent border-border/15">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="none" className="rounded-none">
                  NONE
                </SelectItem>
                {CHRONICLE_LAYERS.map((l) => (
                  <SelectItem key={l} value={l} className="rounded-none">
                    {l.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="sf-chronicle-form-label">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this event..."
              rows={3}
              className="rounded-none bg-transparent border-border/15 font-[--sf-font-body] text-sm resize-none"
            />
          </div>

          {/* Linked Wiki Page */}
          <div>
            <label className="sf-chronicle-form-label">
              Link to Wiki Page
            </label>
            {linkedEntryId ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-border/15 text-sm">
                <span className="text-[#5B8DEF] font-medium truncate flex-1">
                  {linkedEntryTitle}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLinkedEntryId("");
                    setLinkedEntryTitle("");
                  }}
                  className="text-muted-foreground/30 hover:text-muted-foreground/60 text-[9px] uppercase tracking-wider"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  value={entrySearch}
                  onChange={(e) => handleEntrySearch(e.target.value)}
                  placeholder="Search elements..."
                  className="rounded-none bg-transparent border-border/15 text-sm"
                />
                {entryResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[#0C1019] border border-border/15">
                    {entryResults.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => {
                          setLinkedEntryId(entry.id);
                          setLinkedEntryTitle(entry.title);
                          setEntrySearch("");
                          setEntryResults([]);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-white/5 truncate"
                      >
                        {entry.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parent Event */}
          {parentEvents.length > 0 && (
            <div>
              <label className="sf-chronicle-form-label">
                Parent Event (if sub-event)
              </label>
              <Select value={parentId || "none"} onValueChange={(v) => setParentId(v === "none" ? "" : v)}>
                <SelectTrigger className="rounded-none bg-transparent border-border/15">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="none" className="rounded-none">
                    NONE
                  </SelectItem>
                  {parentEvents.map((pe) => (
                    <SelectItem
                      key={pe.id}
                      value={pe.id}
                      className="rounded-none"
                    >
                      {pe.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/8">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(event!.id)}
                className="sf-fill-sweep sf-fill-sweep--secondary px-3 py-1.5 border border-destructive/20 text-destructive/70 text-[10px] uppercase tracking-wider"
              >
                Delete
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="sf-fill-sweep sf-fill-sweep--secondary px-4 py-1.5 border border-border/15 text-[10px] uppercase tracking-wider text-muted-foreground/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim() || !eventDate.trim()}
                className="sf-fill-sweep px-4 py-1.5 border border-[#3DFFCD]/20 text-[#3DFFCD]/80 text-[10px] uppercase tracking-wider disabled:opacity-30 disabled:pointer-events-none"
              >
                {isEditing ? "Save" : "Log Event"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
