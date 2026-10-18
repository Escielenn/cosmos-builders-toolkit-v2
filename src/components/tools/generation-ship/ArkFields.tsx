/**
 * Ark field primitives: numeric input with unit and provenance, readouts,
 * and the warning list. Built on the shared ui primitives; nothing here
 * defines a new panel pattern.
 */
import { useEffect, useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, OctagonAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getToolRoute } from "@/lib/tools-config";
import type { Provenance, GenShipWarning } from "@/lib/generation-ship/calculations";
import { IMPORT_SOURCES } from "@/lib/generation-ship/imports";

// ─── Provenance chip ────────────────────────────────────────────────────

/** `// FROM PARADOX · Tau Ceti run`, linking to the worksheet that owns the value. */
export function ProvenanceChip({ provenance, worldId }: { provenance: Provenance; worldId: string | null }): JSX.Element {
  const brand = IMPORT_SOURCES[provenance.tool]?.brand ?? provenance.tool;
  const route = getToolRoute(provenance.tool) ?? `/tools/${provenance.tool}`;
  const params = new URLSearchParams();
  if (worldId) params.set("worldId", worldId);
  params.set("worksheetId", provenance.worksheetId);
  return (
    <Link
      to={`${route}?${params.toString()}`}
      className="group inline-flex min-h-hit items-center"
      aria-label={`Value from ${brand}${provenance.worksheetTitle ? `, ${provenance.worksheetTitle}` : ""}. Open the source worksheet.`}
    >
      <span className="inline-flex items-center gap-1 border border-sf-teal bg-sf-teal/[0.06] px-2 py-0.5 rounded-sf-tag font-mono text-[12px] uppercase leading-none tracking-[0.10em] text-sf-teal-text transition-colors duration-fast group-hover:border-sf-primary-bright">
        {`// FROM ${brand.toUpperCase()}`}
        {provenance.worksheetTitle ? <span className="normal-case tracking-normal text-t3">· {provenance.worksheetTitle}</span> : null}
      </span>
    </Link>
  );
}

// ─── Number field ───────────────────────────────────────────────────────

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
  help?: ReactNode;
  min?: number;
  max?: number;
  step?: number;
  provenance?: Provenance;
  worldId: string | null;
  className?: string;
}

/**
 * Keeps its own text draft so a writer can type "0." on the way to "0.01"
 * without the number snapping back; commits every parseable value.
 */
export function NumberField({ label, value, onChange, unit, help, min, max, step, provenance, worldId, className }: NumberFieldProps): JSX.Element {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => {
    // Accept outside changes (import, load) without clobbering a draft that parses to the same number.
    setDraft((d) => (parseFloat(d) === value ? d : String(value)));
  }, [value]);

  const invalid = draft.trim() !== "" && !Number.isFinite(parseFloat(draft));
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <Label htmlFor={id}>{label}</Label>
        {provenance ? <ProvenanceChip provenance={provenance} worldId={worldId} /> : null}
      </div>
      <div className="flex items-stretch">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={draft}
          min={min}
          max={max}
          step={step ?? "any"}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            setDraft(e.target.value);
            const n = parseFloat(e.target.value);
            if (Number.isFinite(n)) onChange(n);
          }}
          className={cn(unit && "border-r-0")}
        />
        {unit ? (
          <span className="flex min-w-[56px] items-center justify-center border border-sf-line-interactive bg-sf-surface px-3 font-mono text-[12px] text-t4">
            {unit}
          </span>
        ) : null}
      </div>
      {help ? <p className="text-[13px] leading-snug text-t3">{help}</p> : null}
    </div>
  );
}

// ─── Readout ────────────────────────────────────────────────────────────

export type ReadoutTone = "default" | "caution" | "danger" | "ok";

const TONE_CLASS: Record<ReadoutTone, string> = {
  default: "text-t1",
  ok: "text-sf-emerald-text",
  caution: "text-sf-amber-text",
  danger: "text-sf-crimson-text",
};

export function Readout({ label, value, unit, note, tone = "default" }: {
  label: string;
  value: ReactNode;
  unit?: string;
  note?: ReactNode;
  tone?: ReadoutTone;
}): JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-l border-sf-line-hairline pl-3">
      <span className="font-heading text-[12px] uppercase tracking-[0.12em] text-t4">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className={cn("font-mono text-xl leading-tight", TONE_CLASS[tone])}>{value}</span>
        {unit ? <span className="font-mono text-[12px] text-t4">{unit}</span> : null}
      </span>
      {note ? <span className="text-[13px] leading-snug text-t3">{note}</span> : null}
    </div>
  );
}

// ─── Warnings ───────────────────────────────────────────────────────────

export function WarningList({ warnings }: { warnings: GenShipWarning[] }): JSX.Element | null {
  if (warnings.length === 0) return null;
  return (
    <ul className="space-y-2" aria-label="Warnings">
      {warnings.map((w) => {
        const danger = w.level === "danger";
        const Icon = danger ? OctagonAlert : AlertTriangle;
        return (
          <li
            key={w.id}
            role={danger ? "alert" : undefined}
            className={cn(
              "flex items-start gap-2 border px-3 py-2 text-[13px] leading-snug",
              danger
                ? "border-sf-crimson bg-sf-crimson/[0.06] text-sf-crimson-text"
                : "border-sf-amber bg-sf-amber/[0.06] text-sf-amber-text",
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", danger ? "text-sf-crimson" : "text-sf-amber")} aria-hidden="true" />
            <span>
              <span className="sr-only">{danger ? "Danger: " : "Caution: "}</span>
              {w.message}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
