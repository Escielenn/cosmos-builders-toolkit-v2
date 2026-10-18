// ---------------------------------------------------------------------------
// ContradictionLedger, the Studio's Check tab (Studio Charter §2.1 "Check —
// see 2.3", §2.2 Canon Capture, §2.3 Contradiction Ledger).
//
// It absorbs the old Check tab rather than adding a sixth (Law VII): the
// continuity findings it used to show are listed here, beside the two things
// Canon Capture finds in the prose:
//
//   CONTRADICTIONS   prose that disagrees with a value on file, each with
//                    the three resolutions, always:
//                      CANON IS RIGHT  select the words; the writer edits
//                      PROSE IS RIGHT  write the prose value (confirm first)
//                      BOTH ARE RIGHT  an epoch boundary note; dismiss
//   NOT ON FILE      CLAIM DETECTED. NOT ON FILE. ADOPT?
//                      ADOPT (proposed) · ADOPT AS CANON · DISMISS
//   PROPOSED HERE    facts this document proposed: PROMOTE / RETRACT
//   ELSEWHERE        the same, world-wide, by document, one click to open
//
// The ledger never edits prose. It writes facts only on a writer's click,
// through src/canon, and never silently over canon.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Crosshair } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAnnotateFact, useAssertFact, useCanonRows, useProposeFact } from "@/canon/hooks";
import { predicateLabel } from "@/canon/vocabulary";
import type { AssertResult, CanonFactRow } from "@/canon/types";
import { ConfidenceTag } from "@/components/writing/ConfidenceTag";
import { ContinuityPanel, useContinuityCheck } from "@/components/writing/ContinuityPanel";
import { ProposedFactActions } from "@/components/writing/ProposedFactActions";
import { ACTION_PRIMARY, ACTION_QUIET } from "@/components/writing/action-classes";
import { useStudioWorld } from "@/components/writing/studio-world";
import {
  claimAssertion,
  mergeContinuity,
  type CaptureItem,
  type CaptureResolution,
  type CaptureResolutions,
  type ContradictionItem,
} from "@/lib/writing/capture";
import type { LocateTarget } from "@/hooks/use-canon-capture";

export interface ContradictionLedgerProps {
  worldId: string;
  docId: string;
  /** The open document's HTML, for the continuity findings. */
  content: string | null | undefined;
  entityId?: string;
  onSetEntityId?: (id: string) => void;
  items: readonly CaptureItem[];
  elsewhere: ReadonlyMap<string, CaptureItem[]>;
  docTitle: (id: string) => string;
  resolutions: CaptureResolutions;
  /** An item the writer chose from the margin: scroll to it. */
  focusKey: string | null;
  onResolve: (key: string, resolution: CaptureResolution) => void;
  onLocate: (target: LocateTarget) => boolean;
  onLocateIn: (docId: string, target: LocateTarget) => void;
}

const targetOf = (i: CaptureItem): LocateTarget => ({
  paragraphIndex: i.paragraphIndex,
  start: i.claim.start,
  end: i.claim.end,
  match: i.claim.match,
});

const now = () => new Date().toISOString();

function Eyebrow({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <h3 className="border-b border-sf-line-hairline px-4 pb-2 pt-4 font-heading text-sf-eyebrow uppercase text-t4">
      {children}
    </h3>
  );
}

