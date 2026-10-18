// ---------------------------------------------------------------------------
// BodyFactsPanel — the body's canon, read-only, each row one click from the
// single place it is edited (Law III). Nothing here is an input: the sheet
// and the map are a picture of these numbers, never a second way to set them.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import type { BodyFact, BodyFacts } from "@/lib/surface-cartographer/body";
import { bodyRadiusKm } from "@/lib/surface-cartographer/body";

interface BodyFactsPanelProps {
  facts: BodyFacts;
  /** Where a missing number should be set. */
  setHref: string;
  setLabel: string;
}

const SOURCE_TAG: Record<string, string> = {
  entity: "// FROM CODEX",
  worksheet: "// FROM GENESIS",
  tidelock: "// FROM TIDELOCK",
};

function Row<T>({
  label,
  fact,
  format,
  setHref,
  setLabel,
}: {
  label: string;
  fact: BodyFact<T> | null;
  format: (v: T) => string;
  setHref: string;
  setLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 border-b border-sf-line-hairline last:border-b-0">
      <span className="font-sans text-[12px] font-medium uppercase text-t3">{label}</span>
      <span className="ml-auto flex items-center gap-3">
        {fact ? (
          <>
            <span className="font-mono text-[14px] text-t1">{format(fact.value)}</span>
            <Link
              to={fact.source.href}
              title={`Edit at the source: ${fact.source.label}`}
              className="inline-flex min-h-hit items-center font-mono text-[12px] text-sf-primary-text underline-offset-2 hover:underline"
            >
              {SOURCE_TAG[fact.source.kind] ?? "// SOURCE"}
            </Link>
          </>
        ) : (
          <>
            <span className="font-mono text-[13px] text-t4">NOT ON FILE</span>
            <Link
              to={setHref}
              className="inline-flex min-h-hit items-center font-mono text-[12px] text-sf-primary-text underline-offset-2 hover:underline"
            >
              {setLabel}
            </Link>
          </>
        )}
      </span>
    </div>
  );
}

const num = (digits: number, unit: string) => (v: number) => `${v.toFixed(digits)} ${unit}`;

export function BodyFactsPanel({ facts, setHref, setLabel }: BodyFactsPanelProps) {
  const radiusKm = bodyRadiusKm(facts);
  const common = { setHref, setLabel };
  return (
    <div>
      <Row
        label="Radius"
        fact={facts.radiusEarth}
        format={(v) => `${v.toFixed(2)} R⊕${radiusKm ? ` · ${Math.round(radiusKm).toLocaleString("en-US")} km` : ""}`}
        {...common}
      />
      <Row label="Surface gravity" fact={facts.surfaceGravityG} format={num(2, "g")} {...common} />
      <Row label="Axial tilt" fact={facts.tiltDeg} format={(v) => `${v.toFixed(1)}°`} {...common} />
      <Row label="Day length" fact={facts.dayLengthHours} format={num(1, "h")} {...common} />
      <Row
        label="Tidal state"
        fact={facts.tidallyLocked}
        format={(v) => (v ? "LOCKED" : "FREE ROTATION")}
        {...common}
      />
      <Row label="Mean temperature" fact={facts.meanTempC} format={num(0, "°C")} {...common} />
      <Row label="Ocean cover" fact={facts.oceanFraction} format={(v) => `${Math.round(v * 100)}%`} {...common} />
      <Row label="Atmosphere" fact={facts.atmoPressureBar} format={num(2, "bar")} {...common} />
      <Row label="Star" fact={facts.starClass} format={(v) => v} {...common} />
      {facts.habitablePercent && (
        <Row
          label="Habitable band"
          fact={facts.habitablePercent}
          format={(v) => `${v.toFixed(1)}% of surface`}
          {...common}
        />
      )}
    </div>
  );
}

export default BodyFactsPanel;
