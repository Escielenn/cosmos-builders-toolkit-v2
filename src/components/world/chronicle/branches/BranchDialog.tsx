import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { estimateSortValue } from "@/services/chronicle-data";
import {
  BRANCH_HUES,
  PRIME_LANE,
  formatSortValue,
  resolveEventLane,
  type BranchHue,
  type BranchRecord,
} from "@/lib/chronicle/branches";
import type { BranchInput } from "@/services/chronicle-branches";
import type { ChartEvent } from "./BranchesChart";
import { HUE_CLASSES, HUE_LABELS } from "./branch-hues";

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: BranchRecord | null;
  branches: BranchRecord[];
  events: ChartEvent[];
  eraLabel: string;
  /** Pre-select a divergence event (e.g. "branch from here"). */
  presetEventId?: string | null;
  /** Events / jumps on this branch, for the delete warning. */
  counts?: { events: number; jumps: number };
  saving?: boolean;
  onSave: (input: BranchInput, id?: string) => void;
  onDelete?: (id: string) => void;
}

const selectClass =
  "min-h-hit w-full px-3 text-[16px] text-t1";

function descendantsOf(id: string, branches: BranchRecord[]): Set<string> {
  const out = new Set<string>([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const b of branches) {
      if (b.parentBranchId && out.has(b.parentBranchId) && !out.has(b.id)) {
        out.add(b.id);
        grew = true;
      }
    }
  }
  return out;
}

