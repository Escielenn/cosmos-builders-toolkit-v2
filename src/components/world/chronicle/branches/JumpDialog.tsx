import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Gauge } from "lucide-react";
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
import { estimateSortValue } from "@/services/chronicle-data";
import {
  PRIME_LANE,
  computeProperDuration,
  formatSortValue,
  type BranchRecord,
  type JumpRecord,
} from "@/lib/chronicle/branches";
import type { JumpInput } from "@/services/chronicle-branches";
import { useEntities } from "@/hooks/use-entity-graph";
import { ENTITY_TYPE_LABELS } from "@/services/entity-graph-types";

interface JumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  jump: JumpRecord | null;
  branches: BranchRecord[];
  eraLabel: string;
  saving?: boolean;
  onSave: (input: JumpInput, id?: string) => void;
  onDelete?: (id: string) => void;
}

const selectClass =
  "min-h-hit w-full px-3 text-[16px] text-t1";

const FREE_TEXT = "__free__";

interface EndpointState {
  branch: string;
  date: string;
  sort: number;
}

function Endpoint({
  idPrefix,
  legend,
  value,
  onChange,
  branches,
  eraLabel,
}: {
  idPrefix: string;
  legend: string;
  value: EndpointState;
  onChange: (v: EndpointState) => void;
  branches: BranchRecord[];
  eraLabel: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-[12px] font-medium uppercase tracking-[1.5px] text-t3">{legend}</legend>
      <select
        aria-label={`${legend} timeline`}
        value={value.branch}
        onChange={(e) => onChange({ ...value, branch: e.target.value })}
        className={selectClass}
      >
        <option value={PRIME_LANE}>Prime timeline</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-date`}>Date</Label>
          <Input
            id={`${idPrefix}-date`}
            value={value.date}
            onChange={(e) =>
              onChange({ ...value, date: e.target.value, sort: estimateSortValue(e.target.value) })
            }
            placeholder={eraLabel ? `2340 ${eraLabel}` : "2340"}
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-sort`}>Sort position</Label>
          <Input
            id={`${idPrefix}-sort`}
            type="number"
            value={value.sort}
            onChange={(e) => onChange({ ...value, sort: Number(e.target.value) })}
            className="font-mono"
          />
        </div>
      </div>
    </fieldset>
  );
}

