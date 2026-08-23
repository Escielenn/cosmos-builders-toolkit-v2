// ---------------------------------------------------------------------------
// CascadeAuditPanel, The Environmental Cascade turned into a revision
// assistant. Shows the full upstream/downstream cascade tree for an entity.
// Section 9 of the spec.
// ---------------------------------------------------------------------------

import { useMemo, useCallback } from "react";
import { X, ChevronRight, Lightbulb, ArrowUp, ArrowDown, Download } from "lucide-react";
import { exportCascadeAuditAsMarkdown } from "./graph-export";
import {
  CASCADE_STAGE_COLORS,
  CASCADE_STAGE_LABELS,
  ENTITY_TYPE_COLORS,
  type Entity,
  type EntityConnection,
  type CascadeStage,
} from "@/services/entity-graph-types";
import {
  cascadeAudit,
  type CascadeAuditNode,
  type CascadeAuditResult,
} from "./graph-algorithms";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CascadeAuditPanelProps {
  entityId: string | null;
  entities: Entity[];
  connections: EntityConnection[];
  onClose: () => void;
  onHighlightEntities: (ids: string[]) => void;
  onHighlightConnections: (ids: string[]) => void;
  onFocusEntity: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Recursive tree node
// ---------------------------------------------------------------------------

function AuditTreeNode({
  node,
  depth,
  onFocusEntity,
}: {
  node: CascadeAuditNode;
  depth: number;
  onFocusEntity: (id: string) => void;
}) {
  const stageColor = CASCADE_STAGE_COLORS[node.cascadeStage] ?? "#FFB800";
  const entityColor = (ENTITY_TYPE_COLORS as Record<string, string>)[node.entityType] ?? stageColor;

  return (
    <div style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
      <div className="flex items-start gap-1.5 py-0.5 group">
        {depth > 0 && (
          <span className="text-[12px] text-t4 mt-0.5 shrink-0">
            {node.connectionLabel}
          </span>
        )}
        {depth > 0 && (
          <ChevronRight className="w-2.5 h-2.5 text-t4 mt-0.5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onFocusEntity(node.entityId)}
          className="text-left hover:bg-white/[0.03] transition-colors flex items-center gap-1.5"
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: entityColor }}
          />
          <span className="text-[12px] font-sans text-t2">
            {node.entityName}
          </span>
          <span
            className="text-[12px] uppercase tracking-[0.5px] px-1 py-0.5"
            style={{
              color: stageColor,
              background: `${stageColor}10`,
              border: `1px solid ${stageColor}20`,
            }}
          >
            {node.cascadeStage.slice(0, 4)}
          </span>
        </button>
      </div>
      {node.children.map((child) => (
        <AuditTreeNode
          key={child.entityId}
          node={child}
          depth={depth + 1}
          onFocusEntity={onFocusEntity}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function CascadeAuditPanel({
  entityId,
  entities,
  connections,
  onClose,
  onHighlightEntities,
  onHighlightConnections,
  onFocusEntity,
}: CascadeAuditPanelProps) {
  const result = useMemo<CascadeAuditResult | null>(() => {
    if (!entityId) return null;
    return cascadeAudit(entities, connections, entityId);
  }, [entityId, entities, connections]);

  // Highlight all audit entities/connections
  const handleHighlightAll = useCallback(() => {
    if (!result) return;
    onHighlightEntities(Array.from(result.allEntityIds));
    onHighlightConnections(Array.from(result.allConnectionIds));
  }, [result, onHighlightEntities, onHighlightConnections]);

  if (!entityId || !result) return null;

  const rootColor = CASCADE_STAGE_COLORS[result.rootCascadeStage];

  return (
    <div
      className="absolute top-0 right-0 z-20 h-full w-[340px] overflow-y-auto"
      style={{
        background: "rgba(15,15,16,0.95)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(16px)",
        animation: "slideInRight 300ms ease-out",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sf-line-interactive">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: rootColor }}
          />
          <h3 className="font-heading text-[12px] uppercase tracking-[2px] text-sf-teal">
            Cascade Audit
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-t4 hover:text-t2 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Root entity header */}
        <div
          className="px-3 py-2"
          style={{
            border: `1px solid ${rootColor}25`,
            background: `${rootColor}06`,
          }}
        >
          <div className="text-[12px] font-heading uppercase tracking-[1.5px] text-t1">
            The Cascade of: {result.rootEntityName}
          </div>
          <div className="text-[12px] font-sans text-t3 mt-0.5">
            {CASCADE_STAGE_LABELS[result.rootCascadeStage]} stage
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 text-[12px] font-mono">
          <div>
            <span className="text-t4">Depth:</span>{" "}
            <span className="text-t1">{result.cascadeDepth} stages</span>
            {result.cascadeDepth === 6 && (
              <span className="text-sf-teal ml-1">(full cascade)</span>
            )}
          </div>
          <div>
            <span className="text-t4">Affected:</span>{" "}
            <span className="text-t1">{result.totalAffected}</span>
          </div>
          {result.widestBranch && (
            <div>
              <span className="text-t4">Widest:</span>{" "}
              <span style={{ color: CASCADE_STAGE_COLORS[result.widestBranch.stage] }}>
                {result.widestBranch.stage}
              </span>{" "}
              <span className="text-t3">({result.widestBranch.count})</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleHighlightAll}
            className="flex-1 text-[12px] font-sans text-sf-teal uppercase tracking-[1px] py-1.5 border border-sf-teal hover:bg-sf-teal/5 transition-colors text-center"
          >
            Highlight cascade
          </button>
          <button
            type="button"
            onClick={() => result && exportCascadeAuditAsMarkdown(result)}
            className="flex items-center gap-1 text-[12px] font-sans text-t3 uppercase tracking-[1px] py-1.5 px-3 border border-sf-line-interactive hover:bg-white/5 transition-colors"
          >
            <Download className="w-3 h-3" />
            MD
          </button>
        </div>

        {/* Upstream */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowUp className="w-3 h-3 text-azure" />
            <h4 className="text-[12px] font-heading uppercase tracking-[2px] text-azure">
              Upstream (what produced this)
            </h4>
          </div>
          {result.upstream.length === 0 ? (
            <p className="text-[12px] text-t4 font-sans italic pl-4">
              No upstream connections found.
            </p>
          ) : (
            <div className="pl-2 border-l border-sf-azure">
              {result.upstream.map((node) => (
                <AuditTreeNode
                  key={node.entityId}
                  node={node}
                  depth={0}
                  onFocusEntity={onFocusEntity}
                />
              ))}
            </div>
          )}
        </div>

        {/* Downstream */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowDown className="w-3 h-3 text-sf-amber" />
            <h4 className="text-[12px] font-heading uppercase tracking-[2px] text-sf-amber">
              Downstream (what this produces)
            </h4>
          </div>
          {result.downstream.length === 0 ? (
            <p className="text-[12px] text-t4 font-sans italic pl-4">
              No downstream cascade effects yet.
            </p>
          ) : (
            <div className="pl-2 border-l border-sf-amber">
              {result.downstream.map((node) => (
                <AuditTreeNode
                  key={node.entityId}
                  node={node}
                  depth={0}
                  onFocusEntity={onFocusEntity}
                />
              ))}
            </div>
          )}
        </div>

        {/* What-if prompt */}
        <div
          className="px-3 py-2 flex items-start gap-2"
          style={{
            background: "rgba(91,141,239,0.06)",
            border: "1px solid rgba(91,141,239,0.15)",
          }}
        >
          <Lightbulb className="w-3.5 h-3.5 text-stellar mt-0.5 shrink-0" />
          <p className="text-[12px] font-sans text-t2 leading-snug italic">
            {result.whatIfPrompt}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
