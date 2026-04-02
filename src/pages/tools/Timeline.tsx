import { Component, useState, useEffect, useCallback, useRef } from "react";
import PageShell from "@/components/layout/PageShell";
import { useWorldId } from "@/hooks/use-world-id";
import type { ReactNode, ErrorInfo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Layers,
  CalendarPlus,
  CalendarDays,
  Timer,
  Construction,
  Link2,
  Eye,
  EyeOff,
  BookTemplate,
  Camera,
  Undo2,
  Redo2,
} from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheets,
  useWorksheet,
  useWorksheetsByType,
  useRenameWorksheet,
} from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import { useTags } from "@/hooks/use-tags";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";

import type { TimelineTrack, TimelineEvent } from "@/lib/timeline/types";
import { initialTimelineState } from "@/lib/timeline/constants";
import { TimelineProvider, useTimeline } from "@/lib/timeline/context";
import { migrateTimelineState } from "@/lib/timeline/migration";

import TimelineView from "@/components/timeline/TimelineView";
import TrackFormDialog from "@/components/timeline/TrackFormDialog";
import EventFormDialog from "@/components/timeline/EventFormDialog";
import EventDetailPanel from "@/components/timeline/EventDetailPanel";
import CalendarEditorDialog from "@/components/timeline/CalendarEditorDialog";
import CompressionEditorDialog from "@/components/timeline/CompressionEditorDialog";
import LinkEditorDialog from "@/components/timeline/LinkEditorDialog";
import ElementPickerDialog from "@/components/timeline/ElementPickerDialog";
import FilterBar from "@/components/timeline/FilterBar";
import CompressionSuggestions from "@/components/timeline/CompressionSuggestions";
import TemplatePicker from "@/components/timeline/TemplatePicker";
import TimelineSummaryTemplate from "@/lib/pdf/templates/TimelineSummaryTemplate";
import TimelineFullReportTemplate from "@/lib/pdf/templates/TimelineFullReportTemplate";
import { captureTimelineAsPNG, downloadBlob } from "@/lib/timeline/visual-export";
import { useTimelinePresence } from "@/hooks/use-timeline-presence";
import { useSubscription } from "@/hooks/use-subscription";
import PresenceAvatars from "@/components/timeline/PresenceAvatars";
import { useTimelineKeyboard } from "@/components/timeline/useTimelineKeyboard";
import { fitAllEvents } from "@/lib/timeline/utils";

const TOOL_TYPE = "timeline";
const LOCAL_STORAGE_KEY = "tl-worksheet";

