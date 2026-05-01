/**
 * World Export Formatter
 *
 * Transforms a WorldSnapshot into ordered, human-readable ExportSection[]
 * by pulling from THREE sources per element:
 *   1. Tool data (worksheets) → data tables, numerical values, parameters
 *   2. Wiki page content (world_entries) → user-written prose
 *   3. Chronicle events → timeline entries linked to elements
 *
 * All downstream export formats (PDF, DOCX, Markdown, Scrivener) consume
 * the same ExportSection[], single source of truth.
 */

import type { WorldSnapshot, WorldSnapshotEntry, WorldSnapshotChronicleEvent } from "@/lib/export/world-snapshot";
import { getInfoboxFields } from "@/services/infoboxTemplates";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ExportSection {
  title: string;
  layer: string;
  order: number;
  subsections: ExportSubsection[];
}

export interface ExportSubsection {
  title: string;
  toolSource: string | null;
  coverImageUrl: string | null;
  infobox: { label: string; value: string }[];
  prose: string;
  connections: { relationship: string; targetTitle: string }[];
  timelineEvents: { date: string; title: string; description: string }[];
}

// ──────────────────────────────────────────────
// Layer definitions
// ──────────────────────────────────────────────

interface LayerDefinition {
  key: string;
  label: string;
  order: number;
  tools: string[];
}

const LAYER_DEFS: LayerDefinition[] = [
  {
    key: "environment",
    label: "Environment",
    order: 1,
    tools: [
      "star-system-builder",
      "planetary-profile",
      "environmental-chain-reaction",
      "habitable-zone-calculator",
      "surface-gravity-calculator",
      "one-big-lie",
    ],
  },
  {
    key: "biology",
    label: "Biology & Evolution",
    order: 2,
    tools: ["evolutionary-biology", "sensorium", "species-interaction-matrix"],
  },
  {
    key: "psychology",
    label: "Psychology & Communication",
    order: 3,
    tools: ["lexdrift"],
  },
  {
    key: "culture",
    label: "Culture & Society",
    order: 4,
    tools: [
      "empire-designer",
      "technology-consequences",
      "drake-equation-calculator",
      "space-expansion-modeler",
    ],
  },
  {
    key: "mythology",
    label: "Mythology & Religion",
    order: 5,
    tools: ["xenomythology-framework-builder"],
  },
  {
    key: "technology",
    label: "Technology & Travel",
    order: 6,
    tools: [
      "spacecraft-designer",
      "propulsion-consequences-map",
      "time-dilation",
      "gravitas",
      "timeline",
    ],
  },
  {
    key: "narrative",
    label: "Narrative",
    order: 7,
    tools: [],
  },
];

/** Map a tool slug to its default layer */
function getLayerForTool(toolSlug: string): string | null {
  for (const layer of LAYER_DEFS) {
    if (layer.tools.includes(toolSlug)) return layer.key;
  }
  return null;
}

// ──────────────────────────────────────────────
// Main formatter
// ──────────────────────────────────────────────

