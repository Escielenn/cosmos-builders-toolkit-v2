// ---------------------------------------------------------------------------
// Graph Export Utilities
// PNG screenshot, JSON data export, cascade audit markdown export.
// ---------------------------------------------------------------------------

import type { Entity, EntityConnection } from "@/services/entity-graph-types";
import {
  CASCADE_STAGE_LABELS,
  ENTITY_TYPE_LABELS,
  formatRelationshipType,
} from "@/services/entity-graph-types";
import type { CascadeAuditResult, CascadeAuditNode } from "./graph-algorithms";

// ---------------------------------------------------------------------------
// PNG Export, uses html2canvas on the graph container
// ---------------------------------------------------------------------------

export async function exportGraphAsPNG(
  containerElement: HTMLElement
): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");

  const canvas = await html2canvas(containerElement, {
    scale: 2,
    backgroundColor: "#0A0E17",
    logging: false,
    useCORS: true,
    // Ignore overlays like toolbar, panels
    ignoreElements: (el) => {
      return el.classList.contains("react-flow__controls") ||
        el.classList.contains("react-flow__minimap") ||
        el.hasAttribute("data-export-ignore");
    },
  });

  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, "world-graph.png");
  }, "image/png");
}

// ---------------------------------------------------------------------------
// JSON Export, full entity + connection data
// ---------------------------------------------------------------------------

export function exportGraphAsJSON(
  entities: Entity[],
  connections: EntityConnection[],
  worldName?: string
): void {
  const data = {
    format: "stellarforge-world-graph",
    version: 1,
    exported_at: new Date().toISOString(),
    world_name: worldName ?? "Unknown World",
    entities: entities.map((e) => ({
      id: e.id,
      name: e.name,
      entity_type: e.entity_type,
      cascade_stage: e.cascade_stage,
      summary: e.summary,
      tags: e.tags,
      metadata: e.metadata,
      graph_x: e.graph_x,
      graph_y: e.graph_y,
    })),
    connections: connections.map((c) => ({
      id: c.id,
      source_entity_id: c.source_entity_id,
      target_entity_id: c.target_entity_id,
      relationship_type: c.relationship_type,
      relationship_label: c.relationship_label,
      cascade_stage: c.cascade_stage,
      bidirectional: c.bidirectional,
      strength: c.strength,
      status: c.status,
      time_start: c.time_start,
      time_end: c.time_end,
    })),
    stats: {
      entity_count: entities.length,
      connection_count: connections.length,
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, "world-graph.json");
}

// ---------------------------------------------------------------------------
// Cascade Audit Markdown Export
// ---------------------------------------------------------------------------

export function exportCascadeAuditAsMarkdown(
  result: CascadeAuditResult
): void {
  const lines: string[] = [];

  lines.push(`# Cascade Audit: ${result.rootEntityName}`);
  lines.push("");
  lines.push(`**Root Stage:** ${CASCADE_STAGE_LABELS[result.rootCascadeStage]}`);
  lines.push(`**Cascade Depth:** ${result.cascadeDepth} stages${result.cascadeDepth === 6 ? " (full cascade)" : ""}`);
  lines.push(`**Total Affected Entities:** ${result.totalAffected}`);
  if (result.widestBranch) {
    lines.push(`**Widest Branch:** ${CASCADE_STAGE_LABELS[result.widestBranch.stage]} (${result.widestBranch.count} entities)`);
  }
  lines.push("");

  // Upstream
  lines.push("## Upstream (what produced this)");
  lines.push("");
  if (result.upstream.length === 0) {
    lines.push("_No upstream connections._");
  } else {
    renderAuditTree(result.upstream, lines, 0, "←");
  }
  lines.push("");

  // Downstream
  lines.push("## Downstream (what this produces)");
  lines.push("");
  if (result.downstream.length === 0) {
    lines.push("_No downstream cascade effects._");
  } else {
    renderAuditTree(result.downstream, lines, 0, "→");
  }
  lines.push("");

  // What-if
  lines.push("## What-If");
  lines.push("");
  lines.push(`> ${result.whatIfPrompt}`);
  lines.push("");
  lines.push("---");
  lines.push("_Exported from StellarForge World Graph_");

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  downloadBlob(blob, `cascade-audit-${result.rootEntityName.toLowerCase().replace(/\s+/g, "-")}.md`);
}

function renderAuditTree(
  nodes: CascadeAuditNode[],
  lines: string[],
  depth: number,
  arrow: string
): void {
  const indent = "  ".repeat(depth);
  for (const node of nodes) {
    const typeLabel = (ENTITY_TYPE_LABELS as Record<string, string>)[node.entityType] ?? node.entityType;
    const stageLabel = CASCADE_STAGE_LABELS[node.cascadeStage];
    lines.push(
      `${indent}${arrow} **${node.entityName}** (${typeLabel}, ${stageLabel})${node.connectionLabel ? `, _${node.connectionLabel}_` : ""}`
    );
    if (node.children.length > 0) {
      renderAuditTree(node.children, lines, depth + 1, arrow);
    }
  }
}

// ---------------------------------------------------------------------------
// Shared download helper
// ---------------------------------------------------------------------------

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
