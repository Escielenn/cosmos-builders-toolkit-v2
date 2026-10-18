/**
 * TraitRow — one inherited trait on a character, with its provenance and an
 * override control.
 *
 * Law III (every surface is two-way): an inherited value always shows the
 * tool and worksheet it came from as a chip that opens that worksheet, so the
 * writer who disagrees can change it at the source. Or they can override it
 * here, on purpose; the override is marked and the inherited value stays
 * visible beneath it so the departure is never silent.
 *
 * Status is carried by text, never colour alone: INHERITED / OVERRIDE /
 * WRITER / NOT RECORDED / NOT ON FILE.
 */

import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, PenLine, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { accentChipClass, getToolAccent } from "@/lib/tool-accents";
import type { ResolvedTrait } from "@/lib/dossier/inheritance";
import { brandOf, toolHref } from "@/components/dossier/tool-href";
import { cn } from "@/lib/utils";

/** The provenance chip: tool brand + worksheet title, opening the source. */
export function SourceChip({
  tool,
  worldId,
  worksheetId,
  title,
}: {
  tool: string;
  worldId: string | null;
  worksheetId?: string | null;
  title?: string | null;
}): JSX.Element {
  const brand = brandOf(tool).toUpperCase();
  return (
    <Link
      to={toolHref(tool, worldId, worksheetId ?? null)}
      className={cn(
        "inline-flex min-h-hit items-center gap-1.5 border px-2 rounded-sf-tag font-mono text-[12px] uppercase tracking-[0.10em] transition-colors duration-fast ease-sf-out hover:border-sf-line-emphasis",
        accentChipClass(getToolAccent(tool)),
      )}
      aria-label={`Open ${brandOf(tool)}${title ? `: ${title}` : ""}`}
    >
      <span aria-hidden>//</span>
      <span>
        FROM {brand}
        {title ? ` · ${title}` : ""}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

function StatusTag({ status }: { status: ResolvedTrait["status"] }): JSX.Element | null {
  if (status === "overridden") {
    return (
      <span className="inline-flex items-center border border-sf-magenta bg-sf-magenta/[0.06] px-2 py-0.5 rounded-sf-tag font-mono text-[12px] uppercase tracking-[0.10em] text-sf-magenta-text">
        Override
      </span>
    );
  }
  if (status === "manual") {
    return (
      <span className="inline-flex items-center border border-sf-magenta bg-sf-magenta/[0.06] px-2 py-0.5 rounded-sf-tag font-mono text-[12px] uppercase tracking-[0.10em] text-sf-magenta-text">
        Writer
      </span>
    );
  }
  return null;
}

interface TraitRowProps {
  trait: ResolvedTrait;
  worldId: string | null;
  /** The raw override text, as typed (may differ from trait.value by whitespace). */
  override: string | undefined;
  onOverride: (value: string | null) => void;
  /** One Ship's-Voice sentence of consequence, when this trait has one. */
  narrative?: string;
}

export function TraitRow({ trait, worldId, override, onOverride, narrative }: TraitRowProps): JSX.Element {
  const [editing, setEditing] = useState(false);
  const inputId = useId();
  const brand = brandOf(trait.tool);
  const hasValue = trait.value !== null;
  const isOverride = trait.status === "overridden" || trait.status === "manual";

  return (
    <div className="grid gap-x-6 gap-y-2 border-b border-sf-line-hairline py-4 last:border-b-0 md:grid-cols-[200px_minmax(0,1fr)]">
      <div className="flex flex-col gap-2">
        <Label htmlFor={editing ? inputId : undefined}>{trait.label}</Label>
        <StatusTag status={trait.status} />
      </div>

      <div className="min-w-0 space-y-3">
        {hasValue ? (
          <p className="whitespace-pre-line font-sans text-sf-body text-t1 sf-measure">{trait.value}</p>
        ) : trait.status === "unrecorded" ? (
          <p className="font-mono text-[12px] uppercase tracking-[0.10em] text-sf-amber-text">
            // NOT RECORDED IN {brand.toUpperCase()}. FILL: {trait.hint.toUpperCase()}.
          </p>
        ) : (
          <p className="font-mono text-[12px] uppercase tracking-[0.10em] text-t3">
            // NOT ON FILE. LINK A {slotNoun(trait.slot)} ABOVE, OR SET IT HERE.
          </p>
        )}

        {narrative && hasValue && (
          <p className="font-mono text-[12px] uppercase tracking-[0.10em] text-sf-magenta-text">{narrative}</p>
        )}

        {trait.status === "overridden" && trait.inheritedValue && (
          <p className="font-sans text-sm text-t3 sf-measure">
            <span className="font-mono text-[12px] uppercase tracking-[0.10em] text-t4">{brand} records: </span>
            {trait.inheritedValue}
          </p>
        )}

        {editing && (
          <div className="space-y-2">
            <Textarea
              id={inputId}
              value={override ?? ""}
              onChange={(e) => onOverride(e.target.value)}
              placeholder={trait.inheritedValue ?? `Your ${trait.label.toLowerCase()} for this character`}
              className="min-h-[72px]"
            />
            <p className="font-sans text-sm text-t3">
              Clearing this field returns the trait to {trait.source ? brand : "unset"}.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {trait.source && (
            <SourceChip tool={trait.tool} worldId={worldId} worksheetId={trait.source.worksheetId} title={trait.source.title} />
          )}
          {!trait.source && (
            <SourceChip tool={trait.tool} worldId={worldId} />
          )}
          <Button
            type="button"
            variant="sf-ghost"
            size="sf-sm"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
          >
            <PenLine aria-hidden />
            {editing ? "Done" : isOverride ? "Edit Override" : hasValue ? "Override" : "Set Manually"}
          </Button>
          {isOverride && (
            <Button
              type="button"
              variant="sf-ghost"
              size="sf-sm"
              onClick={() => {
                onOverride(null);
                setEditing(false);
              }}
            >
              <RotateCcw aria-hidden />
              {trait.source ? `Revert To ${brand}` : "Clear"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function slotNoun(slot: ResolvedTrait["slot"]): string {
  switch (slot) {
    case "homeworld":
      return "HOMEWORLD";
    case "species":
      return "SPECIES";
    case "sensorium":
      return "SENSORY PROFILE";
    case "culture":
      return "CULTURE";
    case "polity":
      return "POLITY";
    case "language":
      return "LANGUAGE";
  }
}
