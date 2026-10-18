// ---------------------------------------------------------------------------
// DocumentInspector, Scrivener's Inspector for the open document.
//
// Three panes in the right rail's "Doc" tab:
//   CARD       synopsis, label, status, POV (a character on file, or free
//              text), SET IN (a place), WHEN + TIMELINE, keywords, target.
//              POV and SET IN drive the rail ranking and the World tab.
//   NOTES      per-document notes, distinct from the synopsis
//   SNAPSHOTS  take / compare / restore versions of this document
//
// Absorbs (Law VII) DocumentMetaBar, the collapsed card strip that sat
// between the title and the first line of prose. Everything it held lives
// here now, out of the writer's eyeline; Focus mode hides it with the rail.
//
// Fields commit on blur (and Notes on a short pause), never per keystroke,
// so nothing here can slow typing in the editor. Register: WRITER.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, ChevronDown, MapPin, Tag as TagIcon, Trash2, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import {
  DOC_STATUSES,
  STATUS_LABELS,
  STATUS_TONE,
  targetProgress,
  type DocumentMeta,
} from "@/lib/document-meta";
import { findLabel, LABEL_SWATCH, type WritingLabel } from "@/lib/writing-labels";
import {
  MAX_SNAPSHOTS,
  SNAPSHOT_REASON_LABEL,
  formatSnapshotTime,
  type DocumentSnapshot,
} from "@/hooks/use-document-versions";
import { isNamedSnapshot } from "@/lib/snapshot-cap";


export type InspectorPane = "card" | "notes" | "snapshots";

/** A character the POV can be bound to: a Dossier, a character entity, or both. */
export interface PovOption {
  key: string;
  name: string;
  /** "Dossier", "Codex · Character", … */
  sub: string;
  entityId?: string;
  dossierId?: string;
}

export interface PlaceOption {
  id: string;
  name: string;
  /** "Kellis · 12.4°N 33.1°E", or "Unplaced". */
  sub: string;
}

export interface BranchOption {
  id: string;
  name: string;
}

interface DocumentInspectorProps {
  meta: DocumentMeta;
  onChange: (patch: Partial<DocumentMeta>) => void;
  /** Live word count of the open document (for the target). */
  words: number;
  labels: WritingLabel[];
  onManageLabels: () => void;
  keywordSuggestions: string[];
  pane: InspectorPane;
  onPaneChange: (pane: InspectorPane) => void;
  // snapshots
  snapshots: DocumentSnapshot[];
  snapshotsLoading: boolean;
  snapshotsLocal: boolean;
  onTakeSnapshot: (name: string) => Promise<boolean>;
  onCompare: (snapshot: DocumentSnapshot) => void;
  onDeleteSnapshot: (snapshot: DocumentSnapshot) => void;
  // scene context (all optional: absent lists degrade to the free-text card)
  povOptions?: PovOption[];
  placeOptions?: PlaceOption[];
  branchOptions?: BranchOption[];
}

const FIELD_LABEL = "font-sans text-[12px] font-medium uppercase tracking-wide text-t3";

