/**
 * FactInfobox — the GENERATED half of an entity page (Brief F1 §2).
 *
 * Every row is a value an instrument recorded about this entity, derived on
 * read from the worksheets attached through entity_worksheets. Nothing here
 * is editable: to change a number you go to the instrument that produced
 * it, which is what the provenance chip on each row opens. When two
 * instruments disagree the row shows both — a contradiction on file is
 * information, not noise (00-CONSTITUTION Law II).
 */

import { useNavigate } from "react-router-dom";
import { getToolDisplayName } from "@/lib/worksheet-links-config";
import type { InfoboxRow, FactSource } from "@/lib/codex-entity";

interface FactInfoboxProps {
  worldId: string;
  rows: InfoboxRow[];
  isLoading?: boolean;
}

function ProvenanceChip({ worldId, source }: { worldId: string; source: FactSource }) {
  const navigate = useNavigate();
  const label = getToolDisplayName(source.toolType) || source.toolType;
  return (
    <button
      type="button"
      onClick={() => navigate(`/worlds/${worldId}/tools/${source.toolType}?worksheetId=${source.worksheetId}`)}
      title={source.worksheetTitle ? `${label} · ${source.worksheetTitle}` : label}
      aria-label={`Open ${label}${source.worksheetTitle ? ` — ${source.worksheetTitle}` : ""}`}
      className="ml-2 shrink-0 border border-sf-line px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-wider text-t3 transition-colors duration-fast hover:border-sf-primary hover:text-sf-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-focus"
    >
      {label}
    </button>
  );
}

export default function FactInfobox({ worldId, rows, isLoading }: FactInfoboxProps) {
  if (isLoading && rows.length === 0) return null;
  return (
    <div className="sf-infobox">
      <div className="sf-infobox-header">ON FILE</div>
      {rows.length === 0 ? (
        <p className="py-2 font-mono text-[12px] uppercase tracking-wider text-t4">
          // NO INSTRUMENT HAS RECORDED THIS ENTITY YET.
        </p>
      ) : (
        rows.map((row) => (
          <div key={row.key} className="py-1 border-b border-sf-line-hairline last:border-b-0">
            <div className="flex items-center justify-between gap-2">
              <span className="sf-infobox-label">{row.label}</span>
              <span className="flex items-center min-w-0">
                <span className="sf-infobox-value truncate">{row.value}</span>
                <ProvenanceChip worldId={worldId} source={row.source} />
              </span>
            </div>
            {row.conflicts.map((c) => (
              <div
                key={`${row.key}:${c.source.worksheetId}`}
                className="mt-0.5 flex items-center justify-between gap-2 pl-3"
                role="note"
              >
                <span className="font-mono text-[12px] uppercase tracking-wider text-sf-crimson-text">// CONTRADICTED</span>
                <span className="flex items-center min-w-0">
                  <span className="sf-infobox-value truncate text-sf-crimson-text">{c.value}</span>
                  <ProvenanceChip worldId={worldId} source={c.source} />
                </span>
              </div>
            ))}
          </div>
        ))
      )}
      <div className="sf-infobox-source">
        <span className="font-mono text-[12px] uppercase tracking-wider text-t4">
          GENERATED FROM {rows.length === 0 ? "NO" : new Set(rows.map((r) => r.source.worksheetId)).size} INSTRUMENT
          {new Set(rows.map((r) => r.source.worksheetId)).size === 1 ? "" : "S"} · NEVER HAND-EDITED
        </span>
      </div>
    </div>
  );
}