export function formatWorldForExport(snapshot: WorldSnapshot): ExportSection[] {
  const sections: ExportSection[] = [];
  const entries = snapshot.entries || [];
  const worksheets = snapshot.worksheets || [];
  const connections = snapshot.connections || [];
  const chronicle = snapshot.chronicle || [];

  // Track which worksheets are claimed by entries
  const claimedWorksheetIds = new Set<string>();

  // ── OVERVIEW ──
  sections.push({
    title: "World Overview",
    layer: "overview",
    order: 0,
    subsections: [
      {
        title: snapshot.world.name,
        toolSource: null,
        coverImageUrl: snapshot.world.header_image_url,
        infobox: [
          { label: "Created", value: formatDate(snapshot.world.created_at) },
          {
            label: "Tags",
            value: (snapshot.world.tags || []).join(", ") || "None",
          },
        ],
        prose: snapshot.world.description || "",
        connections: [],
        timelineEvents: [],
      },
    ],
  });

  // ── WORLD NOTES ──
  if (snapshot.notes.length > 0) {
    const noteProse = snapshot.notes
      .map((n) => stripHtmlToText(n.content))
      .filter(Boolean)
      .join("\n\n---\n\n");

    if (noteProse.trim()) {
      sections.push({
        title: "World Notes",
        layer: "notes",
        order: 0.5,
        subsections: [
          {
            title: "Notes",
            toolSource: null,
            coverImageUrl: null,
            infobox: [],
            prose: noteProse,
            connections: [],
            timelineEvents: [],
          },
        ],
      });
    }
  }

  // ── LAYER SECTIONS ──
  for (const layerDef of LAYER_DEFS) {
    const subsections: ExportSubsection[] = [];

    // Find entries assigned to this layer
    const layerEntries = entries.filter(
      (e) => e.layer === layerDef.key
    );

    for (const entry of layerEntries) {
      subsections.push(
        buildSubsectionFromEntry(
          entry,
          worksheets,
          connections,
          entries,
          chronicle,
          claimedWorksheetIds
        )
      );
    }

    // Find worksheets in this layer's tools that don't have linked entries
    for (const toolSlug of layerDef.tools) {
      const unlinkedWorksheets = worksheets.filter(
        (ws) =>
          ws.tool_type === toolSlug && !claimedWorksheetIds.has(ws.id)
      );

      for (const ws of unlinkedWorksheets) {
        claimedWorksheetIds.add(ws.id);
        subsections.push(buildSubsectionFromWorksheet(ws));
      }
    }

    if (subsections.length > 0) {
      sections.push({
        title: layerDef.label,
        layer: layerDef.key,
        order: layerDef.order,
        subsections,
      });
    }
  }

  // ── UNCATEGORIZED WORKSHEETS ──
  // Worksheets not claimed by any entry or layer definition
  const unclaimed = worksheets.filter(
    (ws) => !claimedWorksheetIds.has(ws.id)
  );
  if (unclaimed.length > 0) {
    sections.push({
      title: "Additional Tool Data",
      layer: "uncategorized",
      order: 7.5,
      subsections: unclaimed.map((ws) => buildSubsectionFromWorksheet(ws)),
    });
  }

  // ── CHRONICLE ──
  if (chronicle.length > 0) {
    const sorted = [...chronicle].sort(
      (a, b) => a.sort_value - b.sort_value
    );
    sections.push({
      title: "Chronicle",
      layer: "chronicle",
      order: 8,
      subsections: sorted.map((ev) => ({
        title: ev.title,
        toolSource: null,
        coverImageUrl: null,
        infobox: [
          { label: "Date", value: ev.event_date },
          { label: "Type", value: ev.event_type },
          ...(ev.end_date
            ? [{ label: "End Date", value: ev.end_date }]
            : []),
          ...(ev.layer
            ? [{ label: "Layer", value: ev.layer }]
            : []),
        ],
        prose: ev.description || "",
        connections: [],
        timelineEvents: [],
      })),
    });
  }

  // ── CUSTOM ENTRIES ──
  const customEntries = entries.filter(
    (e) => !e.layer && !e.tool_source
  );
  if (customEntries.length > 0) {
    sections.push({
      title: "Additional Notes",
      layer: "custom",
      order: 9,
      subsections: customEntries.map((e) => ({
        title: e.title,
        toolSource: null,
        coverImageUrl: e.cover_image_url || null,
        infobox: [],
        prose: e.content ? stripHtmlToText(e.content) : "",
        connections: findConnectionsForEntry(e.id, connections, entries),
        timelineEvents: findEventsForEntry(e.id, chronicle),
      })),
    });
  }

  return sections.sort((a, b) => a.order - b.order);
}

// ──────────────────────────────────────────────
// Subsection builders
// ──────────────────────────────────────────────

function buildSubsectionFromEntry(
  entry: WorldSnapshotEntry,
  worksheets: WorldSnapshot["worksheets"],
  connections: WorldSnapshot["connections"],
  allEntries: WorldSnapshotEntry[],
  chronicle: WorldSnapshotChronicleEvent[],
  claimedWorksheetIds: Set<string>
): ExportSubsection {
  let infobox: { label: string; value: string }[] = [];

  // If linked to a worksheet, extract infobox fields
  if (entry.tool_source && entry.tool_data_id) {
    const ws = worksheets.find((w) => w.id === entry.tool_data_id);
    if (ws) {
      claimedWorksheetIds.add(ws.id);
      const toolData = (ws.data as Record<string, unknown>) || {};
      infobox = generateInfoboxForExport(entry.tool_source, toolData);
    }
  }

  return {
    title: entry.title,
    toolSource: entry.tool_source,
    coverImageUrl: entry.cover_image_url || null,
    infobox,
    prose: entry.content ? stripHtmlToText(entry.content) : "",
    connections: findConnectionsForEntry(
      entry.id,
      connections,
      allEntries
    ),
    timelineEvents: findEventsForEntry(entry.id, chronicle),
  };
}