export function DocumentInspector(props: DocumentInspectorProps): JSX.Element {
  const { pane, onPaneChange } = props;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex border-b border-sf-line-hairline" role="tablist" aria-label="Document inspector">
        {(["card", "notes", "snapshots"] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={pane === p}
            onClick={() => onPaneChange(p)}
            className={`min-h-hit flex-1 font-heading text-[12px] uppercase tracking-wide transition-colors duration-fast ${
              pane === p ? "bg-sf-surface-elevated text-t1" : "text-t3 hover:text-t1"
            }`}
          >
            {p === "card" ? "Card" : p === "notes" ? "Notes" : `Snaps${props.snapshots.length ? ` ${props.snapshots.length}` : ""}`}
          </button>
        ))}
      </div>
      <div className="sf-sb sf-sb--slim min-h-0 flex-1 overflow-y-auto">
        {pane === "card" && <CardPane {...props} />}
        {pane === "notes" && <NotesPane meta={props.meta} onChange={props.onChange} />}
        {pane === "snapshots" && <SnapshotsPane {...props} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function CardPane({
  meta,
  onChange,
  words,
  labels,
  onManageLabels,
  keywordSuggestions,
  povOptions = [],
  placeOptions = [],
  branchOptions = [],
}: DocumentInspectorProps): JSX.Element {
  const [synopsis, setSynopsis] = useState(meta.synopsis);
  const [pov, setPov] = useState(meta.pov);
  const [when, setWhen] = useState(meta.when);
  const [target, setTarget] = useState(meta.target ? String(meta.target) : "");

  // Re-seed when the stored values change (another document, or a save).
  useEffect(() => setSynopsis(meta.synopsis), [meta.synopsis]);
  useEffect(() => setPov(meta.pov), [meta.pov]);
  useEffect(() => setWhen(meta.when), [meta.when]);
  useEffect(() => setTarget(meta.target ? String(meta.target) : ""), [meta.target]);

  const commit = <K extends keyof DocumentMeta>(key: K, value: DocumentMeta[K]) => {
    if (JSON.stringify(value) === JSON.stringify(meta[key])) return;
    onChange({ [key]: value } as Partial<DocumentMeta>);
  };

  const label = findLabel(labels, meta.labelId);
  const povLinked = !!(meta.povEntityId || meta.povDossierId);
  const place = meta.setInPlaceId ? placeOptions.find((p) => p.id === meta.setInPlaceId) ?? null : null;
  const branch = meta.branchId ? branchOptions.find((b) => b.id === meta.branchId) ?? null : null;

  // Typing a name that is not the picked character's unbinds it: a typed
  // name is free text, and free text is not an identity.
  const commitPov = () => {
    const next = pov.trim();
    if (next === meta.pov) return;
    onChange({ pov: next, ...(povLinked ? { povEntityId: "", povDossierId: "" } : {}) });
  };
  const progress = targetProgress(words, meta.target);
  const met = meta.target > 0 && words >= meta.target;

  return (
    <div className="flex flex-col gap-5 p-4">
      <label className="flex flex-col gap-2">
        <span className={FIELD_LABEL}>Synopsis</span>
        <textarea
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          onBlur={() => commit("synopsis", synopsis)}
          rows={3}
          placeholder="What happens in this scene?"
          className="sf-sb sf-sb--slim w-full resize-y px-3 py-2 font-serif text-[16px] leading-relaxed text-t2"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Label</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="sf-field flex min-h-hit items-center gap-2 px-3 text-left font-sans text-[14px] text-t2"
            >
              {label ? (
                <>
                  <span className={`h-3 w-3 shrink-0 ${LABEL_SWATCH[label.hue]}`} aria-hidden="true" />
                  <span className="truncate text-t1">{label.name}</span>
                </>
              ) : (
                <>
                  <TagIcon className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
                  <span className="text-t3">No label</span>
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="sf-sb sf-sb--slim max-h-80 w-64 overflow-y-auto">
            <DropdownMenuItem onClick={() => commit("labelId", "")}>No label</DropdownMenuItem>
            {labels.map((l) => (
              <DropdownMenuItem key={l.id} onClick={() => commit("labelId", l.id)}>
                <span className={`mr-2 h-3 w-3 shrink-0 ${LABEL_SWATCH[l.hue]}`} aria-hidden="true" />
                <span className="truncate">{l.name}</span>
                {l.id === meta.labelId && <span className="ml-auto font-mono text-[12px] text-t4">ON</span>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onManageLabels}>Manage labels…</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Status</span>
        <div className="grid grid-cols-2 gap-2">
          {DOC_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange({ status: meta.status === s ? "" : s })}
              aria-pressed={meta.status === s}
              className={`min-h-hit border px-3 font-mono text-[12px] uppercase transition-colors duration-fast ${
                meta.status === s
                  ? `border-sf-primary bg-sf-primary/[0.06] ${STATUS_TONE[s]}`
                  : "border-sf-line text-t3 hover:border-sf-line-emphasis hover:text-t1"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sf-doc-pov" className={FIELD_LABEL}>
          POV
        </label>
        <div className="flex">
          <input
            id="sf-doc-pov"
            value={pov}
            onChange={(e) => setPov(e.target.value)}
            onBlur={commitPov}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="Whose eyes?"
            className="min-h-hit min-w-0 flex-1 px-3 font-serif text-[16px] text-t2"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Pick the POV character"
                title="Pick a character on file"
                className="sf-field -ml-px flex min-h-hit w-11 shrink-0 items-center justify-center text-t3 hover:text-t1"
              >
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="sf-sb sf-sb--slim max-h-80 w-64 overflow-y-auto">
              {povOptions.length === 0 ? (
                <p className="px-2 py-1.5 font-serif text-[13px] italic text-t3">
                  No characters on file. Make one in Dossier, or type a name.
                </p>
              ) : (
                povOptions.map((o) => {
                  const on =
                    (o.dossierId && o.dossierId === meta.povDossierId) ||
                    (!o.dossierId && o.entityId && o.entityId === meta.povEntityId);
                  return (
                    <DropdownMenuItem
                      key={o.key}
                      onClick={() =>
                        onChange({ pov: o.name, povEntityId: o.entityId ?? "", povDossierId: o.dossierId ?? "" })
                      }
                    >
                      <span className="min-w-0 flex-1 truncate">{o.name}</span>
                      <span className="ml-2 shrink-0 font-mono text-[12px] text-t4">{on ? "ON" : o.sub}</span>
                    </DropdownMenuItem>
                  );
                })
              )}
              {(meta.pov || povLinked) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onChange({ pov: "", povEntityId: "", povDossierId: "" })}>
                    Clear POV
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {povLinked && (
          <span className="font-mono text-[12px] text-sf-magenta-text">// ON FILE. DRIVES THE RAIL AND THE WORLD TAB.</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL} id="sf-doc-setin-label">
          Set in
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-labelledby="sf-doc-setin-label"
              className="sf-field flex min-h-hit items-center gap-2 px-3 text-left font-sans text-[14px] text-t2"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
              {meta.setInPlaceId ? (
                <span className="min-w-0 flex-1 truncate font-serif text-[16px] text-t1">{place?.name ?? "A place no longer on file"}</span>
              ) : (
                <span className="min-w-0 flex-1 text-t3">Not set</span>
              )}
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="sf-sb sf-sb--slim max-h-80 w-72 overflow-y-auto">
            <DropdownMenuItem onClick={() => commit("setInPlaceId", "")}>Not set</DropdownMenuItem>
            {placeOptions.length === 0 ? (
              <p className="px-2 py-1.5 font-serif text-[13px] italic text-t3">
                No places on file. Place them on a map in the Surface Cartographer.
              </p>
            ) : (
              placeOptions.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => commit("setInPlaceId", p.id)}>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="ml-2 max-w-[50%] shrink-0 truncate font-mono text-[12px] text-t4">
                    {p.id === meta.setInPlaceId ? "ON" : p.sub}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {place && <span className="font-mono text-[12px] text-t4">{place.sub}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className={FIELD_LABEL}>When</span>
          <input
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            onBlur={() => commit("when", when.trim())}
            placeholder="In-world date"
            className="min-h-hit w-full px-3 font-serif text-[16px] text-t2"
          />
        </label>
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className={FIELD_LABEL} id="sf-doc-timeline-label">
            Timeline
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-labelledby="sf-doc-timeline-label"
                className="sf-field flex min-h-hit min-w-0 items-center gap-1 px-3 text-left font-sans text-[14px] text-t2"
              >
                <span className="min-w-0 flex-1 truncate">
                  {meta.branchId ? branch?.name ?? "Unknown branch" : "Prime"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="sf-sb sf-sb--slim max-h-80 w-56 overflow-y-auto">
              <DropdownMenuItem onClick={() => onChange({ branchId: "" })}>
                Prime timeline
                {!meta.branchId && <span className="ml-auto font-mono text-[12px] text-t4">ON</span>}
              </DropdownMenuItem>
              {branchOptions.length === 0 ? (
                <p className="px-2 py-1.5 font-serif text-[13px] italic text-t3">No branches. Fork one in the Chronicle.</p>
              ) : (
                branchOptions.map((b) => (
                  <DropdownMenuItem key={b.id} onClick={() => onChange({ branchId: b.id })}>
                    <span className="min-w-0 flex-1 truncate">{b.name || "Unnamed branch"}</span>
                    {b.id === meta.branchId && <span className="ml-2 font-mono text-[12px] text-t4">ON</span>}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>Keywords</span>
        <TagInput
          value={meta.keywords}
          onChange={(keywords) => commit("keywords", keywords)}
          suggestions={keywordSuggestions}
          placeholder="Add a keyword, then Enter"
          maxTags={20}
          maxLength={40}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="sf-doc-target" className={FIELD_LABEL}>
          Document target
        </label>
        <div className="flex items-center gap-2">
          <input
            id="sf-doc-target"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onBlur={() => commit("target", Math.max(0, Math.round(Number(target) || 0)))}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="None"
            className="min-h-hit w-28 px-3 font-mono text-[16px] text-t1"
          />
          <span className="font-mono text-[12px] text-t4">WORDS</span>
        </div>
        {meta.target > 0 && (
          <div className="flex flex-col gap-1">
            <div
              className="h-1.5 w-full bg-sf-surface-elevated"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={meta.target}
              aria-valuenow={Math.min(words, meta.target)}
              aria-label="Document target progress"
            >
              <div
                className={`h-full transition-[width] duration-slow ease-sf-out ${met ? "bg-sf-primary" : "bg-sf-primary/60"}`}
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className={`font-mono text-[12px] ${met ? "text-sf-primary-text" : "text-t3"}`}>
              {words.toLocaleString()} / {meta.target.toLocaleString()} · {Math.round(progress * 100)}%
              {met ? " · TARGET MET" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

function NotesPane({
  meta,
  onChange,
}: Pick<DocumentInspectorProps, "meta" | "onChange">): JSX.Element {
  const [notes, setNotes] = useState(meta.notes);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const latest = useRef({ notes, onChange, stored: meta.notes });
  latest.current = { notes, onChange, stored: meta.notes };

  useEffect(() => {
    if (!dirty.current) setNotes(meta.notes);
  }, [meta.notes]);

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    const { notes: n, onChange: save, stored } = latest.current;
    if (dirty.current && n !== stored) save({ notes: n });
    dirty.current = false;
  };

  // Commit on unmount (switching documents or panes) so a note is never lost.
  useEffect(() => () => flush(), []);

  return (
    <div className="flex h-full min-h-[280px] flex-col gap-2 p-4">
      <label htmlFor="sf-doc-notes" className={FIELD_LABEL}>
        Document notes
      </label>
      <textarea
        id="sf-doc-notes"
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          dirty.current = true;
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(flush, 1500);
        }}
        onBlur={flush}
        placeholder="Research, reminders, what this scene still needs. Only you see these."
        className="sf-sb sf-sb--slim min-h-0 w-full flex-1 resize-none px-3 py-2 font-serif text-[16px] leading-relaxed text-t2"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Snapshots
// ---------------------------------------------------------------------------

function SnapshotsPane({
  words,
  snapshots,
  snapshotsLoading,
  snapshotsLocal,
  onTakeSnapshot,
  onCompare,
  onDeleteSnapshot,
}: DocumentInspectorProps): JSX.Element {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const namedCount = snapshots.filter(isNamedSnapshot).length;
  const unnamedCount = snapshots.length - namedCount;
  const isMac = useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform),
    [],
  );

  const take = async () => {
    setBusy(true);
    const ok = await onTakeSnapshot(name);
    setBusy(false);
    if (ok) setName("");
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void take();
        }}
      >
        <label htmlFor="sf-snapshot-name" className={FIELD_LABEL}>
          Snapshot name <span className="normal-case text-t4">(optional)</span>
        </label>
        <input
          id="sf-snapshot-name"
          value={name}
          maxLength={80}
          onChange={(e) => setName(e.target.value)}
          placeholder="Before the rewrite"
          className="min-h-hit w-full px-3 font-serif text-[16px] text-t2"
        />
        <Button type="submit" variant="sf-primary" size="sf-sm" disabled={busy}>
          <Camera className="h-4 w-4" aria-hidden="true" />
          {busy ? "Taking…" : "Take snapshot"}
        </Button>
        <p className="font-mono text-[12px] text-t4">
          {isMac ? "⌘⌥S" : "CTRL+ALT+S"} · {unnamedCount} / {MAX_SNAPSHOTS} UNNAMED
          {namedCount > 0 ? ` · ${namedCount} NAMED, KEPT` : ""}
        </p>
      </form>

      {snapshotsLocal && (
        <p className="border border-sf-amber px-3 py-1.5 font-sans text-[12px] text-sf-amber-text">
          {"// SNAPSHOTS STORED IN THIS BROWSER UNTIL THE SERVER TABLE IS AVAILABLE."}
        </p>
      )}

      <div className="border-t border-sf-line-hairline pt-2">
        {snapshotsLoading ? (
          <p className="py-2 font-mono text-[12px] text-t4">LOADING SNAPSHOTS…</p>
        ) : snapshots.length === 0 ? (
          <p className="py-2 font-serif text-[14px] italic text-t3">
            No snapshots yet. Take one before a big revision; restoring one always keeps a copy of the
            current text.
          </p>
        ) : (
          <ul className="flex flex-col">
            {snapshots.map((s) => {
              const delta = words - s.wordCount;
              return (
                <li key={s.id} className="group flex items-stretch border-b border-sf-line-hairline">
                  <button
                    type="button"
                    onClick={() => onCompare(s)}
                    title="Compare with the current text"
                    className="flex min-h-hit min-w-0 flex-1 flex-col justify-center gap-0.5 py-1.5 pr-1 text-left transition-colors duration-fast hover:bg-sf-surface-elevated"
                  >
                    <span className="truncate font-serif text-[14px] text-t1">
                      {s.name || SNAPSHOT_REASON_LABEL[s.reason].toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                    </span>
                    <span className="flex flex-wrap gap-x-2 font-mono text-[12px] text-t4">
                      <span>{formatSnapshotTime(s.timestamp)}</span>
                      <span>{s.wordCount.toLocaleString()} W</span>
                      {delta !== 0 && (
                        <span className={delta > 0 ? "text-sf-primary-text" : "text-sf-crimson-text"}>
                          {delta > 0 ? `+${delta.toLocaleString()}` : `−${Math.abs(delta).toLocaleString()}`} NOW
                        </span>
                      )}
                      {s.name && <span>{SNAPSHOT_REASON_LABEL[s.reason]}</span>}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this snapshot? The document itself is not affected.")) {
                        onDeleteSnapshot(s);
                      }
                    }}
                    aria-label={`Delete snapshot ${s.name || formatSnapshotTime(s.timestamp)}`}
                    className="flex min-h-hit w-9 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-sf-crimson-text"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {unnamedCount >= MAX_SNAPSHOTS && (
          <p className="pt-2 font-sans text-[12px] text-t3">
            The oldest unnamed snapshot rolls off when a new one is taken. Named snapshots are always kept.
          </p>
        )}
      </div>
    </div>
  );
}

export default DocumentInspector;
