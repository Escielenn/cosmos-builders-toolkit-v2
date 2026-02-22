/**
 * World Snapshot Service
 *
 * Compiles, downloads, and imports complete world snapshots.
 * Uses the compile_world_snapshot RPC (SECURITY DEFINER) to gather
 * all world data server-side, then packages it for export/import.
 *
 * Snapshot format:
 * - JSON: Single .json file with the complete world object
 * - ZIP:  .zip containing world.json + any future binary assets
 *
 * Never includes user_id in exported data — safe for sharing.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface WorldSnapshotWorksheet {
  id: string;
  tool_type: string;
  title: string | null;
  tags: string[];
  data: Json;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorldSnapshotNote {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface WorldSnapshotConnection {
  id: string;
  source_worksheet_id: string | null;
  target_worksheet_id: string | null;
  source_entry_id: string | null;
  target_entry_id: string | null;
  connection_type: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorldSnapshotEntry {
  id: string;
  entry_type: string;
  title: string;
  content: string | null;
  metadata: Json;
  sort_order: number;
  parent_id: string | null;
  tool_source: string | null;
  tool_data_id: string | null;
  layer: string | null;
  cover_image_url: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorldSnapshotWorld {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  tags: string[];
  header_image_url: string | null;
  header_image_focus_y: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorldSnapshotChronicleEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  sort_value: number;
  end_date: string | null;
  end_sort_value: number | null;
  event_type: string;
  layer: string | null;
  parent_id: string | null;
  linked_entry_id: string | null;
  icon: string | null;
  color: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface WorldSnapshot {
  format_version: number;
  exported_at: string;
  version_number: number;
  world: WorldSnapshotWorld;
  worksheets: WorldSnapshotWorksheet[];
  notes: WorldSnapshotNote[];
  connections: WorldSnapshotConnection[];
  entries: WorldSnapshotEntry[];
  chronicle?: WorldSnapshotChronicleEvent[];
}

// ──────────────────────────────────────────────
// Compile snapshot via RPC
// ──────────────────────────────────────────────

export async function compileWorldSnapshot(
  worldId: string
): Promise<WorldSnapshot> {
  const { data, error } = await supabase.rpc("compile_world_snapshot", {
    p_world_id: worldId,
  });

  if (error) throw new Error(`Failed to compile snapshot: ${error.message}`);

  const snapshot = data as unknown as WorldSnapshot | { error: string };

  if ("error" in snapshot && typeof snapshot.error === "string") {
    throw new Error(snapshot.error);
  }

  return snapshot as WorldSnapshot;
}

// ──────────────────────────────────────────────
// Save version via RPC (compiles + saves atomically)
// ──────────────────────────────────────────────

export interface SaveSnapshotResult {
  success: boolean;
  version_id: string;
  version_number: number;
  snapshot: WorldSnapshot;
}

export async function saveWorldSnapshotRpc(
  worldId: string,
  label?: string
): Promise<SaveSnapshotResult> {
  const { data, error } = await supabase.rpc("save_world_snapshot", {
    p_world_id: worldId,
    p_label: label || null,
  });

  if (error) throw new Error(`Failed to save snapshot: ${error.message}`);

  const result = data as unknown as SaveSnapshotResult | { error: string };

  if ("error" in result && typeof result.error === "string") {
    throw new Error(result.error);
  }

  return result as SaveSnapshotResult;
}

// ──────────────────────────────────────────────
// Rate-limited auto-snapshot (fire-and-forget)
// ──────────────────────────────────────────────

export async function maybeSnapshotWorld(worldId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("maybe_snapshot_world", {
      p_world_id: worldId,
    });

    if (error) {
      console.warn("Auto-snapshot failed:", error.message);
      return false;
    }

    return data === true;
  } catch {
    // Non-blocking — never throw from auto-snapshots
    return false;
  }
}

// ──────────────────────────────────────────────
// Download as JSON
// ──────────────────────────────────────────────

export function downloadSnapshotAsJson(
  snapshot: WorldSnapshot,
  worldName: string
): void {
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, generateFilename(worldName, "json"));
}

// ──────────────────────────────────────────────
// Download as ZIP
// ──────────────────────────────────────────────

export async function downloadSnapshotAsZip(
  snapshot: WorldSnapshot,
  worldName: string
): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  // Main world data
  zip.file("world.json", JSON.stringify(snapshot, null, 2));

  // Individual worksheets for easy browsing
  const worksheetsFolder = zip.folder("worksheets");
  if (worksheetsFolder) {
    for (const ws of snapshot.worksheets) {
      const safeName = (ws.title || "untitled")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      worksheetsFolder.file(
        `${ws.tool_type}/${safeName}-${ws.id.slice(0, 8)}.json`,
        JSON.stringify(ws, null, 2)
      );
    }
  }

  // World notes
  if (snapshot.notes.length > 0) {
    const notesFolder = zip.folder("notes");
    if (notesFolder) {
      for (const note of snapshot.notes) {
        notesFolder.file(
          `note-${note.id.slice(0, 8)}.html`,
          note.content
        );
      }
    }
  }

  // Entries
  if (snapshot.entries.length > 0) {
    zip.file("entries.json", JSON.stringify(snapshot.entries, null, 2));
  }

  // Connections
  if (snapshot.connections.length > 0) {
    zip.file("connections.json", JSON.stringify(snapshot.connections, null, 2));
  }

  // README
  zip.file(
    "README.txt",
    [
      `STELLARFORGE WORLD EXPORT`,
      `========================`,
      ``,
      `World: ${snapshot.world.name}`,
      `Exported: ${new Date(snapshot.exported_at).toLocaleString()}`,
      `Version: ${snapshot.version_number}`,
      `Format: ${snapshot.format_version}`,
      ``,
      `Contents:`,
      `  world.json       — Complete world snapshot (machine-readable)`,
      `  worksheets/      — Individual worksheet files by tool type`,
      `  notes/           — World notes (HTML)`,
      `  entries.json     — World entries/journal`,
      `  connections.json — Cross-worksheet connections`,
      ``,
      `To import this world back into StellarForge, use the`,
      `"Import World" feature on the Worlds page.`,
      ``,
      `Generated by stellarforge.tools`,
    ].join("\n")
  );

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, generateFilename(worldName, "zip"));
}

// ──────────────────────────────────────────────
// Import from JSON
// ──────────────────────────────────────────────

export async function importWorldFromJson(
  file: File
): Promise<WorldSnapshot> {
  const text = await file.text();
  const data = JSON.parse(text);
  return validateSnapshot(data);
}

// ──────────────────────────────────────────────
// Import from ZIP
// ──────────────────────────────────────────────

export async function importWorldFromZip(
  file: File
): Promise<WorldSnapshot> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(file);

  const worldJsonFile = zip.file("world.json");
  if (!worldJsonFile) {
    throw new Error("Invalid archive: missing world.json");
  }

  const text = await worldJsonFile.async("text");
  const data = JSON.parse(text);
  return validateSnapshot(data);
}

// ──────────────────────────────────────────────
// Create world from snapshot (import into account)
// ──────────────────────────────────────────────

export async function createWorldFromSnapshot(
  snapshot: WorldSnapshot
): Promise<string> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Not authenticated");

  // 1. Create the world (new ID, current user as owner)
  const { data: newWorld, error: worldError } = await supabase
    .from("worlds")
    .insert({
      user_id: userId,
      name: `${snapshot.world.name} (imported)`,
      description: snapshot.world.description,
      icon: snapshot.world.icon,
      tags: snapshot.world.tags,
      // Skip header_image_url — images are user-specific storage
    })
    .select("id")
    .single();

  if (worldError) throw new Error(`Failed to create world: ${worldError.message}`);

  const newWorldId = newWorld.id;

  // 2. Build old ID → new ID mapping for worksheets (needed for connections)
  const worksheetIdMap = new Map<string, string>();

  // 3. Import worksheets
  for (const ws of snapshot.worksheets) {
    const { data: newWs, error: wsError } = await supabase
      .from("worksheets")
      .insert({
        world_id: newWorldId,
        user_id: userId,
        tool_type: ws.tool_type,
        title: ws.title,
        tags: ws.tags,
        data: ws.data,
        archived_at: ws.archived_at,
      })
      .select("id")
      .single();

    if (wsError) {
      console.error(`Failed to import worksheet "${ws.title}":`, wsError);
      continue;
    }

    worksheetIdMap.set(ws.id, newWs.id);
  }

  // 4. Import world notes
  for (const note of snapshot.notes) {
    const { error: noteError } = await supabase.from("world_notes").insert({
      world_id: newWorldId,
      user_id: userId,
      content: note.content,
    });

    if (noteError) {
      console.error("Failed to import world note:", noteError);
    }
  }

  // 5. Import connections (remap worksheet IDs; entry-based connections skipped)
  for (const conn of snapshot.connections) {
    const newSourceWs = conn.source_worksheet_id ? worksheetIdMap.get(conn.source_worksheet_id) : null;
    const newTargetWs = conn.target_worksheet_id ? worksheetIdMap.get(conn.target_worksheet_id) : null;

    // Skip worksheet-based connections where the referenced worksheet wasn't imported
    if (conn.source_worksheet_id && !newSourceWs) continue;
    if (conn.target_worksheet_id && !newTargetWs) continue;

    // Entry-based connections are not remapped during import (entry IDs change)
    if (!newSourceWs && !newTargetWs) continue;

    const { error: connError } = await supabase
      .from("world_connections")
      .insert({
        world_id: newWorldId,
        source_worksheet_id: newSourceWs || null,
        target_worksheet_id: newTargetWs || null,
        connection_type: conn.connection_type,
        description: conn.description,
        created_by: userId,
      });

    if (connError) {
      console.error("Failed to import connection:", connError);
    }
  }

  // 6. Import entries
  for (const entry of snapshot.entries) {
    const { error: entryError } = await supabase
      .from("world_entries")
      .insert({
        world_id: newWorldId,
        entry_type: entry.entry_type as "note" | "milestone" | "decision" | "reference" | "lore",
        title: entry.title,
        content: entry.content,
        metadata: entry.metadata,
        sort_order: entry.sort_order,
        created_by: userId,
      });

    if (entryError) {
      console.error(`Failed to import entry "${entry.title}":`, entryError);
    }
  }

  // 7. Import chronicle events
  if (snapshot.chronicle && snapshot.chronicle.length > 0) {
    for (const ce of snapshot.chronicle) {
      const { error: ceError } = await supabase
        .from("chronicle_events")
        .insert({
          world_id: newWorldId,
          title: ce.title,
          description: ce.description,
          event_date: ce.event_date,
          sort_value: ce.sort_value,
          end_date: ce.end_date,
          end_sort_value: ce.end_sort_value,
          event_type: ce.event_type,
          layer: ce.layer,
          // parent_id and linked_entry_id are not remapped for simplicity
          icon: ce.icon,
          color: ce.color,
          tags: ce.tags,
        });

      if (ceError) {
        console.error(`Failed to import chronicle event "${ce.title}":`, ceError);
      }
    }
  }

  return newWorldId;
}

// ──────────────────────────────────────────────
// Fetch version history
// ──────────────────────────────────────────────

export interface WorldVersionSummary {
  id: string;
  version_number: number;
  label: string | null;
  created_at: string;
  created_by: string;
}

export async function fetchWorldVersions(
  worldId: string
): Promise<WorldVersionSummary[]> {
  const { data, error } = await supabase
    .from("world_versions")
    .select("id, version_number, label, created_at, created_by")
    .eq("world_id", worldId)
    .order("version_number", { ascending: false });

  if (error) throw new Error(`Failed to fetch versions: ${error.message}`);
  return data as WorldVersionSummary[];
}

export async function fetchVersionSnapshot(
  versionId: string
): Promise<WorldSnapshot> {
  const { data, error } = await supabase
    .from("world_versions")
    .select("snapshot_data")
    .eq("id", versionId)
    .single();

  if (error) throw new Error(`Failed to fetch version: ${error.message}`);
  return data.snapshot_data as unknown as WorldSnapshot;
}

// ──────────────────────────────────────────────
// Restore world from a version
// Always saves the current state first.
// ──────────────────────────────────────────────

export async function restoreWorldVersion(
  worldId: string,
  versionId: string
): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Not authenticated");

  // 1. Save current state as "pre-restore" snapshot
  await saveWorldSnapshotRpc(worldId, "Pre-restore backup");

  // 2. Fetch the target version's snapshot
  const snapshot = await fetchVersionSnapshot(versionId);

  // 3. Delete all current child data (order matters for FK constraints)
  // Chronicle events first (FK to world_entries)
  const { error: ceErr } = await supabase
    .from("chronicle_events")
    .delete()
    .eq("world_id", worldId);
  if (ceErr) throw new Error(`Failed to clear chronicle: ${ceErr.message}`);

  const { error: connErr } = await supabase
    .from("world_connections")
    .delete()
    .eq("world_id", worldId);
  if (connErr) throw new Error(`Failed to clear connections: ${connErr.message}`);

  const { error: entryErr } = await supabase
    .from("world_entries")
    .delete()
    .eq("world_id", worldId);
  if (entryErr) throw new Error(`Failed to clear entries: ${entryErr.message}`);

  const { error: noteErr } = await supabase
    .from("world_notes")
    .delete()
    .eq("world_id", worldId);
  if (noteErr) throw new Error(`Failed to clear notes: ${noteErr.message}`);

  const { error: wsErr } = await supabase
    .from("worksheets")
    .delete()
    .eq("world_id", worldId);
  if (wsErr) throw new Error(`Failed to clear worksheets: ${wsErr.message}`);

  // 4. Update world metadata from snapshot
  const { error: worldErr } = await supabase
    .from("worlds")
    .update({
      name: snapshot.world.name,
      description: snapshot.world.description,
      icon: snapshot.world.icon,
      tags: snapshot.world.tags,
    })
    .eq("id", worldId);
  if (worldErr) throw new Error(`Failed to update world: ${worldErr.message}`);

  // 5. Re-import worksheets with ID mapping for connections
  const worksheetIdMap = new Map<string, string>();

  for (const ws of snapshot.worksheets) {
    const { data: newWs, error: wsInsertErr } = await supabase
      .from("worksheets")
      .insert({
        world_id: worldId,
        user_id: userId,
        tool_type: ws.tool_type,
        title: ws.title,
        tags: ws.tags,
        data: ws.data,
        archived_at: ws.archived_at,
      })
      .select("id")
      .single();

    if (wsInsertErr) {
      console.error(`Failed to restore worksheet "${ws.title}":`, wsInsertErr);
      continue;
    }
    worksheetIdMap.set(ws.id, newWs.id);
  }

  // 6. Re-import notes
  for (const note of snapshot.notes) {
    const { error: noteInsertErr } = await supabase
      .from("world_notes")
      .insert({
        world_id: worldId,
        user_id: userId,
        content: note.content,
      });
    if (noteInsertErr) console.error("Failed to restore note:", noteInsertErr);
  }

  // 7. Re-import connections (remap IDs)
  for (const conn of snapshot.connections) {
    const newSourceWs = conn.source_worksheet_id ? worksheetIdMap.get(conn.source_worksheet_id) : null;
    const newTargetWs = conn.target_worksheet_id ? worksheetIdMap.get(conn.target_worksheet_id) : null;
    if (conn.source_worksheet_id && !newSourceWs) continue;
    if (conn.target_worksheet_id && !newTargetWs) continue;
    if (!newSourceWs && !newTargetWs) continue;

    const { error: connInsertErr } = await supabase
      .from("world_connections")
      .insert({
        world_id: worldId,
        source_worksheet_id: newSourceWs || null,
        target_worksheet_id: newTargetWs || null,
        connection_type: conn.connection_type,
        description: conn.description,
        created_by: userId,
      });
    if (connInsertErr) console.error("Failed to restore connection:", connInsertErr);
  }

  // 8. Re-import entries
  for (const entry of snapshot.entries) {
    const { error: entryInsertErr } = await supabase
      .from("world_entries")
      .insert({
        world_id: worldId,
        entry_type: entry.entry_type as "note" | "milestone" | "decision" | "reference" | "lore",
        title: entry.title,
        content: entry.content,
        metadata: entry.metadata,
        sort_order: entry.sort_order,
        created_by: userId,
      });
    if (entryInsertErr) console.error(`Failed to restore entry "${entry.title}":`, entryInsertErr);
  }

  // 9. Re-import chronicle events
  if (snapshot.chronicle && snapshot.chronicle.length > 0) {
    for (const ce of snapshot.chronicle) {
      const { error: ceInsertErr } = await supabase
        .from("chronicle_events")
        .insert({
          world_id: worldId,
          title: ce.title,
          description: ce.description,
          event_date: ce.event_date,
          sort_value: ce.sort_value,
          end_date: ce.end_date,
          end_sort_value: ce.end_sort_value,
          event_type: ce.event_type,
          layer: ce.layer,
          icon: ce.icon,
          color: ce.color,
          tags: ce.tags,
        });
      if (ceInsertErr) console.error(`Failed to restore chronicle event "${ce.title}":`, ceInsertErr);
    }
  }
}

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────

function validateSnapshot(data: unknown): WorldSnapshot {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid snapshot: not an object");
  }

  const obj = data as Record<string, unknown>;

  if (!obj.format_version || typeof obj.format_version !== "number") {
    throw new Error("Invalid snapshot: missing or invalid format_version");
  }

  if (!obj.world || typeof obj.world !== "object") {
    throw new Error("Invalid snapshot: missing world data");
  }

  const world = obj.world as Record<string, unknown>;
  if (!world.name || typeof world.name !== "string") {
    throw new Error("Invalid snapshot: world must have a name");
  }

  if (!Array.isArray(obj.worksheets)) {
    throw new Error("Invalid snapshot: worksheets must be an array");
  }

  // Ensure arrays exist even if empty
  return {
    format_version: obj.format_version as number,
    exported_at: (obj.exported_at as string) || new Date().toISOString(),
    version_number: (obj.version_number as number) || 1,
    world: obj.world as WorldSnapshotWorld,
    worksheets: obj.worksheets as WorldSnapshotWorksheet[],
    notes: Array.isArray(obj.notes) ? (obj.notes as WorldSnapshotNote[]) : [],
    connections: Array.isArray(obj.connections)
      ? (obj.connections as WorldSnapshotConnection[])
      : [],
    entries: Array.isArray(obj.entries)
      ? (obj.entries as WorldSnapshotEntry[])
      : [],
    chronicle: Array.isArray(obj.chronicle)
      ? (obj.chronicle as WorldSnapshotChronicleEvent[])
      : [],
  };
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function generateFilename(worldName: string, ext: string): string {
  const slug = worldName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().split("T")[0];
  return `${slug}-snapshot-${date}.${ext}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
