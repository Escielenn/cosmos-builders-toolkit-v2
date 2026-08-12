// ---------------------------------------------------------------------------
// WorksheetFactsPanel, the writer's view of what their tools actually say.
//
// Before this, the writing surface could show a worksheet's *name* but never
// its contents — pins carried the tool's marketing tagline, so a writer who
// pinned "Genesis: Planetary Profile" saw a product blurb instead of their
// planet's gravity. This reads the real values out of the worksheet blob and
// lets the writer drop them straight into the prose.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { CornerDownLeft, ExternalLink } from "lucide-react";
import { useWorksheets } from "@/hooks/use-worksheets";
import { getToolDisplayName, getToolRoute } from "@/lib/tools-config";
import { extractWorksheetFacts, type WorksheetFact } from "@/lib/worksheet-facts";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorksheetFactsPanelProps {
  worldId: string | undefined;
  /** Drop text at the cursor in the editor. */
  onInsert: (text: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorksheetFactsPanel({ worldId, onInsert }: WorksheetFactsPanelProps) {
  // List hook, not useWorksheet — the single-worksheet hook throws for
  // non-owners, which would break this panel for collaborators.
  const { worksheets, isLoading } = useWorksheets(worldId);

  if (!worldId) return null;

  if (isLoading) {
    return (
      <p className="px-4 py-6 font-mono text-[12px] uppercase tracking-[1.5px] text-t4">
        // Reading tool data…
      </p>
    );
  }

  const sheets = (worksheets ?? [])
    .map((ws) => ({
      id: ws.id,
      toolType: ws.tool_type,
      title: ws.title || getToolDisplayName(ws.tool_type),
      facts: extractWorksheetFacts(ws.tool_type, ws.data),
    }))
    .filter((s) => s.facts.length > 0);

  if (sheets.length === 0) {
    return (
      <div className="px-4 py-6">
        <p className="mb-2 font-heading text-[12px] uppercase tracking-[1.5px] text-t3">
          No tool data yet
        </p>
        <p className="mb-4 text-[13px] leading-relaxed text-t2">
          Fill in a worldbuilding tool and its values show up here, ready to drop
          into your prose.
        </p>
        <Link
          to="/guide/tools"
          className="inline-flex items-center gap-1.5 border border-sf-border px-3 py-2 text-[13px] text-t2 transition-colors hover:border-sf-teal hover:text-t1"
        >
          Browse the tools
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="py-2">
      {sheets.map((sheet) => {
        const route = getToolRoute(sheet.toolType);
        return (
          <div key={sheet.id} className="mb-4 last:mb-0">
            <div className="flex items-baseline gap-2 border-b border-white/[0.06] px-3 pb-1.5">
              <span className="min-w-0 flex-1 truncate font-heading text-[12px] uppercase tracking-[1.5px] text-sf-emerald">
                {sheet.title}
              </span>
              {route && (
                <Link
                  to={`${route}?worldId=${worldId}&worksheetId=${sheet.id}`}
                  className="shrink-0 font-mono text-[11px] uppercase tracking-[1px] text-t4 transition-colors hover:text-sf-teal"
                  title="Open this worksheet"
                >
                  Open
                </Link>
              )}
            </div>

            <ul className="px-3 pt-1.5">
              {sheet.facts.map((fact) => (
                <FactRow
                  key={fact.key}
                  fact={fact}
                  onInsert={() => onInsert(`${fact.value}`)}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function FactRow({ fact, onInsert }: { fact: WorksheetFact; onInsert: () => void }) {
  return (
    <li className="group flex items-baseline gap-2 py-1">
      <span className="w-[42%] shrink-0 text-[11px] font-medium uppercase tracking-[1.5px] text-t3">
        {fact.label}
      </span>
      <span className="min-w-0 flex-1 break-words font-mono text-[12px] text-t1">
        {fact.value}
      </span>
      <button
        onClick={onInsert}
        title={`Insert "${fact.value}" at the cursor`}
        aria-label={`Insert ${fact.label} into the document`}
        className="shrink-0 p-1 text-t5 opacity-0 transition-opacity hover:text-sf-teal focus-visible:opacity-100 group-hover:opacity-100"
      >
        <CornerDownLeft className="h-3 w-3" />
      </button>
    </li>
  );
}

export default WorksheetFactsPanel;
