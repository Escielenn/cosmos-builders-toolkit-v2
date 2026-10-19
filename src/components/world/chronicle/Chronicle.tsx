import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { mapError } from "@/lib/ship-voice";
import { BRANCHES_OFFLINE } from "@/services/chronicle-branches";
import type { ChronicleWriteResult } from "@/services/chronicle-data";
import { useChronicleBranches } from "@/hooks/use-chronicle-branches";
import { BranchesView } from "./branches/BranchesView";
import { PageContainer, PageHeader, Notice } from "@/components/layout/page-chrome";
import { Button } from "@/components/ui/button";
import { worldCrumbs } from "@/lib/world-crumbs";

/** Chronicle views. BRANCHES = time-travel timelines (?view=branches). */
const VIEWS = [
  { id: "list", label: "Chronicle" },
  { id: "branches", label: "Branches" },
] as const;
type ChronicleView = (typeof VIEWS)[number]["id"];

interface ChronicleProps {
  worldId: string;
}

export function Chronicle({ worldId }: ChronicleProps) {
  const { data, isLoading, error } = useChronicleData(worldId);
  const createEvent = useCreateChronicleEvent(worldId);
  const updateEvent = useUpdateChronicleEvent(worldId);
  const deleteEvent = useDeleteChronicleEvent(worldId);
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const view: ChronicleView = searchParams.get("view") === "branches" ? "branches" : "list";
  const setView = useCallback(
    (v: ChronicleView) => {
      const next = new URLSearchParams(searchParams);
      if (v === "list") next.delete("view");
      else next.set("view", v);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );
  const branchQuery = useChronicleBranches(worldId);
  const branchOptions = useMemo(
    () =>
      branchQuery.data?.available
        ? branchQuery.data.branches.map((b) => ({ id: b.id, name: b.name }))
        : undefined,
    [branchQuery.data],
  );
  const [defaultBranchId, setDefaultBranchId] = useState<string | null>(null);

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
    setDefaultBranchId(null);
    setDialogOpen(true);
  }, []);

  const handleLogOnBranch = useCallback((branchId: string | null) => {
    setEditingEvent(null);
    setDefaultBranchId(branchId);
    setDialogOpen(true);
  }, []);

  const reportWrite = useCallback(
    (result: ChronicleWriteResult, confirmation: string) => {
      if (result.error) {
        toast({ variant: "destructive", description: mapError(result.error) });
        return;
      }
      toast({ description: confirmation });
      if (result.branchesOffline) toast({ description: BRANCHES_OFFLINE });
    },
    [toast]
  );

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
            onSuccess: (result) => reportWrite(result, `EVENT UPDATED: ${input.title}`),
          }
        );
      } else {
        createEvent.mutate(input, {
          onSuccess: (result) => reportWrite(result, `EVENT LOGGED: ${input.title}`),
        });
      }
    },
    [editingEvent, createEvent, updateEvent, reportWrite]
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
      <PageContainer variant="space">
        <Notice tone="danger" label="CHRONICLE UNAVAILABLE">
          The Chronicle could not be read. Retry when ready.
        </Notice>
      </PageContainer>
    );
  }

  const isEmpty = data.events.length === 0 && data.eras.length === 0;

  return (
    <PageContainer variant="space">
      {/* 15-PAGE-CHROME §2: the Chronicle is a world space. Stellar is its
          cascade colour; the title is MD Nichrome like every other space
          (it used to be a 20px Lora italic). */}
      <PageHeader
        size="space"
        breadcrumbs={worldCrumbs({ id: worldId, name: data.worldName }, "Chronicle")}
        eyebrow="CHRONICLE"
        accent="stellar"
        title="Chronicle"
        lede={
          data.calendarConfig.era_label
            ? `Every dated event in this world, on the ${data.calendarConfig.era_label} calendar.`
            : "Every dated event in this world, in order."
        }
        actions={
          <Button variant="sf-primary" size="sf-sm" onClick={handleAddEvent}>
            <Plus className="w-4 h-4 mr-2" aria-hidden />
            Log event
          </Button>
        }
      />

      {/* View toggle */}
      <div className="mb-6 flex border-b border-sf-line-hairline" role="group" aria-label="Chronicle view">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            onClick={() => setView(v.id)}
            className={cn(
              "-mb-px min-h-hit border-b-2 px-4 font-heading text-sf-eyebrow uppercase transition-colors duration-fast ease-sf-out",
              view === v.id
                ? "border-sf-primary-bright text-t1"
                : "border-transparent text-t3 hover:text-t1"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Chronicle hint */}
      <FirstTimeHint hintId="chronicle" icon={ScrollText} className="mb-4" />

      {view === "branches" && (
        <BranchesView
          worldId={worldId}
          data={data}
          onOpenEvent={handleEditEvent}
          onLogEvent={handleLogOnBranch}
        />
      )}

      {/* Empty state */}
      {view === "list" && isEmpty && (
        <EmptyState
          warm
          hideDial
          className="py-24"
          eyebrow="// CHRONICLE"
          title="No events yet."
          description="LOG THE FIRST EVENT TO BEGIN THE CHRONICLE."
        />
      )}

      {/* Timeline */}
      {view === "list" && !isEmpty && (
        <div className="sf-chronicle-timeline max-w-[960px]">
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
                  <span className="font-mono text-[12px] text-t4 mr-2">
                    {era.eventDate}
                  </span>
                  {era.title}
                  {era.endDate && (
                    <span className="text-t4 ml-1">
                      · {era.endDate}
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
            <span className="font-mono text-[12px] uppercase tracking-wide text-t4 mt-2">
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
        branches={branchOptions}
        defaultBranchId={defaultBranchId}
      />

      {/* Delete confirmation */}
      <DeleteEventDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        eventTitle={deletingEvent?.title || ""}
        onConfirm={handleConfirmDelete}
      />
    </PageContainer>
  );
}
