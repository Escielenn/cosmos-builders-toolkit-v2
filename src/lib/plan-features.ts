// ---------------------------------------------------------------------------
// What each plan includes. The single source for Pricing, the Pro welcome
// dialog, the upgrade dialog and the Pro tool lock screen, so a promise can
// only be made in one place.
//
// Every line here must describe something that ships and is gated the way it
// says. Before adding a line, find the gate:
//   tools          getToolAccess (src/lib/tools-config.ts)
//   world exports  PRO_FORMATS in src/components/world/WorldExportDialog.tsx
//   world bible    WorldBibleDialog (isSubscribed)
//   collaborators  CollaboratorSection (isSubscribed)
//   appearance     WorldAppearanceDialog (isSubscribed)
//   audio upload   audio/UploadTab (isSubscribed)
// The Studio, Codex, Chronicle, Canon, Compile and worksheet exports have no
// subscription gate; they are free with an account. No world or worksheet
// limit is enforced on any plan, so no plan may claim "unlimited worlds" as a
// paid advantage.
// ---------------------------------------------------------------------------

import {
  FREE_TOOL_COUNT,
  PRO_TOOL_COUNT,
  SIMULATOR_COUNT,
  TOTAL_TOOL_COUNT,
} from "@/lib/tools-config";

/**
 * Compile formats, in COMPILE_FORMATS order, labelled as FORMAT_LABELS labels
 * them (src/lib/manuscript/export.ts). Kept as data here so the pricing
 * bundle does not pull in the manuscript pipeline; a test pins the match.
 */
export const COMPILE_FORMAT_NAMES = ["Word (.docx)", "PDF", "EPUB", "Markdown", "plain text"] as const;

/** Worksheet export formats (src/components/tools/ExportDialog.tsx tabs). */
export const WORKSHEET_EXPORT_NAMES = ["PDF", "Word (.docx)", "text", "JSON", "CSV", "Notion"] as const;

/** World export formats that require Pro (WorldExportDialog PRO_FORMATS). */
export const PRO_WORLD_EXPORT_NAMES = ["Word (.docx)", "Markdown archive", "Scrivener 3 project"] as const;

function list(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export interface PlanFeatureGroup {
  heading: string;
  items: string[];
}

/** Free with an account. The whole writing side of the ship. */
export const FREE_PLAN_GROUPS: PlanFeatureGroup[] = [
  {
    heading: "Studio",
    items: [
      "Scrivener-style manuscript: binder, corkboard, outliner",
      "Snapshots to compare and restore any draft",
      "Word targets, labels, status and focus mode",
    ],
  },
  {
    heading: "World",
    items: [
      "Codex of characters, places, factions and things",
      "Chronicle timeline with branching histories",
    ],
  },
  {
    heading: "Canon",
    items: [
      "Capture facts from your prose as you write",
      "Contradiction ledger: prose that disagrees with canon, with resolutions",
      "Canon-changed badges on scenes a decision affects",
    ],
  },
  {
    heading: "Compile & export",
    items: [
      `Compile to ${list(COMPILE_FORMAT_NAMES)}`,
      "Generated back matter: glossary, dramatis personae, series bible",
      `Worksheet export to ${list(WORKSHEET_EXPORT_NAMES)}`,
    ],
  },
  {
    heading: "Instruments",
    items: [`${FREE_TOOL_COUNT} worldbuilding tools`, "Cloud sync with an account"],
  },
];

/** What Pro adds on top of Free. Short enough for a dialog. */
export const PRO_PLAN_ITEMS: string[] = [
  `All ${TOTAL_TOOL_COUNT} instruments, including ${SIMULATOR_COUNT} simulators and both cartographers`,
  "World Bible PDF of an entire world",
  `World export as ${list(PRO_WORLD_EXPORT_NAMES)}`,
  "Collaborator invites (viewer or editor)",
  "Custom world appearance and your own audio tracks",
  "Every future instrument",
];

/** Lock-screen / upgrade-dialog summary: what a Pro subscription unlocks. */
export const PRO_UNLOCK_SUMMARY: string[] = [
  `${PRO_TOOL_COUNT} Pro instruments, including ${SIMULATOR_COUNT} simulators`,
  "World Bible PDF and Word, Markdown and Scrivener world exports",
  "Collaborator invites",
  "Every future instrument",
];