function buildSubsectionFromWorksheet(
  ws: WorldSnapshot["worksheets"][number]
): ExportSubsection {
  const toolData = (ws.data as Record<string, unknown>) || {};
  const title =
    ws.title ||
    (toolData.name as string) ||
    (toolData.title as string) ||
    (toolData.speciesName as string) ||
    (toolData.systemName as string) ||
    (toolData.technologyName as string) ||
    ws.tool_type;

  return {
    title,
    toolSource: ws.tool_type,
    coverImageUrl: null,
    infobox: generateInfoboxForExport(ws.tool_type, toolData),
    prose: "",
    connections: [],
    timelineEvents: [],
  };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function findConnectionsForEntry(
  entryId: string,
  connections: WorldSnapshot["connections"],
  allEntries: WorldSnapshotEntry[]
): { relationship: string; targetTitle: string }[] {
  return connections
    .filter(
      (c) => c.source_entry_id === entryId || c.target_entry_id === entryId
    )
    .map((c) => {
      const otherId =
        c.source_entry_id === entryId
          ? c.target_entry_id
          : c.source_entry_id;
      return {
        relationship: c.connection_type || c.description || "related",
        targetTitle: findEntryTitle(allEntries, otherId),
      };
    })
    .filter((c) => c.targetTitle !== "Unknown");
}

function findEventsForEntry(
  entryId: string,
  chronicle: WorldSnapshotChronicleEvent[]
): { date: string; title: string; description: string }[] {
  return chronicle
    .filter((ev) => ev.linked_entry_id === entryId)
    .sort((a, b) => a.sort_value - b.sort_value)
    .map((ev) => ({
      date: ev.event_date,
      title: ev.title,
      description: ev.description || "",
    }));
}

function findEntryTitle(
  entries: WorldSnapshotEntry[],
  id: string | null
): string {
  if (!id) return "Unknown";
  const entry = entries.find((e) => e.id === id);
  return entry?.title || "Unknown";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function generateInfoboxForExport(
  toolSource: string,
  toolData: Record<string, unknown>
): { label: string; value: string }[] {
  // Use the infobox templates from Phase 4
  const fields = getInfoboxFields(toolSource, toolData);
  if (fields.length > 0) {
    return fields.map((f) => ({
      label: f.label,
      value: f.unit ? `${f.value} ${f.unit}` : String(f.value ?? ""),
    }));
  }

  // Fallback: extract non-system fields from tool data
  const systemFields = [
    "id",
    "world_id",
    "user_id",
    "created_at",
    "updated_at",
    "archived_at",
    "tool_type",
    "tags",
  ];
  return Object.entries(toolData)
    .filter(([key]) => !systemFields.includes(key))
    .filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== "" &&
        typeof value !== "object"
    )
    .slice(0, 20) // limit for sanity
    .map(([key, value]) => ({
      label: key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      value: String(value),
    }));
}

/**
 * Strip HTML to plain text for exports.
 * Preserves paragraph breaks and heading structure.
 * Converts wiki-links to plain text titles.
 */
export function stripHtmlToText(html: string): string {
  // Replace wiki-link elements with their title text
  let text = html.replace(
    /<wiki-link[^>]*data-title="([^"]*)"[^>]*>[^<]*<\/wiki-link>/g,
    "$1"
  );

  // Replace heading tags with markdown-style headings
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");

  // Replace paragraph tags with double newlines
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "");

  // Replace line breaks
  text = text.replace(/<br\s*\/?>/gi, "\n");

  // Replace blockquotes
  text = text.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gis,
    "\n> $1\n"
  );

  // Replace list items
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "\u2022 $1\n");

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, "\n\n").trim();

  // Decode HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&middot;/g, "\u00B7");

  return text;
}

/**
 * Convert wiki-link elements to [[Title]] for Markdown export.
 */
export function stripHtmlToMarkdown(html: string): string {
  let text = html.replace(
    /<wiki-link[^>]*data-title="([^"]*)"[^>]*>[^<]*<\/wiki-link>/g,
    "[[$1]]"
  );

  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gis,
    "\n> $1\n"
  );
  text = text.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  text = text.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013");

  return text;
}
