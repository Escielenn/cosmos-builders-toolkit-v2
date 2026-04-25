import { useState, useCallback, useMemo } from "react";
import { Plus } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  useChronicleData,
  useCreateChronicleEvent,
  useUpdateChronicleEvent,
  useDeleteChronicleEvent,
} from "@/hooks/use-chronicle";
import { computeGaps } from "@/services/chronicle-data";
import type {
  ChronicleEvent,
  CreateEventInput,
} from "@/services/chronicle-data";
import { EventCard } from "./EventCard";
import { ChronicleEventDialog } from "./ChronicleEventDialog";
import { DeleteEventDialog } from "./DeleteEventDialog";
import { useToast } from "@/hooks/use-toast";
import FirstTimeHint from "@/components/onboarding/FirstTimeHint";
import { ScrollText } from "lucide-react";

interface ChronicleProps {
  worldId: string;
}

export function Chronicle({ worldId }: ChronicleProps) {
  const { data, isLoading, error } = useChronicleData(worldId);
  const createEvent = useCreateChronicleEvent(worldId);
  const updateEvent = useUpdateChronicleEvent(worldId);
  const deleteEvent = useDeleteChronicleEvent(worldId);
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChronicleEvent | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState<ChronicleEvent | null>(
    null
  );

  // Build a flat list of events with gaps interspersed for rendering
  const gaps = useMemo(
    () => (data ? computeGaps(data.events) : []),
    [data]
  );

  const gapMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of gaps) {
      map.set(g.afterEventId, g.label);
    }
    return map;
  }, [gaps]);

  // Parent-eligible events (non-child, non-era top-level events)
  const parentOptions = useMemo(
    () =>
      (data?.events || []).filter(
        (e) => e.eventType !== "era" && !e.parentId
      ),
    [data]
  );

  const handleAddEvent = useCallback(() => {
    setEditingEvent(null);
    setDialogOpen(true);
  }, []);

  const handleEditEvent = useCallback((event: ChronicleEvent) => {
    setEditingEvent(event);
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(
    (input: CreateEventInput) => {
      if (editingEvent) {
        updateEvent.mutate(
          { eventId: editingEvent.id, updates: input },
          {
            onSuccess: () => {
              toast({
                description: `EVENT UPDATED: ${input.title}`,
              });
            },
          }
        );
      } else {
        createEvent.mutate(input, {
          onSuccess: () => {
            toast({
              description: `EVENT LOGGED: ${input.title}`,
            });
          },
        });
      }
    },
    [editingEvent, createEvent, updateEvent, toast]
  );

  const handleRequestDelete = useCallback((eventId: string) => {
    const ev = data?.events.find((e) => e.id === eventId);
    if (ev) {
      setDeletingEvent(ev);
      setDeleteDialogOpen(true);
      setDialogOpen(false);
    }
  }, [data]);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingEvent) return;
    deleteEvent.mutate(deletingEvent.id, {
      onSuccess: () => {
        toast({
          description: `EVENT REMOVED: ${deletingEvent.title}`,
        });
        setDeletingEvent(null);
      },
    });
  }, [deletingEvent, deleteEvent, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="sm" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-sf-crimson/70">
          CHRONICLE UNAVAILABLE. RETRY WHEN READY.
        </p>
      </div>
    );
  }

  const isEmpty = data.events.length === 0 && data.eras.length === 0;

  return (
    <div className="sf-chronicle">
      {/* Header */}
      <div className="sf-chronicle-header">
        <div>
          <h1 className="sf-chronicle-heading">Chronicle</h1>
          <p className="font-mono text-[9px] uppercase tracking-[2px] text-t3/30 mt-1">
            {data.worldName}
            {data.calendarConfig.era_label && (
              <span>
                {" "}
                &middot; {data.calendarConfig.era_label}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddEvent}
          className="sf-fill-sweep px-3 py-1.5 border border-sf-teal/20 text-sf-teal/80 text-[11px] font-mono uppercase tracking-[0.18em] flex items-center gap-1.5 hover:text-sf-teal-bright transition-colors duration-base"
        >
          <Plus className="w-3 h-3" />
          LOG EVENT
        </button>
      </div>

      {/* Chronicle hint */}
      <FirstTimeHint hintId="chronicle" icon={ScrollText} className="mb-4" />

      {/* Empty state */}
      {isEmpty && (
        <div className="flex items-center justify-center py-32">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-t4 text-center max-w-xs leading-relaxed">
            // CHRONICLE INDEX: EMPTY.
            <br />
            LOG THE FIRST EVENT TO BEGIN YOUR CHRONICLE.
          </p>
        </div>
      )}

      {/* Timeline */}
      {!isEmpty && (
        <div className="sf-chronicle-timeline">
          {/* Spine */}
          <div className="sf-chronicle-spine" />

          {/* Eras (background context) */}
          {data.eras.length > 0 && (
            <div className="sf-chronicle-eras">
              {data.eras.map((era) => (
                <button
                  key={era.id}
                  type="button"
                  onClick={() => handleEditEvent(era)}
                  className="sf-chronicle-era-badge"
                  data-layer={era.layer || undefined}
                >
                  <span className="font-mono text-[8px] text-t3/25 mr-2">
                    {era.eventDate}
                  </span>
                  {era.title}
                  {era.endDate && (
                    <span className="text-t3/25 ml-1">
                      — {era.endDate}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Events */}
          <div className="sf-chronicle-events">
            {data.events.map((event, index) => {
              const side: "left" | "right" =
                index % 2 === 0 ? "left" : "right";
              const gapLabel = gapMap.get(event.id);

              return (
                <div key={event.id}>
                  {/* Event row: card + marker */}
                  <div
                    className={`sf-chronicle-row sf-chronicle-row--${side}`}
                  >
                    {/* Marker on spine */}
                    <div
                      className={`sf-chronicle-marker ${event.eventType === "era" || event.eventType === "war" ? "sf-chronicle-marker--duration" : ""}`}
                    />

                    <EventCard
                      event={event}
                      side={side}
                      calendarConfig={data.calendarConfig}
                      worldId={worldId}
                      onEdit={handleEditEvent}
                    />
                  </div>

                  {/* Gap between this and next event */}
                  {gapLabel && (
                    <div className="sf-chronicle-gap">
                      <div className="sf-chronicle-gap-line" />
                      <span className="sf-chronicle-gap-label">
                        {gapLabel}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* End marker */}
          <div className="sf-chronicle-end">
            <div className="sf-chronicle-end-marker" />
            <span className="font-mono text-[8px] uppercase tracking-[2px] text-t3/15 mt-2">
              Present
            </span>
          </div>
        </div>
      )}

      {/* Add/Edit dialog */}
      <ChronicleEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        worldId={worldId}
        event={editingEvent}
        parentEvents={parentOptions}
        onSubmit={handleSubmit}
        onDelete={handleRequestDelete}
      />

      {/* Delete confirmation */}
      <DeleteEventDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        eventTitle={deletingEvent?.title || ""}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
