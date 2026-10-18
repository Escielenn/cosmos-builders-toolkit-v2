// ---------------------------------------------------------------------------
// folder-trash.ts, the plan for deleting a binder folder.
//
// Deleting a folder used to hard-delete the folder row after lifting its
// children up a level. The lifted children kept their own sort_order values,
// which collided with the siblings already at that level, and nothing was
// recoverable. Now a folder delete is a Trash move like a document delete:
//
//   - the folder and everything inside it, at any depth, get trashed_at
//   - every document inside is snapshotted first (reason 'trash'), so the
//     words survive even a later purge
//   - every trashed row INSIDE the folder is detached (parent_id -> null) and
//     remembers its old parent in metadata.trashedFromParentId. Detaching
//     matters: world_entries.parent_id is ON DELETE CASCADE, so when the 90-day
//     purge deletes the trashed folder, a document the writer had restored
//     from the Trash in the meantime would otherwise be deleted with it.
//     A restored document therefore lands at the binder root.
//   - the folder's remaining siblings are renumbered 0, 10, 20... in their
//     on-screen order, closing the gap and clearing any legacy collisions.
//
// Pure: no React, no network.
// ---------------------------------------------------------------------------

import { descendantIds, effectiveParents, orderSiblings, type BinderEntry } from "@/lib/binder-tree";

export interface FolderTrashPlan {
  /** The folder itself. Keeps its parent_id; nothing will point at it. */
  folderId: string;
  /** Rows inside the folder (any depth) to trash and detach, with their old parent. */
  inside: { id: string; formerParentId: string | null; isFolder: boolean }[];
  /** Documents to snapshot before anything is trashed. */
  documentIds: string[];
  /** The folder's surviving siblings, in order; persist sort_order = index * 10. */
  siblingOrder: string[];
}

export function planFolderTrash<T extends BinderEntry>(entries: T[], folderId: string): FolderTrashPlan | null {
  const folder = entries.find((e) => e.id === folderId);
  if (!folder || folder.entry_type !== "folder") return null;

  const parent = effectiveParents(entries);
  const insideIds = descendantIds(entries, folderId);
  // Deterministic order: binder order is not needed for a trash, id order is
  // stable and testable.
  const inside = entries
    .filter((e) => insideIds.has(e.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((e) => ({
      id: e.id,
      formerParentId: parent.get(e.id) ?? null,
      isFolder: e.entry_type === "folder",
    }));

  const folderParent = parent.get(folderId) ?? null;
  // Order WITH the folder present, then drop it: the legacy folders-first
  // layout is detected from the whole group, and removing the folder first
  // could flip it and reshuffle what the writer sees.
  const siblingOrder = orderSiblings(
    entries.filter((e) => (parent.get(e.id) ?? null) === folderParent),
  )
    .map((e) => e.id)
    .filter((id) => id !== folderId);

  return {
    folderId,
    inside,
    documentIds: inside.filter((r) => !r.isFolder).map((r) => r.id),
    siblingOrder,
  };
}
