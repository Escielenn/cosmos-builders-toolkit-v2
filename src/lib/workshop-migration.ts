// ---------------------------------------------------------------------------
// workshop-migration.ts, the mapping from the retired /workshop store
// (writing_entries) into Studio documents (world_entries).
//
// This is the specification that supabase/migrations/
// 20261019_workshop_into_studio.sql implements in SQL. The SQL is what runs;
// this module states the same rules in a form the test suite can pin, so a
// change to one without the other shows up as a failing test review.
//
// Rules
//  1. Archived entries (archived_at set) are not copied. They stay readable
//     in writing_entries, which is never deleted and becomes read-only.
//  2. An entry already copied (a document whose metadata.workshop.entryId is
//     the entry's id exists) is skipped. Running twice copies nothing twice.
//  3. Target world: the entry's own world when it exists, belongs to the same
//     user and is not archived. Otherwise the user's Workshop world (one per
//     user, created on demand, marked settings.workshop = true).
//  4. In the target world the entry lands in a root folder titled "Workshop"
//     (marked metadata.workshopFolder = true), reused when present.
//  5. Title falls back to "Untitled entry". Content is copied verbatim when it
//     is already HTML; plain text is escaped and wrapped in paragraphs (the
//     Studio editor reads HTML). Words are never altered beyond that.
//  6. created_at and updated_at are preserved. Tags are copied.
//  7. Order inside the folder: oldest first (created_at, then id), sort_order
//     in steps of 10 after any children the folder already has.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

export const WORKSHOP_FOLDER_TITLE = "Workshop";
export const WORKSHOP_WORLD_NAME = "Workshop";
export const UNTITLED_ENTRY = "Untitled entry";

export interface LegacyEntry {
  id: string;
  user_id: string;
  world_id: string | null;
  prompt_id: string | null;
  title: string | null;
  content: string | null;
  tags: string[] | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorldRef {
  id: string;
  user_id: string;
  archived_at: string | null;
}

/** Where a copied entry goes. `workshop` means the user's Workshop world. */
export type TargetWorld = { kind: "world"; worldId: string } | { kind: "workshop"; userId: string };

export interface PlannedDocument {
  entryId: string;
  userId: string;
  target: TargetWorld;
  title: string;
  content: string;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
  metadata: {
    workshop: { entryId: string; promptId: string | null; migratedFrom: "writing_entries" };
  };
}

export interface MigrationPlan {
  documents: PlannedDocument[];
  /** Users who need a Workshop world (created if they have none). */
  workshopWorldUsers: string[];
  skippedArchived: number;
  skippedAlreadyCopied: number;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Rule 5: HTML passes through; plain text becomes escaped paragraphs. */
export function toStudioHtml(content: string | null): string {
  const text = content ?? "";
  if (text.trim() === "") return "";
  if (/^\s*</.test(text)) return text;
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function targetKey(t: TargetWorld): string {
  return t.kind === "world" ? `w:${t.worldId}` : `u:${t.userId}`;
}

export function planWorkshopMigration(
  entries: LegacyEntry[],
  worlds: WorldRef[],
  opts: {
    /** Entry ids already copied (rule 2). */
    alreadyCopied?: ReadonlySet<string>;
    /**
     * Highest sort_order among existing children of each target's Workshop
     * folder, keyed `w:<worldId>` or `u:<userId>`. Absent = empty folder.
     */
    folderMaxSort?: ReadonlyMap<string, number>;
  } = {},
): MigrationPlan {
  const worldById = new Map(worlds.map((w) => [w.id, w]));
  const copied = opts.alreadyCopied ?? new Set<string>();
  let skippedArchived = 0;
  let skippedAlreadyCopied = 0;

  const live: { entry: LegacyEntry; target: TargetWorld }[] = [];
  for (const e of entries) {
    if (e.archived_at) {
      skippedArchived++;
      continue;
    }
    if (copied.has(e.id)) {
      skippedAlreadyCopied++;
      continue;
    }
    const w = e.world_id ? worldById.get(e.world_id) : undefined;
    const target: TargetWorld =
      w && w.user_id === e.user_id && !w.archived_at
        ? { kind: "world", worldId: w.id }
        : { kind: "workshop", userId: e.user_id };
    live.push({ entry: e, target });
  }

  // Rule 7: oldest first within each target folder.
  live.sort((a, b) =>
    a.entry.created_at === b.entry.created_at
      ? a.entry.id.localeCompare(b.entry.id)
      : a.entry.created_at < b.entry.created_at
        ? -1
        : 1,
  );
  const position = new Map<string, number>();
  const documents: PlannedDocument[] = live.map(({ entry, target }) => {
    const key = targetKey(target);
    const n = (position.get(key) ?? 0) + 1;
    position.set(key, n);
    const base = opts.folderMaxSort?.has(key) ? opts.folderMaxSort.get(key)! : -10;
    return {
      entryId: entry.id,
      userId: entry.user_id,
      target,
      title: (entry.title ?? "").trim() || UNTITLED_ENTRY,
      content: toStudioHtml(entry.content),
      tags: entry.tags ?? [],
      sort_order: base + n * 10,
      created_at: entry.created_at,
      updated_at: entry.updated_at,
      metadata: {
        workshop: { entryId: entry.id, promptId: entry.prompt_id, migratedFrom: "writing_entries" },
      },
    };
  });

  const workshopWorldUsers = Array.from(
    new Set(documents.filter((d) => d.target.kind === "workshop").map((d) => d.userId)),
  ).sort();

  return { documents, workshopWorldUsers, skippedArchived, skippedAlreadyCopied };
}
