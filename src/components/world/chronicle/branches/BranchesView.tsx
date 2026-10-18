// ---------------------------------------------------------------------------
// BranchesView — time-travel timelines as a view of the Chronicle.
//
// Law VII: this view absorbs the standalone "time travel timeline" tool that
// was never built (Jason chose a Chronicle view over a /tools route), and is
// the landing spot for the Timeline tool's multi-track lanes and causality
// arcs when that tool merges into the Chronicle (05-NEW-SYSTEMS B2).
//
// Every surface is two-way (Law III): every mark opens the editor for the
// thing it draws; advisories cite marks and highlight them, never fix them.
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, GitBranch, Plus, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { useToast } from "@/hooks/use-toast";
import { mapError } from "@/lib/ship-voice";
import { cn } from "@/lib/utils";
import {
  PRIME_LANE,
  buildLaneLayout,
  computeDomain,
  detectBranchAdvisories,
  formatSortValue,
  resolveBranchLane,
  resolveEventLane,
  type BranchAdvisory,
  type JumpRecord,
  type Lane,
} from "@/lib/chronicle/branches";
import type { ChronicleData, ChronicleEvent } from "@/services/chronicle-data";
import {
  BRANCHES_OFFLINE,
  BranchesOfflineError,
  type BranchInput,
  type JumpInput,
} from "@/services/chronicle-branches";
import {
  useChronicleBranches,
  useDeleteChronicleBranch,
  useDeleteChronicleJump,
  useSaveChronicleBranch,
  useSaveChronicleJump,
} from "@/hooks/use-chronicle-branches";
import { BranchesChart, type ChartEvent, type FitRequest, type MarkId } from "./BranchesChart";
import { BranchDialog } from "./BranchDialog";
import { JumpDialog } from "./JumpDialog";
import { HUE_CLASSES, PRIME_HUE } from "./branch-hues";

interface BranchesViewProps {
  worldId: string;
  data: ChronicleData;
  onOpenEvent: (event: ChronicleEvent) => void;
  onLogEvent: (branchId: string | null) => void;
}

function flatten(events: ChronicleEvent[]): ChronicleEvent[] {
  const out: ChronicleEvent[] = [];
  const walk = (list: ChronicleEvent[]) => {
    for (const e of list) {
      out.push(e);
      walk(e.children);
    }
  };
  walk(events);
  return out;
}

const toChart = (e: ChronicleEvent): ChartEvent => ({
  id: e.id,
  title: e.title,
  eventDate: e.eventDate,
  sortValue: e.sortValue,
  endSortValue: e.endSortValue,
  branchId: e.branchId,
  linkedEntryId: e.linkedEntryId,
  tags: e.tags,
  eventType: e.eventType,
});

function citedMarks(a: BranchAdvisory): MarkId[] {
  return [
    ...a.eventIds.map((id) => `event:${id}`),
    ...a.jumpIds.map((id) => `jump:${id}`),
    ...a.branchIds.map((id) => `lane:${id}`),
  ];
}

