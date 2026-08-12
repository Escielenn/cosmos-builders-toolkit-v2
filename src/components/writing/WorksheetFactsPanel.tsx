// ---------------------------------------------------------------------------
// WorksheetFactsPanel, the writer's view of what their tools actually say.
//
// Before this, the writing surface could show a worksheet's *name* but never
// its contents — pins carried the tool's marketing tagline, so a writer who
// pinned "Genesis: Planetary Profile" saw a product blurb instead of their
// planet's gravity. This reads the real values out of the worksheet blob and
// lets the writer drop them straight into the prose.
//
// Simulators are the second source. They persist to a different table, so their
// output was invisible here: star names, orbital distances and the
// constellations a writer drew and named by hand all lived in the database with
// no way into the manuscript. Both sources render as the same fact rows.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { CornerDownLeft, ExternalLink } from "lucide-react";
import { useWorksheets } from "@/hooks/use-worksheets";
import { useWorldSimulations } from "@/hooks/use-world-simulations";
import { getToolDisplayName, getToolRoute } from "@/lib/tools-config";
import { extractWorksheetFacts, type WorksheetFact } from "@/lib/worksheet-facts";
import { extractSimulationFacts } from "@/lib/simulation-facts";

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
  const { simulations, isLoading: loadingSims } = useWorldSimulations(worldId);

  if (!worldId) return null;

  if (isLoading || loadingSims) {
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

  // A saved simulation whose shape has no extractor yet yields nothing, so it
  // drops out rather than showing an empty heading.
  const sims = simulations
    .map((sim) => ({
      id: sim.id,
      toolType: sim.simulator_type,
      title: sim.name || getToolDisplayName(sim.simulator_type),
      facts: extractSimulationFacts(sim.simulator_type, sim.data),
    }))
    .filter((s) => s.facts.length > 0);

  const groups = [...sheets, ...sims];

  if (groups.length === 0) {
    return (
      <div className="px-4 py-6">
        <p className="mb-2 font-heading text-[12px] uppercase tracking-[1.5px] text-t3">
          No tool data yet
        </p>
        <p className="mb-4 text-[13px] leading-relaxed text-t2">
          Fill in a worldbuilding tool, or lock in a simulation, and the values
          show up here ready to drop into your prose. Saved simulations are
          visible to whoever owns the world.
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
      {groups.map((group) => {
        const route = getToolRoute(group.toolType);
        // Worksheets deep-link to the saved sheet; a simulator reloads its own
        // saves from inside, so it only needs the world.
        const isSim = sims.some((s) => s.id === group.id);
        const href = route
          ? isSim
            ? `${route}?worldId=${worldId}`
            : `${route}?worldId=${worldId}&worksheetId=${group.id}`
          : null;

        return (
          <div key={group.id} className="mb-4 last:mb-0">
            <div className="flex items-baseline gap-2 border-b border-white/[0.06] px-3 pb-1.5">
              <span className="min-w-0 flex-1 truncate font-heading text-[12px] uppercase tracking-[1.5px] text-sf-emerald">
                {group.title}
              </span>
              {href && (
                <Link
                  to={href}
                  className="shrink-0 font-mono text-[11px] uppercase tracking-[1px] text-t4 transition-colors hover:text-sf-teal"
                  title={isSim ? "Open this simulator" : "Open this worksheet"}
                >
                  Open
                </Link>
              )}
            </div>

            <ul className="px-3 pt-1.5">
              {group.facts.map((fact) => (
                <FactRow
                  key={fact.key}
                  fact={fact}
                  onInsert={() => onInsert(fact.insert ?? fact.value)}
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
        title={`Insert "${fact.insert ?? fact.value}" at the cursor`}
        aria-label={`Insert ${fact.label} into the document`}
        className="shrink-0 p-1 text-t5 opacity-0 transition-opacity hover:text-sf-teal focus-visible:opacity-100 group-hover:opacity-100"
      >
        <CornerDownLeft className="h-3 w-3" />
      </button>
    </li>
  );
}

export default WorksheetFactsPanel;