export function ContradictionLedger(props: ContradictionLedgerProps): JSX.Element {
  const { worldId, docId, items, elsewhere, docTitle, resolutions, focusKey, onResolve, onLocate, onLocateIn } = props;
  const { toast } = useToast();
  const continuity = useContinuityCheck({
    worldId,
    content: props.content,
    entityId: props.entityId,
    onSetEntityId: props.onSetEntityId,
  });
  const continuityNotes = useMemo(
    () => mergeContinuity(continuity.notes, items, resolutions),
    [continuity.notes, items, resolutions],
  );

  const { data: rows } = useCanonRows(worldId);
  const proposedHere = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          r.confidence === "proposed" &&
          !r.superseded_at &&
          r.source_kind === "prose" &&
          (r.source_ref as Record<string, unknown>)?.document_id === docId,
      ),
    [rows, docId],
  );

  const contradictions = items.filter((i): i is ContradictionItem => i.kind === "contradiction");
  const claims = items.filter((i) => i.kind === "claim");
  const elsewhereList = useMemo(() => [...elsewhere.entries()], [elsewhere]);

  // Scroll the margin's chosen item into view and move focus to it.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focusKey || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-capture-key="${CSS.escape(focusKey)}"]`);
    if (el) {
      el.scrollIntoView({ block: "nearest" });
      el.focus({ preventScroll: true });
    }
  }, [focusKey]);

  const total = contradictions.length + continuityNotes.length + claims.length;

  return (
    <div ref={listRef} className="pb-4">
      <p className="px-4 pt-3 font-mono text-[12px] uppercase text-t3" role="status" aria-live="polite">
        {contradictions.length + continuityNotes.length} CONTRADICTIONS · {claims.length} NOT ON FILE
      </p>

      {contradictions.length + continuityNotes.length > 0 && (
        <section aria-label="Contradictions">
          <Eyebrow>Contradictions</Eyebrow>
          {contradictions.map((i) => (
            <ContradictionCard
              key={i.key}
              worldId={worldId}
              item={i}
              focused={focusKey === i.key}
              onResolve={onResolve}
              onLocate={() => {
                if (!onLocate(targetOf(i))) toast({ title: "PASSAGE NOT FOUND. IT MAY HAVE CHANGED." });
              }}
            />
          ))}
          {continuityNotes.map((n) => (
            <div key={n.key} className="border-b border-sf-line-hairline px-4 py-3">
              <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[12px] uppercase text-sf-amber-text">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Continuity
              </p>
              <p className="mb-1.5 font-serif text-[14px] leading-relaxed text-t1">{n.message}</p>
              <p className="mb-2 font-mono text-[12px] uppercase text-t4">
                World <span className="text-t1">{n.worldValue}</span> · Prose <span className="text-t1">{n.proseValue}</span>
              </p>
              <Excerpt
                text={n.excerpt}
                onLocate={() => {
                  const match = n.excerpt.replace(/…$/, "").slice(0, 80);
                  if (!onLocate({ paragraphIndex: 0, start: 0, end: 0, match }))
                    toast({ title: "PASSAGE NOT FOUND. IT MAY HAVE CHANGED." });
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className={ACTION_QUIET} onClick={() => onResolve(n.key, { r: "dismissed", at: now() })}>
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {claims.length > 0 && (
        <section aria-label="Claims not on file">
          <Eyebrow>Not on file</Eyebrow>
          {claims.map((i) => (
            <ClaimCard
              key={i.key}
              worldId={worldId}
              item={i}
              focused={focusKey === i.key}
              onResolve={onResolve}
              onLocate={() => {
                if (!onLocate(targetOf(i))) toast({ title: "PASSAGE NOT FOUND. IT MAY HAVE CHANGED." });
              }}
            />
          ))}
        </section>
      )}

      {proposedHere.length > 0 && (
        <section aria-label="Proposed from this document">
          <Eyebrow>Proposed from this document</Eyebrow>
          {proposedHere.map((r) => (
            <ProposedRow key={r.id} worldId={worldId} row={r} />
          ))}
        </section>
      )}

      {total === 0 && proposedHere.length === 0 && !continuity.needsPicker && (
        <div className="px-4 py-6">
          <p className="mb-1 font-serif text-[15px] italic text-sf-primary-text">Consistent so far</p>
          <p className="text-[13px] leading-relaxed text-t2">
            No claim in this document disagrees with the world, and none is waiting to be filed.
          </p>
        </div>
      )}

      {continuity.needsPicker && (
        <ContinuityPanel
          worldId={worldId}
          content={props.content}
          entityId={props.entityId}
          onSetEntityId={props.onSetEntityId}
        />
      )}

      {elsewhereList.length > 0 && (
        <section aria-label="Elsewhere in this world">
          <Eyebrow>Elsewhere in this world</Eyebrow>
          <ul>
            {elsewhereList.map(([id, list]) => (
              <li key={id} className="border-b border-sf-line-hairline px-4 py-2">
                <p className="mb-1 truncate font-sans text-[13px] text-t1">{docTitle(id)}</p>
                <ul>
                  {list.slice(0, 6).map((i) => (
                    <li key={i.key}>
                      <button
                        type="button"
                        onClick={() => onLocateIn(id, targetOf(i))}
                        className="flex min-h-hit w-full items-center gap-2 text-left font-mono text-[12px] uppercase text-t3 transition-colors duration-fast hover:text-t1"
                      >
                        {i.kind === "contradiction" ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-sf-amber" aria-hidden="true" />
                        ) : (
                          <span aria-hidden="true" className="text-sf-teal">⟡</span>
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {i.kind === "contradiction" ? "CONTRADICTION" : "NOT ON FILE"} · {predicateLabel(i.claim.predicate)} ·{" "}
                          {i.valueText}
                          {i.kind === "contradiction" ? ` VS ${i.fact.insert}` : ""}
                        </span>
                        <span className="sr-only">Open the document at this passage</span>
                      </button>
                    </li>
                  ))}
                  {list.length > 6 && (
                    <li className="font-mono text-[12px] uppercase text-t4">+ {list.length - 6} MORE IN THIS DOCUMENT</li>
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="px-4 pt-4 font-serif text-[12px] italic text-t4">
        Breaking your own rules on purpose is allowed. Nothing here changes your prose.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Excerpt({ text, onLocate }: { text: string; onLocate: () => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onLocate}
      title="Select this passage in the editor"
      className="flex min-h-hit w-full items-start gap-2 border-l border-sf-line pl-2 text-left font-serif text-[13px] italic text-t2 transition-colors duration-fast hover:border-sf-primary hover:text-t1"
    >
      <span className="min-w-0 flex-1">{text}</span>
      <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0 text-t4" aria-hidden="true" />
      <span className="sr-only">Select this passage in the editor</span>
    </button>
  );
}

function useSubjectName(id: string | null): string {
  const world = useStudioWorld();
  if (!id) return "WORLD · NO SUBJECT";
  return world?.entityById.get(id)?.name ?? "A SUBJECT NO LONGER ON FILE";
}

function SubjectLine({ item }: { item: CaptureItem }): JSX.Element {
  const name = useSubjectName(item.claim.subjectId);
  return (
    <p className="mb-1.5 font-mono text-[12px] uppercase text-t3">
      <span className="text-t1">&ldquo;{item.claim.match}&rdquo;</span> → {name} · {predicateLabel(item.claim.predicate)}
      {item.claim.reason && <span className="text-t4"> · {item.claim.reason}</span>}
    </p>
  );
}

function cardClass(focused: boolean): string {
  return `border-b border-l-2 border-b-sf-line-hairline px-4 py-3 outline-none ${
    focused ? "border-l-sf-primary bg-sf-surface" : "border-l-transparent"
  }`;
}

function ClaimCard({
  worldId,
  item,
  focused,
  onResolve,
  onLocate,
}: {
  worldId: string;
  item: CaptureItem;
  focused: boolean;
  onResolve: (key: string, r: CaptureResolution) => void;
  onLocate: () => void;
}): JSX.Element {
  const propose = useProposeFact(worldId);
  const assert = useAssertFact(worldId);
  const { toast } = useToast();
  const [conflict, setConflict] = useState<CanonFactRow | null>(null);
  const busy = propose.isPending || assert.isPending;
  const a = claimAssertion(item);
  const write = { subjectId: a.subjectId, predicate: a.predicate, value: a.value, valueText: a.valueText, unit: a.unit, sourceKind: "prose" as const, sourceRef: a.sourceRef };

  const adoptCanon = (supersede: boolean) =>
    assert.mutate(
      { ...write, supersede },
      {
        onSuccess: (r) => {
          const res = r as AssertResult;
          if (res.status === "conflict") return setConflict(res.existing);
          setConflict(null);
          toast({ title: supersede ? "CANON REPLACED. PRIOR VALUE KEPT ON FILE." : "ADOPTED AS CANON." });
        },
      },
    );

  return (
    <div className={cardClass(focused)} data-capture-key={item.key} tabIndex={-1}>
      <p className="mb-1 font-mono text-[12px] uppercase text-sf-teal-text">
        <span aria-hidden="true">⟡ </span>Claim detected. Not on file. Adopt?
      </p>
      <SubjectLine item={item} />
      <Excerpt text={item.claim.sentence} onLocate={onLocate} />
      {conflict ? (
        <div className="mt-2" role="group" aria-label="Canon conflict">
          <p className="mb-2 font-mono text-[12px] uppercase text-sf-amber-text">
            // CANON ON FILE: {conflict.value_text ?? "A DIFFERENT VALUE"}.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ACTION_QUIET} disabled={busy} onClick={() => setConflict(null)}>
              Keep canon
            </button>
            <button type="button" className={ACTION_PRIMARY} disabled={busy} onClick={() => adoptCanon(true)}>
              Replace
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={ACTION_QUIET}
            disabled={busy}
            onClick={() => propose.mutate(write, { onSuccess: () => toast({ title: "CLAIM FILED AS PROPOSED." }) })}
          >
            Adopt
          </button>
          <button type="button" className={ACTION_PRIMARY} disabled={busy} onClick={() => adoptCanon(false)}>
            Adopt as canon
          </button>
          <button type="button" className={ACTION_QUIET} disabled={busy} onClick={() => onResolve(item.key, { r: "dismissed", at: now() })}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function ContradictionCard({
  worldId,
  item,
  focused,
  onResolve,
  onLocate,
}: {
  worldId: string;
  item: ContradictionItem;
  focused: boolean;
  onResolve: (key: string, r: CaptureResolution) => void;
  onLocate: () => void;
}): JSX.Element {
  const propose = useProposeFact(worldId);
  const assert = useAssertFact(worldId);
  const annotate = useAnnotateFact(worldId);
  const { toast } = useToast();
  const [mode, setMode] = useState<"idle" | "prose" | "both">("idle");
  const [note, setNote] = useState("");
  const busy = propose.isPending || assert.isPending || annotate.isPending;
  const { fact } = item;
  const isCanon = fact.confidence === "canon";
  const a = claimAssertion(item);
  const write = { subjectId: a.subjectId, predicate: a.predicate, value: a.value, valueText: a.valueText, unit: a.unit, sourceKind: "prose" as const, sourceRef: a.sourceRef };
  const source = fact.toolLabel === fact.sourceTitle ? fact.toolLabel : `${fact.toolLabel} · ${fact.sourceTitle}`;

  const proseIsRight = () =>
    assert.mutate(
      { ...write, supersede: isCanon },
      {
        onSuccess: (r) => {
          const res = r as AssertResult;
          if (res.status === "conflict") {
            toast({ title: "CANON CHANGED SINCE THIS WAS READ. REVIEW AGAIN." });
            return;
          }
          setMode("idle");
          toast({ title: isCanon ? "CANON REPLACED. PRIOR VALUE KEPT ON FILE." : "ADOPTED AS CANON." });
        },
      },
    );

  const bothAreRight = async () => {
    try {
      if (fact.factId) {
        await annotate.mutateAsync({
          id: fact.factId,
          note: { note: note.trim(), prose_value: item.valueText, document_id: item.docId, excerpt: item.claim.sentence },
        });
      }
      onResolve(item.key, { r: "both", at: now(), ...(note.trim() ? { note: note.trim() } : {}) });
      toast({ title: "EPOCH BOUNDARY RECORDED." });
      setMode("idle");
    } catch {
      // The mutation hook already showed the error in Ship's Voice.
    }
  };

  return (
    <div className={cardClass(focused)} data-capture-key={item.key} tabIndex={-1}>
      <p className="mb-1 flex items-center gap-1.5 font-mono text-[12px] uppercase text-sf-amber-text">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> // Contradiction
      </p>
      <SubjectLine item={item} />
      <dl className="mb-2 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 font-mono text-[12px] uppercase">
        <dt className="text-t4">Prose</dt>
        <dd className="text-t1">{item.valueText}</dd>
        <dt className="text-t4">On file</dt>
        <dd className="flex flex-wrap items-center gap-1.5 text-t1">
          {fact.insert}
          <ConfidenceTag confidence={fact.confidence} outranked={!!fact.outrankedBy} />
        </dd>
        <dt className="text-t4">Source</dt>
        <dd className="min-w-0 normal-case">
          {fact.href ? (
            <Link to={fact.href} className="inline-flex min-h-hit items-center gap-1 font-sans text-[12px] text-sf-primary-text hover:text-t1">
              {source} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <span className="font-sans text-[12px] text-t3">{source}</span>
          )}
        </dd>
      </dl>
      <Excerpt text={item.claim.sentence} onLocate={onLocate} />

      {mode === "idle" && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Resolve this contradiction">
          <button
            type="button"
            className={ACTION_QUIET}
            onClick={() => {
              onLocate();
              toast({ title: "PASSAGE SELECTED. EDIT AS NEEDED." });
            }}
          >
            Canon is right
          </button>
          <button type="button" className={ACTION_QUIET} onClick={() => setMode("prose")}>
            Prose is right
          </button>
          <button type="button" className={ACTION_QUIET} onClick={() => setMode("both")}>
            Both are right
          </button>
        </div>
      )}

      {mode === "prose" && (
        <div className="mt-2" role="group" aria-label="Confirm the prose value">
          <p className="mb-2 font-mono text-[12px] uppercase text-t1">
            {isCanon
              ? `REPLACE CANON ${fact.insert} WITH ${item.valueText}?`
              : `FILE ${item.valueText} AS CANON? ${fact.insert} STAYS IN ITS SOURCE, OUTRANKED.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ACTION_PRIMARY} disabled={busy} onClick={proseIsRight}>
              {isCanon ? "Replace canon" : "Adopt as canon"}
            </button>
            <button
              type="button"
              className={ACTION_QUIET}
              disabled={busy}
              onClick={() =>
                propose.mutate(write, {
                  onSuccess: () => {
                    setMode("idle");
                    toast({ title: "CLAIM FILED AS PROPOSED." });
                  },
                })
              }
            >
              Propose instead
            </button>
            <button type="button" className={ACTION_QUIET} disabled={busy} onClick={() => setMode("idle")}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "both" && (
        <div className="mt-2" role="group" aria-label="Record an epoch boundary">
          <label htmlFor={`epoch-${item.key}`} className="mb-1 block font-sans text-[12px] font-medium uppercase text-t3">
            Epoch boundary. Name the change (optional)
          </label>
          <input
            id={`epoch-${item.key}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void bothAreRight();
              if (e.key === "Escape") setMode("idle");
            }}
            placeholder="After the terraforming"
            className="sf-field mb-2 min-h-hit w-full rounded-none px-2 font-sans text-[16px] text-t1 placeholder:text-t3"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ACTION_PRIMARY} disabled={busy} onClick={() => void bothAreRight()}>
              Record
            </button>
            <button type="button" className={ACTION_QUIET} disabled={busy} onClick={() => setMode("idle")}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {fact.confidence === "proposed" && fact.factId && mode === "idle" && (
        <div className="mt-3 border-t border-sf-line-hairline pt-2">
          <p className="mb-1.5 font-mono text-[12px] uppercase text-t4">The value on file is proposed</p>
          <ProposedFactActions worldId={worldId} factId={fact.factId} label={predicateLabel(item.claim.predicate)} />
        </div>
      )}
    </div>
  );
}

function ProposedRow({ worldId, row }: { worldId: string; row: CanonFactRow }): JSX.Element {
  const name = useSubjectName(row.subject_id);
  const label = predicateLabel(row.predicate);
  const excerpt = typeof row.source_ref?.excerpt === "string" ? row.source_ref.excerpt : "";
  return (
    <div className="border-b border-sf-line-hairline px-4 py-3">
      <p className="mb-1 flex flex-wrap items-center gap-1.5 font-mono text-[12px] uppercase text-t3">
        <ConfidenceTag confidence="proposed" />
        <span>
          {name} · {label} · <span className="text-t1">{row.value_text}</span>
        </span>
      </p>
      {excerpt && <p className="mb-2 border-l border-sf-line pl-2 font-serif text-[13px] italic text-t2">{excerpt}</p>}
      <ProposedFactActions worldId={worldId} factId={row.id} label={label} />
    </div>
  );
}

export default ContradictionLedger;