export function BranchDialog({
  open,
  onOpenChange,
  branch,
  branches,
  events,
  eraLabel,
  presetEventId,
  counts,
  saving,
  onSave,
  onDelete,
}: BranchDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<BranchHue>("azure");
  const [parentId, setParentId] = useState<string>(PRIME_LANE);
  const [mode, setMode] = useState<"event" | "date">("event");
  const [eventId, setEventId] = useState("");
  const [dateText, setDateText] = useState("");
  const [sortValue, setSortValue] = useState(0);
  const [description, setDescription] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Seed the form once per opening; a background refetch must never wipe
  // what the writer is typing.
  const wasOpen = useRef(false);
  useEffect(() => {
    const opening = open && !wasOpen.current;
    wasOpen.current = open;
    if (!opening) return;
    setConfirmDelete(false);
    if (branch) {
      setName(branch.name);
      setColor(branch.color);
      setParentId(branch.parentBranchId ?? PRIME_LANE);
      setMode(branch.divergenceEventId ? "event" : "date");
      setEventId(branch.divergenceEventId ?? "");
      setSortValue(branch.divergenceSortValue ?? 0);
      setDateText(
        branch.divergenceSortValue != null ? formatSortValue(branch.divergenceSortValue) : "",
      );
      setDescription(branch.description ?? "");
    } else {
      const preset = presetEventId ? events.find((e) => e.id === presetEventId) : undefined;
      setName("");
      // Pick the first hue not already in use, so new lanes read apart.
      const used = new Set(branches.map((b) => b.color));
      setColor(BRANCH_HUES.find((h) => h !== "teal" && !used.has(h)) ?? "azure");
      setParentId(preset?.branchId ?? PRIME_LANE);
      setMode(preset || events.length > 0 ? "event" : "date");
      setEventId(preset?.id ?? "");
      setSortValue(preset?.sortValue ?? 0);
      setDateText(preset?.eventDate ?? "");
      setDescription("");
    }
  }, [open, branch, branches, events, presetEventId]);

  const branchIds = useMemo(() => new Set(branches.map((b) => b.id)), [branches]);
  const excluded = useMemo(
    () => (branch ? descendantsOf(branch.id, branches) : new Set<string>()),
    [branch, branches],
  );
  const parentOptions = branches.filter((b) => !excluded.has(b.id));
  const nameOf = (key: string) =>
    key === PRIME_LANE ? "Prime timeline" : branches.find((b) => b.id === key)?.name ?? "Unknown";

  // Events on the chosen parent first; the rest after, labelled.
  const eventOptions = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.sortValue - b.sortValue);
    const onParent = sorted.filter((e) => resolveEventLane(e, branchIds) === parentId);
    const elsewhere = sorted.filter((e) => resolveEventLane(e, branchIds) !== parentId);
    return { onParent, elsewhere };
  }, [events, branchIds, parentId]);

  const chosenEvent = events.find((e) => e.id === eventId);
  const divergence = mode === "event" ? chosenEvent?.sortValue ?? null : dateText.trim() ? sortValue : null;
  const canSave = name.trim().length > 0 && !saving;

  const submit = () => {
    if (!canSave) return;
    onSave(
      {
        name: name.trim(),
        color,
        parentBranchId: parentId === PRIME_LANE ? null : parentId,
        divergenceSortValue: divergence,
        divergenceEventId: mode === "event" && chosenEvent ? chosenEvent.id : null,
        description: description.trim() || null,
      },
      branch?.id,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-sf-eyebrow uppercase text-t1">
            {branch ? "Edit branch" : "Create branch"}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-t2">
            A branch is an alternate timeline. It shares everything with its parent up to the
            divergence point, then runs on its own.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="branch-name">Name</Label>
            <Input
              id="branch-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="The Archive Never Burned"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-parent">Splits from</Label>
            <select
              id="branch-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={selectClass}
            >
              <option value={PRIME_LANE}>Prime timeline</option>
              {parentOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
              Divergence point
            </legend>
            <div className="flex gap-2" role="radiogroup" aria-label="Divergence source">
              {(["event", "date"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "min-h-hit flex-1 border px-3 text-[14px] transition-colors duration-fast ease-sf-out",
                    mode === m
                      ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
                      : "border-sf-line text-t2 hover:border-sf-line-emphasis",
                  )}
                >
                  {m === "event" ? "At an event" : "At a date"}
                </button>
              ))}
            </div>
            {mode === "event" ? (
              events.length === 0 ? (
                <p className="text-[14px] text-t3">No events logged yet. Choose a date instead.</p>
              ) : (
                <select
                  aria-label="Divergence event"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Choose an event…</option>
                  {eventOptions.onParent.length > 0 && (
                    <optgroup label={`On ${nameOf(parentId)}`}>
                      {eventOptions.onParent.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.eventDate} · {e.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {eventOptions.elsewhere.length > 0 && (
                    <optgroup label="On other timelines">
                      {eventOptions.elsewhere.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.eventDate} · {e.title} ({nameOf(resolveEventLane(e, branchIds))})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="branch-date">Date</Label>
                  <Input
                    id="branch-date"
                    value={dateText}
                    onChange={(e) => {
                      setDateText(e.target.value);
                      setSortValue(estimateSortValue(e.target.value));
                    }}
                    placeholder={eraLabel ? `1128 ${eraLabel}` : "1128"}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch-sort">Sort position</Label>
                  <Input
                    id="branch-sort"
                    type="number"
                    value={sortValue}
                    onChange={(e) => setSortValue(Number(e.target.value))}
                    className="font-mono"
                  />
                </div>
              </div>
            )}
            <p className="font-mono text-[12px] text-t4">
              {divergence != null
                ? `SPLITS AT ${formatSortValue(divergence, eraLabel)}`
                : "NO DIVERGENCE SET. THE BRANCH RUNS AS LONG AS ITS PARENT."}
            </p>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[12px] font-medium uppercase tracking-[1.5px] text-t3">
              Colour
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Branch colour">
              {BRANCH_HUES.map((h) => (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={color === h}
                  onClick={() => setColor(h)}
                  className={cn(
                    "flex min-h-hit items-center gap-2 border px-2 text-[14px] transition-colors duration-fast ease-sf-out",
                    color === h
                      ? "border-sf-line-emphasis bg-sf-surface-elevated text-t1"
                      : "border-sf-line text-t2 hover:border-sf-line-emphasis",
                  )}
                >
                  <span className={cn("h-3 w-3", HUE_CLASSES[h].bg)} aria-hidden />
                  {HUE_LABELS[h]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="branch-desc">What changed</Label>
            <Textarea
              id="branch-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="In this timeline the courier reaches the archive an hour early…"
              className="resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sf-line-hairline pt-4">
            {branch && onDelete ? (
              confirmDelete ? (
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-[12px] text-sf-crimson-text">
                    {`// ${counts?.events ?? 0} EVENTS AND ${counts?.jumps ?? 0} JUMP ENDS RETURN TO PRIME.`}
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="destructive" size="sf-sm" onClick={() => onDelete(branch.id)}>
                      Confirm delete
                    </Button>
                    <Button type="button" variant="sf-ghost" size="sf-sm" onClick={() => setConfirmDelete(false)}>
                      Keep
                    </Button>
                  </div>
                </div>
              ) : (
                <Button type="button" variant="sf-ghost" size="sf-sm" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              )
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="sf-ghost" size="sf-sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="sf-primary" size="sf-sm" disabled={!canSave}>
                {branch ? "Save branch" : "Create branch"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