export function BranchesView({ worldId, data, onOpenEvent, onLogEvent }: BranchesViewProps) {
  const { toast } = useToast();
  const branchQuery = useChronicleBranches(worldId);
  const saveBranch = useSaveChronicleBranch(worldId);
  const deleteBranch = useDeleteChronicleBranch(worldId);
  const saveJump = useSaveChronicleJump(worldId);
  const deleteJump = useDeleteChronicleJump(worldId);

  const available = branchQuery.data?.available ?? false;
  const branches = useMemo(() => branchQuery.data?.branches ?? [], [branchQuery.data]);
  const jumps = useMemo(() => branchQuery.data?.jumps ?? [], [branchQuery.data]);
  const eraLabel = data.calendarConfig.era_label;

  const allEvents = useMemo(() => flatten(data.events), [data.events]);
  const eventById = useMemo(() => {
    const m = new Map<string, ChronicleEvent>();
    for (const e of [...allEvents, ...data.eras]) m.set(e.id, e);
    return m;
  }, [allEvents, data.eras]);
  const chartEvents = useMemo(() => allEvents.map(toChart), [allEvents]);
  const chartEras = useMemo(() => data.eras.map(toChart), [data.eras]);

  const branchIds = useMemo(() => new Set(branches.map((b) => b.id)), [branches]);
  const lanes = useMemo(() => buildLaneLayout(branches, chartEvents), [branches, chartEvents]);
  const laneByKey = useMemo(() => new Map(lanes.map((l) => [l.key, l])), [lanes]);
  const domain = useMemo(
    () => computeDomain([...chartEvents, ...chartEras], branches, jumps),
    [chartEvents, chartEras, branches, jumps],
  );
  const advisories = useMemo(
    () => detectBranchAdvisories(branches, chartEvents, jumps, eraLabel),
    [branches, chartEvents, jumps, eraLabel],
  );

  const [active, setActive] = useState<MarkId | null>(null);
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [fitRequest, setFitRequest] = useState<FitRequest | null>(null);
  const highlight = useMemo(() => {
    const a = advisories.find((x) => x.id === inspecting);
    return new Set<MarkId>(a ? citedMarks(a) : []);
  }, [advisories, inspecting]);

  const [branchDialog, setBranchDialog] = useState<{ open: boolean; id: string | null; presetEventId?: string | null }>({
    open: false,
    id: null,
  });
  const [jumpDialog, setJumpDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const offline = useCallback(() => {
    toast({ description: BRANCHES_OFFLINE });
  }, [toast]);

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof BranchesOfflineError) offline();
      else toast({ variant: "destructive", description: mapError(err) });
    },
    [offline, toast],
  );

  const openBranch = useCallback(
    (id: string | null, presetEventId?: string | null) => {
      if (!available) {
        offline();
        return;
      }
      setBranchDialog({ open: true, id, presetEventId });
    },
    [available, offline],
  );

  const openJump = useCallback(
    (id: string | null) => {
      if (!available) {
        offline();
        return;
      }
      setJumpDialog({ open: true, id });
    },
    [available, offline],
  );

  const handleSaveBranch = (input: BranchInput, id?: string) => {
    saveBranch.mutate(
      { id, input },
      {
        onSuccess: () => {
          toast({ description: id ? `BRANCH REVISED: ${input.name}` : `BRANCH LOGGED: ${input.name}` });
          setBranchDialog({ open: false, id: null });
        },
        onError: fail,
      },
    );
  };

  const handleDeleteBranch = (id: string) => {
    const name = branches.find((b) => b.id === id)?.name ?? "";
    deleteBranch.mutate(id, {
      onSuccess: () => {
        toast({ description: `BRANCH REMOVED: ${name}` });
        setBranchDialog({ open: false, id: null });
      },
      onError: fail,
    });
  };

  const handleSaveJump = (input: JumpInput, id?: string) => {
    saveJump.mutate(
      { id, input },
      {
        onSuccess: () => {
          toast({ description: id ? "JUMP REVISED." : "JUMP LOGGED." });
          setJumpDialog({ open: false, id: null });
        },
        onError: fail,
      },
    );
  };

  const handleDeleteJump = (id: string) => {
    deleteJump.mutate(id, {
      onSuccess: () => {
        toast({ description: "JUMP REMOVED." });
        setJumpDialog({ open: false, id: null });
      },
      onError: fail,
    });
  };

  const handleOpenLane = (key: string) => {
    if (key === PRIME_LANE) {
      onLogEvent(null);
      return;
    }
    openBranch(key);
  };

  const inspect = (a: BranchAdvisory) => {
    if (inspecting === a.id) {
      setInspecting(null);
      return;
    }
    setInspecting(a.id);
    const values: number[] = [];
    for (const id of a.eventIds) {
      const e = eventById.get(id);
      if (e) values.push(e.sortValue);
    }
    for (const id of a.jumpIds) {
      const j = jumps.find((x) => x.id === id);
      if (j) values.push(j.fromSortValue, j.toSortValue);
    }
    for (const id of a.branchIds) {
      const lane = laneByKey.get(id);
      if (lane && Number.isFinite(lane.start)) values.push(lane.start);
    }
    if (values.length) setFitRequest({ values, nonce: Date.now() });
  };

  const editingBranch = branchDialog.id ? branches.find((b) => b.id === branchDialog.id) ?? null : null;
  const editingJump = jumpDialog.id ? jumps.find((j) => j.id === jumpDialog.id) ?? null : null;
  const branchCounts = useMemo(() => {
    if (!editingBranch) return undefined;
    return {
      events: allEvents.filter((e) => e.branchId === editingBranch.id).length,
      jumps: jumps.reduce(
        (n, j) => n + (j.fromBranchId === editingBranch.id ? 1 : 0) + (j.toBranchId === editingBranch.id ? 1 : 0),
        0,
      ),
    };
  }, [editingBranch, allEvents, jumps]);

  const isEmpty = branches.length === 0 && jumps.length === 0;

  if (branchQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-heading text-sf-eyebrow uppercase text-t4">
          {`// ${lanes.length} ${lanes.length === 1 ? "TIMELINE" : "TIMELINES"} · ${jumps.length} ${
            jumps.length === 1 ? "JUMP" : "JUMPS"
          }`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="sf-ghost" size="sf-sm" onClick={() => openBranch(null)}>
            <GitBranch aria-hidden />
            Create branch
          </Button>
          <Button variant="sf-ghost" size="sf-sm" onClick={() => openJump(null)}>
            <Route aria-hidden />
            Log jump
          </Button>
        </div>
      </div>

      {isEmpty && (
        <div className="flex flex-col gap-3 border border-sf-line bg-sf-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="sf-measure font-serif text-[16px] italic text-t2">
            A branch is the world as it would be if one thing had gone differently. Fork it from any
            event, then log the travellers who cross between timelines.
          </p>
          <Button variant="sf-primary" size="sf-sm" onClick={() => openBranch(null)} className="shrink-0">
            <Plus aria-hidden />
            Create branch
          </Button>
        </div>
      )}

      <BranchesChart
        lanes={lanes}
        events={chartEvents}
        eras={chartEras}
        jumps={jumps}
        branchIds={branchIds}
        domain={domain}
        eraLabel={eraLabel}
        highlight={highlight}
        active={active}
        // Sticky: the readout keeps the last mark so its links stay reachable.
        onActiveChange={(id) => id && setActive(id)}
        onOpenEvent={(id) => {
          const e = eventById.get(id);
          if (e) onOpenEvent(e);
        }}
        onOpenJump={(id) => openJump(id)}
        onOpenLane={handleOpenLane}
        fitRequest={fitRequest}
      />

      {/* Details for whatever is hovered or focused */}
      <div aria-live="polite" className="min-h-[72px] border border-sf-line-hairline bg-sf-surface px-4 py-3">
        <MarkDetails
          id={active}
          worldId={worldId}
          eraLabel={eraLabel}
          eventById={eventById}
          laneByKey={laneByKey}
          branchIds={branchIds}
          jumps={jumps}
          onEditEvent={(e) => onOpenEvent(e)}
          onBranchFrom={(eventId) => openBranch(null, eventId)}
          onEditJump={(jid) => openJump(jid)}
          onEditLane={handleOpenLane}
        />
      </div>

      {/* Advisories */}
      <section aria-labelledby="branch-advisories" className="border border-sf-line bg-sf-surface">
        <h2
          id="branch-advisories"
          className="border-b border-sf-line-hairline px-4 py-3 font-heading text-sf-eyebrow uppercase text-t4"
        >
          {`// ADVISORIES · ${advisories.length}`}
        </h2>
        {advisories.length === 0 ? (
          <p className="px-4 py-4 font-mono text-[12px] text-t3">NO PARADOX ON FILE.</p>
        ) : (
          <ul className="divide-y divide-sf-line-hairline">
            {advisories.map((a) => {
              const on = inspecting === a.id;
              return (
                <li key={a.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-mono text-[12px] text-sf-crimson-text">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-sf-crimson" aria-hidden />
                      {`// ${a.title}`}
                    </p>
                    <p className="sf-measure mt-1 text-[14px] text-t2">{a.detail}</p>
                    <ul className="mt-1 flex flex-wrap gap-x-3 text-[14px] text-t3">
                      {a.eventIds.map((id) => (
                        <li key={id}>{eventById.get(id)?.title ?? "Event"}</li>
                      ))}
                      {a.jumpIds.map((id) => (
                        <li key={id}>
                          Jump: {jumps.find((j) => j.id === id)?.travelerLabel || "Traveller"}
                        </li>
                      ))}
                      {a.branchIds.map((id) => (
                        <li key={id}>Branch: {laneByKey.get(id)?.branch?.name ?? "Prime"}</li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    variant="sf-ghost"
                    size="sf-sm"
                    aria-pressed={on}
                    onClick={() => inspect(a)}
                    className={cn("shrink-0", on && "border-sf-crimson text-sf-crimson-text")}
                  >
                    {on ? "Clear" : "Show"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <BranchDialog
        open={branchDialog.open}
        onOpenChange={(open) => setBranchDialog((s) => ({ ...s, open }))}
        branch={editingBranch}
        branches={branches}
        events={chartEvents}
        eraLabel={eraLabel}
        presetEventId={branchDialog.presetEventId}
        counts={branchCounts}
        saving={saveBranch.isPending}
        onSave={handleSaveBranch}
        onDelete={handleDeleteBranch}
      />

      <JumpDialog
        open={jumpDialog.open}
        onOpenChange={(open) => setJumpDialog((s) => ({ ...s, open }))}
        worldId={worldId}
        jump={editingJump}
        branches={branches}
        eraLabel={eraLabel}
        saving={saveJump.isPending}
        onSave={handleSaveJump}
        onDelete={handleDeleteJump}
      />
    </div>
  );
}

// ── Details readout ─────────────────────────────────────────────

function laneLabel(lane: Lane | undefined): string {
  return lane?.branch ? lane.branch.name : "Prime timeline";
}

function MarkDetails({
  id,
  worldId,
  eraLabel,
  eventById,
  laneByKey,
  branchIds,
  jumps,
  onEditEvent,
  onBranchFrom,
  onEditJump,
  onEditLane,
}: {
  id: MarkId | null;
  worldId: string;
  eraLabel: string;
  eventById: Map<string, ChronicleEvent>;
  laneByKey: Map<string, Lane>;
  branchIds: ReadonlySet<string>;
  jumps: JumpRecord[];
  onEditEvent: (e: ChronicleEvent) => void;
  onBranchFrom: (eventId: string) => void;
  onEditJump: (jumpId: string) => void;
  onEditLane: (laneKey: string) => void;
}) {
  if (!id) {
    return (
      <p className="text-[14px] text-t3">
        Hover or focus a mark to read it here. Select a mark to edit it.
      </p>
    );
  }
  const [kind, key] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)];

  if (kind === "event") {
    const e = eventById.get(key);
    if (!e) return null;
    const lane = laneByKey.get(resolveEventLane(e, branchIds));
    return (
      <div className="space-y-1">
        <p className="text-[16px] text-t1">{e.title}</p>
        <p className="font-mono text-[12px] text-t4">
          {e.eventDate}
          {e.endDate ? ` – ${e.endDate}` : ""} · {e.eventType.toUpperCase()} · {laneLabel(lane).toUpperCase()}
        </p>
        {e.description && <p className="sf-measure line-clamp-2 text-[14px] text-t2">{e.description}</p>}
        {e.linkedEntryId && (
          <Link
            to={`/worlds/${worldId}/codex/${e.linkedEntryId}`}
            className="text-[14px] text-sf-primary-text underline-offset-4 hover:underline"
          >
            {e.linkedEntryTitle ?? "Linked entity"}
          </Link>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="sf-ghost" size="sf-sm" onClick={() => onEditEvent(e)}>
            Edit event
          </Button>
          {e.eventType !== "era" && (
            <Button variant="sf-ghost" size="sf-sm" onClick={() => onBranchFrom(e.id)}>
              <GitBranch aria-hidden />
              Branch from here
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (kind === "jump") {
    const j = jumps.find((x) => x.id === key);
    if (!j) return null;
    const from = laneByKey.get(resolveBranchLane(j.fromBranchId, branchIds));
    const to = laneByKey.get(resolveBranchLane(j.toBranchId, branchIds));
    return (
      <div className="space-y-1">
        <p className="text-[16px] text-t1">
          {j.travelerEntryId ? (
            <Link
              to={`/worlds/${worldId}/codex/${j.travelerEntryId}`}
              className="text-sf-primary-text underline-offset-4 hover:underline"
            >
              {j.travelerLabel || "Traveller"}
            </Link>
          ) : (
            j.travelerLabel || "Traveller"
          )}
          {j.method && <span className="text-t3"> · {j.method}</span>}
        </p>
        <p className="font-mono text-[12px] text-t4">
          {formatSortValue(j.fromSortValue, eraLabel)} {laneLabel(from).toUpperCase()} →{" "}
          {formatSortValue(j.toSortValue, eraLabel)} {laneLabel(to).toUpperCase()}
          {j.properDuration ? ` · τ ${j.properDuration}` : ""}
        </p>
        {j.notes && <p className="sf-measure line-clamp-2 text-[14px] text-t2">{j.notes}</p>}
        <div className="pt-1">
          <Button variant="sf-ghost" size="sf-sm" onClick={() => onEditJump(j.id)}>
            Edit jump
          </Button>
        </div>
      </div>
    );
  }

  const lane = laneByKey.get(key);
  if (!lane) return null;
  const hue = HUE_CLASSES[lane.branch?.color ?? PRIME_HUE];
  const parent = lane.parentKey ? laneByKey.get(lane.parentKey) : undefined;
  return (
    <div className="space-y-1">
      <p className={cn("text-[16px]", hue.text)}>{laneLabel(lane)}</p>
      <p className="font-mono text-[12px] text-t4">
        {lane.branch
          ? `SPLITS FROM ${laneLabel(parent).toUpperCase()}${
              Number.isFinite(lane.start) ? ` AT ${formatSortValue(lane.start, eraLabel)}` : ""
            }`
          : "THE MAIN TIMELINE. SELECT TO LOG AN EVENT."}
      </p>
      {lane.branch?.description && (
        <p className="sf-measure line-clamp-2 text-[14px] text-t2">{lane.branch.description}</p>
      )}
      <div className="pt-1">
        <Button variant="sf-ghost" size="sf-sm" onClick={() => onEditLane(lane.key)}>
          {lane.branch ? "Edit branch" : "Log event"}
        </Button>
      </div>
    </div>
  );
}