const Timeline = () => {
  const { state, selectedEventId, canUndo, canRedo, dispatch } = useTimeline();
  const timelineViewRef = useRef<HTMLDivElement>(null);

  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);

  // Track & Event dialogs
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<TimelineTrack | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [defaultTrackId, setDefaultTrackId] = useState<string | undefined>();
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [compressionDialogOpen, setCompressionDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [defaultLinkSourceId, setDefaultLinkSourceId] = useState<string | undefined>();
  const [elementPickerOpen, setElementPickerOpen] = useState(false);
  const [elementPickerEventId, setElementPickerEventId] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  const { toast } = useToast();
  const { user, profile } = useAuth();
  const { worlds } = useWorlds();
  const { isSubscribed } = useSubscription();

  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = useWorldId();
  const worksheetId = searchParams.get("worksheetId");

  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const worldName = currentWorld?.name;

  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined);
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const renameWorksheet = useRenameWorksheet();
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);
  const { updateWorksheetTags } = useTags();
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);

  const { presences } = useTimelinePresence({
    worksheetId: currentWorksheetId || worksheetId,
    userId: user?.id,
    displayName: profile?.display_name || user?.email || "Anonymous",
    avatarUrl: profile?.avatar_url || null,
    enabled: !!worldId && isSubscribed,
  });

  const handleFitAll = useCallback(() => {
    const fit = fitAllEvents(state.events, timelineViewRef.current?.offsetWidth || 1000);
    if (fit) dispatch({ type: "SET_VIEW_STATE", payload: fit });
  }, [state.events, dispatch]);

  useTimelineKeyboard({
    dispatch,
    selectedEventId,
    pixelsPerYear: state.viewState.pixelsPerYear,
    centerYear: state.viewState.centerYear,
    hasEvents: state.events.length > 0,
    hasTracks: state.tracks.length > 0,
    onNewEvent: () => {
      setEditingEvent(null);
      setDefaultTrackId(undefined);
      setEventDialogOpen(true);
    },
    onNewTrack: () => {
      setEditingTrack(null);
      setTrackDialogOpen(true);
    },
    onEditEvent: () => {
      if (selectedEventId) {
        const event = state.events.find((e) => e.id === selectedEventId);
        if (event) {
          setEditingEvent(event);
          setEventDialogOpen(true);
        }
      }
    },
    onDeleteEvent: () => {
      if (selectedEventId) {
        dispatch({ type: "DELETE_EVENT", payload: selectedEventId });
      }
    },
    onFitAll: handleFitAll,
  });

  // Show worksheet selector when worldId is present but no worksheetId
  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

  // Load existing worksheet from Supabase
  useEffect(() => {
    if (existingWorksheet && existingWorksheet.data) {
      try {
        const migrated = migrateTimelineState(existingWorksheet.data);
        dispatch({ type: "SET_STATE", payload: migrated });
        setCurrentWorksheetId(existingWorksheet.id);
        setCurrentWorksheetTitle(existingWorksheet.title);
        if (existingWorksheet.tags) {
          setWorksheetTags(existingWorksheet.tags);
        }
        toast({
          title: "Worksheet Loaded",
          description: "Your saved work has been restored from the cloud.",
        });
      } catch {
        // Ignore parse errors
      }
    }
  }, [existingWorksheet]);

  // Fallback to localStorage if no worldId
  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const migrated = migrateTimelineState(JSON.parse(saved));
          dispatch({ type: "SET_STATE", payload: migrated });
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [worldId, worksheetId]);

  // ─── Track CRUD via dispatch ────────────────────────────────────────

  const handleCreateTrack = useCallback((track: Omit<TimelineTrack, "id" | "order" | "isCollapsed">) => {
    dispatch({ type: "CREATE_TRACK", payload: track });
    setTrackDialogOpen(false);
  }, [dispatch]);

  const handleUpdateTrack = useCallback((updated: TimelineTrack) => {
    dispatch({ type: "UPDATE_TRACK", payload: updated });
    setEditingTrack(null);
    setTrackDialogOpen(false);
  }, [dispatch]);

  const handleEditTrack = useCallback((track: TimelineTrack) => {
    setEditingTrack(track);
    setTrackDialogOpen(true);
  }, []);

  const handleDeleteTrack = useCallback((trackId: string) => {
    dispatch({ type: "DELETE_TRACK", payload: trackId });
  }, [dispatch]);

  const handleToggleCollapse = useCallback((trackId: string) => {
    dispatch({ type: "TOGGLE_COLLAPSE", payload: trackId });
  }, [dispatch]);

  // ─── Event CRUD via dispatch ────────────────────────────────────────

  const handleCreateEvent = useCallback((event: Omit<TimelineEvent, "id">) => {
    dispatch({ type: "CREATE_EVENT", payload: event });
    setEventDialogOpen(false);
  }, [dispatch]);

  const handleUpdateEvent = useCallback((updated: TimelineEvent) => {
    dispatch({ type: "UPDATE_EVENT", payload: updated });
  }, [dispatch]);

  const handleDeleteEvent = useCallback((eventId: string) => {
    dispatch({ type: "DELETE_EVENT", payload: eventId });
  }, [dispatch]);

  // ─── Quick-add from track lane click ───────────────────────────────

  const handleQuickAddEvent = useCallback((trackId: string, _year: number) => {
    setDefaultTrackId(trackId);
    setEditingEvent(null);
    setEventDialogOpen(true);
  }, []);

  // ─── Save & Worksheet Handlers ────────────────────────────────────

  const handleSave = async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));

    if (worldId && user) {
      const worksheetData = state as unknown as Json;
      try {
        if (currentWorksheetId || worksheetId) {
          await updateWorksheet.mutateAsync({
            worksheetId: currentWorksheetId || worksheetId!,
            data: worksheetData,
          });
        } else {
          toast({
            title: "Error",
            description: "Please select or create a worksheet first.",
            variant: "destructive",
          });
        }
      } catch {
        // Error handled by mutation
      }
    } else {
      toast({ title: "Draft Saved", description: "Your work has been saved locally." });
    }
  };

  const handleWorksheetSelect = (selectedWorksheetId: string) => {
    setSearchParams({ worldId: worldId!, worksheetId: selectedWorksheetId });
    setWorksheetSelectorOpen(false);
  };

  const handleWorksheetCreate = async (name: string): Promise<string> => {
    const worksheetData = initialTimelineState as unknown as Json;
    const result = await createWorksheet.mutateAsync({
      worldId: worldId!,
      toolType: TOOL_TYPE,
      title: name,
      data: worksheetData,
    });
    setCurrentWorksheetId(result.id);
    setCurrentWorksheetTitle(result.title);
    setSearchParams({ worldId: worldId!, worksheetId: result.id });
    return result.id;
  };

  const handleRename = async (newTitle: string) => {
    const wsId = currentWorksheetId || worksheetId;
    if (!wsId) return;
    await renameWorksheet.mutateAsync({ worksheetId: wsId, title: newTitle });
    setCurrentWorksheetTitle(newTitle);
  };

  const handleTagsChange = (newTags: string[]) => {
    setWorksheetTags(newTags);
    const wsId = currentWorksheetId || worksheetId;
    if (wsId) {
      updateWorksheetTags.mutate({ worksheetId: wsId, tags: newTags });
    }
  };

  const [capturingPNG, setCapturingPNG] = useState(false);

  const handleCapturePNG = async () => {
    if (!timelineViewRef.current || capturingPNG) return;
    setCapturingPNG(true);
    try {
      const blob = await captureTimelineAsPNG(timelineViewRef.current);
      const filename = `${currentWorksheetTitle || "timeline"}-${new Date().toISOString().slice(0, 10)}.png`;
      downloadBlob(blob, filename);
      toast({ title: "PNG Downloaded", description: "Timeline image saved." });
    } catch (err) {
      console.error("PNG capture failed:", err);
      toast({ title: "Export Failed", description: "Could not capture the timeline as an image.", variant: "destructive" });
    } finally {
      setCapturingPNG(false);
    }
  };

  const selectedEvent = selectedEventId
    ? state.events.find((e) => e.id === selectedEventId) || null
    : null;

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onPrint={() => window.print()}
      onExport={() => setExportDialogOpen(true)}
      onShare={(currentWorksheetId || worksheetId) ? () => setShareDialogOpen(true) : undefined}
      isShared={!!shareConfig?.enabled}
      isCloudEnabled={!!(worldId && user)}
      onNotesClick={() => setNotesSheetOpen(true)}
      onMoodboardClick={() => setMoodboardSheetOpen(true)}
      moodboardCount={state.moodboard?.length || 0}
      extraActions={
        <QuickExportButton
          toolName="Chronolog"
          worldName={worldId ? worldName : undefined}
          formState={state}
          summaryTemplate={
            <TimelineSummaryTemplate formState={state} worldName={worldId ? worldName : undefined} />
          }
          fullTemplate={
            <TimelineFullReportTemplate formState={state} worldName={worldId ? worldName : undefined} />
          }
          defaultFilename="timeline"
        />
      }
      worksheetId={currentWorksheetId || worksheetId}
      worksheetTitle={currentWorksheetTitle}
      onRenameWorksheet={handleRename}
      worksheetLoading={worksheetLoading}
      worksheetTags={worksheetTags}
      onTagsChange={handleTagsChange}
      isLoggedIn={!!user}
    >
        {/* Early Development Banner */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/10 mb-6">
          <Construction className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-200/90">
            <span className="font-semibold">Early Preview.</span>{" "}
            Timeline is in active development and does not represent the final product. Features may change or be incomplete.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1 mr-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => dispatch({ type: "UNDO" })}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7"
              onClick={() => dispatch({ type: "REDO" })}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingTrack(null);
              setTrackDialogOpen(true);
            }}
          >
            <Layers className="w-4 h-4 mr-2" />
            Add Track
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingEvent(null);
              setDefaultTrackId(undefined);
              setEventDialogOpen(true);
            }}
            disabled={state.tracks.length === 0}
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCalendarDialogOpen(true)}
          >
            <CalendarDays className="w-4 h-4 mr-2" />
            Calendars
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCompressionDialogOpen(true)}
          >
            <Timer className="w-4 h-4 mr-2" />
            Compressions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingLinkId(null);
              setDefaultLinkSourceId(undefined);
              setLinkDialogOpen(true);
            }}
            disabled={state.events.length < 2}
          >
            <Link2 className="w-4 h-4 mr-2" />
            Add Link
          </Button>
          <Button
            variant={state.causalityLinksVisible ? "outline" : "ghost"}
            size="sm"
            onClick={() => dispatch({ type: "TOGGLE_LINKS_VISIBLE" })}
            disabled={state.eventLinks.length === 0}
          >
            {state.causalityLinksVisible ? (
              <Eye className="w-4 h-4 mr-2" />
            ) : (
              <EyeOff className="w-4 h-4 mr-2" />
            )}
            Links
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTemplatePickerOpen(true)}
          >
            <BookTemplate className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCapturePNG}
            disabled={state.tracks.length === 0 || capturingPNG}
          >
            <Camera className="w-4 h-4 mr-2" />
            {capturingPNG ? "Capturing..." : "PNG"}
          </Button>
          {presences.length > 0 && (
            <div className="ml-auto">
              <PresenceAvatars presences={presences} />
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <FilterBar />

        {/* Auto-Compression Suggestions */}
        <CompressionSuggestions />

        {/* Main Timeline Visualization */}
        <TimelineView
          ref={timelineViewRef}
          onEditTrack={handleEditTrack}
          onDeleteTrack={handleDeleteTrack}
          onToggleCollapse={handleToggleCollapse}
          onQuickAddEvent={handleQuickAddEvent}
        />

      {/* ─── Dialogs & Panels ─────────────────────────────────────────── */}

      <TrackFormDialog
        open={trackDialogOpen}
        onOpenChange={setTrackDialogOpen}
        onSubmit={editingTrack ? handleUpdateTrack : handleCreateTrack}
        editingTrack={editingTrack}
        usedColors={state.tracks.map((t) => t.color)}
      />

      <EventFormDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onSubmit={editingEvent ? (e) => handleUpdateEvent({ ...e, id: editingEvent.id }) : handleCreateEvent}
        tracks={state.tracks}
        events={state.events}
        editingEvent={editingEvent}
        defaultTrackId={defaultTrackId}
      />

      <EventDetailPanel
        event={selectedEvent}
        tracks={state.tracks}
        events={state.events}
        onClose={() => dispatch({ type: "SELECT_EVENT", payload: null })}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        onAddLink={(sourceEventId) => {
          setEditingLinkId(null);
          setDefaultLinkSourceId(sourceEventId);
          setLinkDialogOpen(true);
        }}
        onEditLink={(linkId) => {
          setEditingLinkId(linkId);
          setDefaultLinkSourceId(undefined);
          setLinkDialogOpen(true);
        }}
        worldId={worldId}
        onAddElementLink={worldId ? (eventId) => {
          setElementPickerEventId(eventId);
          setElementPickerOpen(true);
        } : undefined}
        onDeleteElementLink={(linkId) => {
          dispatch({ type: "DELETE_ELEMENT_LINK", payload: linkId });
        }}
      />

      <WorksheetSelectorDialog
        open={worksheetSelectorOpen}
        onOpenChange={setWorksheetSelectorOpen}
        worldId={worldId!}
        worldName={worldName}
        toolType={TOOL_TYPE}
        toolDisplayName="Timeline"
        worksheets={existingWorksheets}
        onSelect={handleWorksheetSelect}
        onCreate={handleWorksheetCreate}
        isLoading={worksheetsLoading}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Timeline"
        worldName={worldId ? worldName : undefined}
        formState={state}
        summaryTemplate={
          <TimelineSummaryTemplate
            formState={state}
            worldName={worldId ? worldName : undefined}
          />
        }
        fullTemplate={
          <TimelineFullReportTemplate
            formState={state}
            worldName={worldId ? worldName : undefined}
          />
        }
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        worksheetId={currentWorksheetId || worksheetId || undefined}
        worldId={worldId || undefined}
      />

      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        content={state.generalNotes}
        onChange={(html) => dispatch({ type: "UPDATE_NOTES", payload: html })}
      />

      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        worksheetId={currentWorksheetId || worksheetId || "local"}
        images={state.moodboard || []}
        onImagesChange={(images) => dispatch({ type: "UPDATE_MOODBOARD", payload: images })}
      />

      <CalendarEditorDialog
        open={calendarDialogOpen}
        onOpenChange={setCalendarDialogOpen}
      />

      <CompressionEditorDialog
        open={compressionDialogOpen}
        onOpenChange={setCompressionDialogOpen}
      />

      <LinkEditorDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        editingLink={editingLinkId ? state.eventLinks.find((l) => l.id === editingLinkId) : null}
        defaultSourceEventId={defaultLinkSourceId}
      />

      {worldId && (
        <ElementPickerDialog
          open={elementPickerOpen}
          onOpenChange={setElementPickerOpen}
          worldId={worldId}
          onSelect={(worksheetId, worksheetTitle, toolType) => {
            if (elementPickerEventId) {
              dispatch({
                type: "CREATE_ELEMENT_LINK",
                payload: {
                  eventId: elementPickerEventId,
                  worksheetId,
                  worksheetTitle,
                  toolType,
                },
              });
            }
            setElementPickerEventId(null);
          }}
        />
      )}

      <TemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onApply={(templateState) => dispatch({ type: "SET_STATE", payload: templateState })}
        hasExistingData={state.tracks.length > 0 || state.events.length > 0}
      />
    </ToolPageLayout>
  );
};

// Error boundary to catch and display render errors
class TimelineErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Timeline render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <PageShell>
          <main className="container mx-auto px-4 pt-24 pb-16">
            <GlassPanel className="p-8 text-center">
              <h2 className="text-xl font-bold text-destructive mb-4">
                Timeline failed to render
              </h2>
              <pre className="text-left text-sm bg-muted/30 p-4 rounded-lg overflow-auto max-h-64 mb-4">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
              <Button onClick={() => this.setState({ error: null })}>
                Try Again
              </Button>
            </GlassPanel>
          </main>
        </PageShell>
      );
    }
    return this.props.children;
  }
}

const TimelineWithErrorBoundary = () => (
  <TimelineErrorBoundary>
    <TimelineProvider>
      <Timeline />
    </TimelineProvider>
  </TimelineErrorBoundary>
);

export default TimelineWithErrorBoundary;
