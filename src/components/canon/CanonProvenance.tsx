// ---------------------------------------------------------------------------
// CanonProvenance, the strip under a consumer field (1.5 item 10).
//
// A consumer tool holds a copy of a value another tool owns. This strip is
// what keeps the copy honest:
//
//   prefill    on open, an empty (or never-saved) field takes canon's value
//   in sync    // FROM ORRERY · CANON            EDIT AT ORRERY
//   diverged   // CANON SAYS G · THIS SHEET SAYS K
//              [USE CANON] [EDIT AT ORRERY] [OVERRIDE HERE]
//   missing    // NOT ON FILE                    SET AT ORRERY
//
// OVERRIDE HERE proposes the sheet's value (canon.propose); it never
// overwrites canon. Decisions: canon/field.ts consumerState.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { codecFor } from "@/canon/codecs";
import { consumerState } from "@/canon/field";
import { useCanonField } from "@/canon/field-hooks";
import { manifestBrand, ownerHref, singleHome, sourceBrand, sourceHref } from "@/canon/ownership";
import type { ToolManifest } from "@/canon/manifest";
import type { FactValue } from "@/canon/types";

export interface CanonProvenanceProps {
  worldId: string | null | undefined;
  /** The entity this sheet is about (useToolSubject). */
  subjectId: string | null;
  predicate: string;
  /** The tool this field sits in. */
  consumer: ToolManifest;
  /** The field's current value, as the tool stores it. */
  local: unknown;
  /** Canon value → the tool's own field value. Null when the tool cannot represent it. */
  toLocal: (value: FactValue) => unknown | null;
  /** Write a value into the field. */
  onApply: (localValue: unknown) => void;
  /** The sheet holds only defaults (never saved): canon may replace them on open. */
  pristine?: boolean;
  worksheetId?: string | null;
  className?: string;
}

/** Long values (an axiom) are quoted, not reprinted. */
const clip = (t: string): string => (t.length > 72 ? `${t.slice(0, 69).trimEnd()}…` : t);

const CHIP =
  "inline-flex items-center gap-1 border border-sf-teal bg-sf-teal/[0.06] px-2 py-0.5 rounded-sf-tag font-mono text-[12px] uppercase leading-none tracking-[0.10em] text-sf-teal-text";

export function CanonProvenance({
  worldId,
  subjectId,
  predicate,
  consumer,
  local,
  toLocal,
  onApply,
  pristine = false,
  worksheetId,
  className,
}: CanonProvenanceProps): JSX.Element | null {
  const { pick, owner, isLoading, propose, isProposing } = useCanonField(worldId, subjectId, predicate, consumer);
  const codec = codecFor(predicate);
  const localValue = codec.read(local);
  const state = consumerState(localValue, pick, pristine);
  const canonLocal = pick.value ? toLocal(pick.value) : null;
  const [proposedText, setProposedText] = useState<string | null>(null);

  // Prefill once per canon value: an empty or fresh field takes canon.
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (state !== "prefill" || !pick.fact || canonLocal === null || canonLocal === undefined) return;
    const key = `${pick.fact.id}|${pick.fact.valueText}`;
    if (applied.current === key) return;
    applied.current = key;
    onApply(canonLocal);
  }, [state, pick.fact, canonLocal, onApply]);

  if (!worldId || isLoading) return null;

  const home = singleHome(predicate);
  const ownerName = owner ? manifestBrand(owner).toUpperCase() : null;
  const editHref = owner
    ? ownerHref(owner, worldId, home && !home.sharesSubject ? pick.fact?.subjectId ?? null : subjectId)
    : null;
  const editLink = (verb: "EDIT" | "SET") =>
    editHref && ownerName ? (
      <Link
        to={editHref}
        className="inline-flex min-h-hit items-center font-mono text-[12px] uppercase tracking-[0.10em] text-sf-primary-text underline-offset-4 transition-colors duration-fast hover:text-sf-primary-bright hover:underline"
      >
        {verb} AT {ownerName}
      </Link>
    ) : null;

  if (state === "missing") {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-3", className)}>
        <span className="font-mono text-[12px] uppercase tracking-[0.10em] text-t4">{"// NOT ON FILE"}</span>
        {editLink("SET")}
      </div>
    );
  }

  if (state === "ambiguous") {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-3", className)}>
        <span className="font-mono text-[12px] uppercase tracking-[0.10em] text-t4">
          {`// ${pick.candidates.length} VALUES ON FILE. NONE BOUND TO THIS SUBJECT.`}
        </span>
        {editLink("EDIT")}
      </div>
    );
  }

  const fact = pick.fact!;
  const chipHref = sourceHref(fact, worldId);
  const chipText = `// FROM ${sourceBrand(fact)} · ${fact.confidence.toUpperCase()}`;
  const chip = chipHref ? (
    <Link to={chipHref} className="group inline-flex min-h-hit items-center" aria-label={`${chipText}. Open the source.`}>
      <span className={cn(CHIP, "transition-colors duration-fast group-hover:border-sf-primary-bright")}>{chipText}</span>
    </Link>
  ) : (
    <span className={CHIP}>{chipText}</span>
  );

  if (state !== "diverged") {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-3", className)}>
        {chip}
        {editLink("EDIT")}
      </div>
    );
  }

  const sheetText = localValue ? codec.text(localValue) : "";
  const canonText = pick.value ? codec.text(pick.value) : fact.valueText;
  const alreadyProposed = proposedText !== null && proposedText === sheetText;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-wrap items-center gap-x-3">
        {chip}
        <span className="inline-flex items-center gap-1 font-mono text-[12px] uppercase tracking-[0.10em] text-sf-amber-text">
          <AlertTriangle className="h-3.5 w-3.5 text-sf-amber" aria-hidden="true" />
          {`// CANON SAYS ${clip(canonText)} · THIS SHEET SAYS ${clip(sheetText)}`}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canonLocal !== null && canonLocal !== undefined && (
          <Button type="button" variant="sf-ghost" size="sf-sm" onClick={() => onApply(canonLocal)}>
            Use canon
          </Button>
        )}
        {editLink("EDIT")}
        {alreadyProposed ? (
          <span className="font-mono text-[12px] uppercase tracking-[0.10em] text-t3">{"// OVERRIDE PROPOSED"}</span>
        ) : (
          <Button
            type="button"
            variant="sf-ghost"
            size="sf-sm"
            disabled={!localValue || isProposing}
            onClick={async () => {
              if (!localValue) return;
              if (await propose(localValue, { worksheetId })) setProposedText(sheetText);
            }}
          >
            Override here
          </Button>
        )}
      </div>
    </div>
  );
}
