/**
 * GuidedFirstWorld, Cascade-path empty state for new worlds.
 *
 * When a world has zero worksheets and zero entries, the dashboard
 * shows a guided path through the cascade layers.
 *
 * Dismisses automatically once any content is created.
 *
 * Spec: StellarForge_Final_Remediation_Spec_v2, Issue 8
 */

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

const CASCADE_PATH = [
  {
    layer: "Stars & Systems",
    color: "#FFB800",
    description: "Begin with the physics of your world",
    toolType: "star-system-builder",
    brandName: "Orrery",
    isStart: true,
  },
  {
    layer: "Worlds",
    color: "#4D9FFF",
    description: "Then define the planet",
    toolType: "planetary-profile",
    brandName: "Genesis",
  },
  {
    layer: "Life",
    color: "#00FF88",
    description: "Then explore what lives there",
    toolType: "evolutionary-biology",
    brandName: "Phylo",
  },
  {
    layer: "Civilizations",
    color: "#9B5DE5",
    description: "Then build the cultures",
    toolType: "empire-designer",
    brandName: "Dominion",
  },
  {
    layer: "Mythology",
    color: "#5B8DEF",
    description: "Then discover their stories",
    toolType: "xenomythology-framework-builder",
    brandName: "Mythos",
  },
  {
    layer: "Integration",
    color: "#15C17B",
    description: "Then trace the full cascade",
    toolType: "environmental-chain-reaction",
    brandName: "Cascade",
  },
];

interface GuidedFirstWorldProps {
  worldId: string;
}

export default function GuidedFirstWorld({ worldId }: GuidedFirstWorldProps) {
  return (
    <GlassPanel glow className="p-6 md:p-8">
      <h2 className="font-heading text-sm font-light uppercase tracking-[3px] text-primary mb-1">
        Begin Your World
      </h2>
      <p className="text-t3 text-sm mb-6">
        Every world follows the cascade: physics shapes environment, environment shapes biology, biology shapes culture. Start anywhere, but the path below traces the natural order.
      </p>

      <div className="space-y-1">
        {CASCADE_PATH.map((step, i) => (
          <Link
            key={step.toolType}
            to={`/worlds/${worldId}/tools/${step.toolType}`}
            className="group flex items-center gap-3 py-2.5 px-3 hover:bg-white/[0.03] transition-colors"
          >
            {/* Vertical connector line + dot */}
            <div className="relative flex flex-col items-center w-4 shrink-0">
              <div
                className="w-2 h-2 rounded-full border-2 transition-colors"
                style={{
                  borderColor: step.color,
                  backgroundColor: step.isStart ? step.color : "transparent",
                }}
              />
              {i < CASCADE_PATH.length - 1 && (
                <div className="w-px h-6 bg-white/[0.08] absolute top-3" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span
                  className="font-heading text-[12px] uppercase tracking-[2px]"
                  style={{ color: step.color }}
                >
                  {step.layer}
                </span>
                <span className="font-mono text-[11px] text-t4">
                  {step.brandName}
                </span>
              </div>
              <p className="text-xs text-t3 mt-0.5">
                {step.isStart ? (
                  <span className="text-t2">{step.description}</span>
                ) : (
                  step.description
                )}
              </p>
            </div>

            {/* Arrow */}
            <ChevronRight
              className="w-3.5 h-3.5 text-t5 group-hover:text-t3 transition-colors shrink-0"
            />
          </Link>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/[0.06]">
        <Button asChild className="gap-2">
          <Link to={`/worlds/${worldId}/tools/star-system-builder`}>
            Start Here
            <ChevronRight className="w-4 h-4" />
          </Link>
        </Button>
        <p className="text-[11px] text-t5 font-mono uppercase tracking-wider mt-2">
          Or start with any tool. There are no wrong paths.
        </p>
      </div>
    </GlassPanel>
  );
}