export function JumpDialog({
  open,
  onOpenChange,
  worldId,
  jump,
  branches,
  eraLabel,
  saving,
  onSave,
  onDelete,
}: JumpDialogProps) {
  const { data: entities } = useEntities(worldId);
  const [travelerId, setTravelerId] = useState<string>(FREE_TEXT);
  const [label, setLabel] = useState("");
  const [from, setFrom] = useState<EndpointState>({ branch: PRIME_LANE, date: "", sort: 0 });
  const [to, setTo] = useState<EndpointState>({ branch: PRIME_LANE, date: "", sort: 0 });
  const [proper, setProper] = useState("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [showDilation, setShowDilation] = useState(false);
  const [velocity, setVelocity] = useState("0.9");
  const [coordYears, setCoordYears] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const wasOpen = useRef(false);
  useEffect(() => {
    const opening = open && !wasOpen.current;
    wasOpen.current = open;
    if (!opening) return;
    setConfirmDelete(false);
    setShowDilation(false);
    setVelocity("0.9");
    setCoordYears("");
    if (jump) {
      setTravelerId(jump.travelerEntryId ?? FREE_TEXT);
      setLabel(jump.travelerLabel);
      setFrom({
        branch: jump.fromBranchId ?? PRIME_LANE,
        date: formatSortValue(jump.fromSortValue),
        sort: jump.fromSortValue,
      });
      setTo({
        branch: jump.toBranchId ?? PRIME_LANE,
        date: formatSortValue(jump.toSortValue),
        sort: jump.toSortValue,
      });
      setProper(jump.properDuration ?? "");
      setMethod(jump.method);
      setNotes(jump.notes ?? "");
    } else {
      setTravelerId(FREE_TEXT);
      setLabel("");
      setFrom({ branch: PRIME_LANE, date: "", sort: 0 });
      setTo({ branch: PRIME_LANE, date: "", sort: 0 });
      setProper("");
      setMethod("");
      setNotes("");
    }
  }, [open, jump]);

  const people = useMemo(
    () => [...(entities ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [entities],
  );

  // Coordinate span between departure and arrival, in years (sort ÷ 1000).
  const spanYears = Math.abs(to.sort - from.sort) / 1000;
  const coord = coordYears.trim() ? Number(coordYears) : spanYears;
  const dilation = computeProperDuration(Number(velocity), coord);

  const canSave = (travelerId !== FREE_TEXT || label.trim().length > 0) && !saving;

  const submit = () => {
    if (!canSave) return;
    const entity = people.find((p) => p.id === travelerId);
    onSave(
      {
        travelerEntryId: entity ? entity.id : null,
        travelerLabel: label.trim() || entity?.name || "",
        fromBranchId: from.branch === PRIME_LANE ? null : from.branch,
        fromSortValue: from.sort,
        toBranchId: to.branch === PRIME_LANE ? null : to.branch,
        toSortValue: to.sort,
        properDuration: proper.trim() || null,
        method: method.trim(),
        notes: notes.trim() || null,
      },
      jump?.id,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-heading text-sf-eyebrow uppercase text-t1">
            {jump ? "Edit jump" : "Log jump"}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-t2">
            A traveller leaves one point in time and arrives at another, on the same timeline or a
            different branch.
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
            <Label htmlFor="jump-traveler">Traveller</Label>
            <select
              id="jump-traveler"
              value={travelerId}
              onChange={(e) => {
                const id = e.target.value;
                setTravelerId(id);
                const ent = people.find((p) => p.id === id);
                if (ent) setLabel(ent.name);
              }}
              className={selectClass}
            >
              <option value={FREE_TEXT}>Not in the Codex (type a name)</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {ENTITY_TYPE_LABELS[p.entity_type]}
                </option>
              ))}
            </select>
            <Input
              aria-label="Traveller name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ixtla Varn"
            />
            {travelerId !== FREE_TEXT && (
              <Link
                to={`/worlds/${worldId}/codex/${travelerId}`}
                className="inline-flex min-h-hit items-center text-[14px] text-sf-primary-text underline-offset-4 hover:underline"
              >
                Open Codex page
              </Link>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Endpoint idPrefix="jump-from" legend="Departs" value={from} onChange={setFrom} branches={branches} eraLabel={eraLabel} />
            <Endpoint idPrefix="jump-to" legend="Arrives" value={to} onChange={setTo} branches={branches} eraLabel={eraLabel} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jump-proper">Traveller's own elapsed time</Label>
            <Input
              id="jump-proper"
              value={proper}
              onChange={(e) => setProper(e.target.value)}
              placeholder="4 years aboard, or 'instant'"
            />
            <button
              type="button"
              onClick={() => setShowDilation((s) => !s)}
              aria-expanded={showDilation}
              className="inline-flex min-h-hit items-center gap-2 text-[14px] text-sf-primary-text underline-offset-4 hover:underline"
            >
              <Gauge className="h-4 w-4" aria-hidden />
              Compute from Time Dilation
            </button>
            {showDilation && (
              <div className="space-y-3 border border-sf-line bg-sf-surface-elevated p-3">
                <p className="text-[14px] text-t2">
                  For a cruise at constant velocity: the traveller ages the coordinate duration
                  divided by the Lorentz factor.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="jump-v">Velocity (fraction of c)</Label>
                    <Input
                      id="jump-v"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={0.999999}
                      step="0.01"
                      value={velocity}
                      onChange={(e) => setVelocity(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jump-coord">Coordinate years</Label>
                    <Input
                      id="jump-coord"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={coordYears}
                      onChange={(e) => setCoordYears(e.target.value)}
                      placeholder={String(Number(spanYears.toFixed(3)))}
                      className="font-mono"
                    />
                  </div>
                </div>
                {dilation ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-[12px] text-t1">
                      γ {dilation.gamma.toFixed(3)} · τ {dilation.label}
                    </p>
                    <Button
                      type="button"
                      variant="sf-ghost"
                      size="sf-sm"
                      onClick={() => setProper(dilation.label)}
                    >
                      Use
                    </Button>
                  </div>
                ) : (
                  <p className="font-mono text-[12px] text-sf-crimson-text">
                    {"// PARAMETERS OUTSIDE OPERATIONAL RANGE. VELOCITY MUST BE BELOW c."}
                  </p>
                )}
                <Link
                  to={`/tools/time-dilation?worldId=${worldId}`}
                  className="inline-flex min-h-hit items-center text-[14px] text-sf-primary-text underline-offset-4 hover:underline"
                >
                  Open the Time Dilation tool for acceleration profiles
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jump-method">Method</Label>
            <Input
              id="jump-method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              placeholder="Relativistic flight, closed timelike curve, the Loom…"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jump-notes">Notes</Label>
            <Textarea
              id="jump-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sf-line-hairline pt-4">
            {jump && onDelete ? (
              confirmDelete ? (
                <div className="flex gap-2">
                  <Button type="button" variant="destructive" size="sf-sm" onClick={() => onDelete(jump.id)}>
                    Confirm delete
                  </Button>
                  <Button type="button" variant="sf-ghost" size="sf-sm" onClick={() => setConfirmDelete(false)}>
                    Keep
                  </Button>
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
                {jump ? "Save jump" : "Log jump"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
