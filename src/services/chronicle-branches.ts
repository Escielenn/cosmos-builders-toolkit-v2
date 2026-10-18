/**
 * Chronicle Branches Service
 *
 * Reads and writes alternate timelines (chronicle_branches) and time-travel
 * jumps (chronicle_jumps). Migration 20261018_chronicle_branches.sql adds
 * both tables plus chronicle_events.branch_id.
 *
 * Graceful degradation: until the migration lands, reads return
 * `available: false` with empty lists (the Chronicle shows the prime
 * timeline only) and writes throw BranchesOfflineError, which the UI maps
 * to "BRANCHES OFFLINE. MIGRATION PENDING."
 */

import { supabase } from "@/integrations/supabase/client";
import {
  isBranchHue,
  type BranchHue,
  type BranchRecord,
  type JumpRecord,
} from "@/lib/chronicle/branches";

export const BRANCHES_OFFLINE = "BRANCHES OFFLINE. MIGRATION PENDING.";

export class BranchesOfflineError extends Error {
  constructor() {
    super(BRANCHES_OFFLINE);
    this.name = "BranchesOfflineError";
  }
}

/**
 * True when a PostgREST / Postgres error means the table or column does not
 * exist yet: 42P01 undefined table, 42703 undefined column, PGRST204 column
 * not in schema cache, PGRST205 table not in schema cache.
 */
export function isSchemaMissingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code && ["42P01", "42703", "PGRST204", "PGRST205"].includes(e.code)) return true;
  const msg = (e.message ?? "").toLowerCase();
  return (
    (msg.includes("chronicle_branches") ||
      msg.includes("chronicle_jumps") ||
      msg.includes("branch_id")) &&
    (msg.includes("does not exist") || msg.includes("schema cache"))
  );
}

// ──────────────────────────────────────────────
// Read
// ──────────────────────────────────────────────

export interface ChronicleBranchData {
  /** False until the migration is applied. */
  available: boolean;
  branches: BranchRecord[];
  jumps: JumpRecord[];
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapBranch(r: Record<string, unknown>): BranchRecord {
  return {
    id: r.id as string,
    name: (r.name as string) || "",
    color: isBranchHue(r.color) ? r.color : "teal",
    parentBranchId: (r.parent_branch_id as string) || null,
    divergenceSortValue: num(r.divergence_sort_value),
    divergenceEventId: (r.divergence_event_id as string) || null,
    description: (r.description as string) || null,
    sortOrder: Number(r.sort_order) || 0,
  };
}

function mapJump(r: Record<string, unknown>): JumpRecord {
  return {
    id: r.id as string,
    travelerEntryId: (r.traveler_entry_id as string) || null,
    travelerLabel: (r.traveler_label as string) || "",
    fromBranchId: (r.from_branch_id as string) || null,
    fromSortValue: num(r.from_sort_value) ?? 0,
    toBranchId: (r.to_branch_id as string) || null,
    toSortValue: num(r.to_sort_value) ?? 0,
    properDuration: (r.proper_duration as string) || null,
    method: (r.method as string) || "",
    notes: (r.notes as string) || null,
  };
}

export async function getChronicleBranchData(worldId: string): Promise<ChronicleBranchData> {
  const [branchRes, jumpRes] = await Promise.all([
    supabase
      .from("chronicle_branches")
      .select("*")
      .eq("world_id", worldId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("chronicle_jumps")
      .select("*")
      .eq("world_id", worldId)
      .order("created_at", { ascending: true }),
  ]);

  if (branchRes.error) {
    if (isSchemaMissingError(branchRes.error)) {
      return { available: false, branches: [], jumps: [] };
    }
    throw branchRes.error;
  }
  if (jumpRes.error) {
    if (isSchemaMissingError(jumpRes.error)) {
      return { available: false, branches: [], jumps: [] };
    }
    throw jumpRes.error;
  }

  return {
    available: true,
    branches: (branchRes.data ?? []).map((r) => mapBranch(r as Record<string, unknown>)),
    jumps: (jumpRes.data ?? []).map((r) => mapJump(r as Record<string, unknown>)),
  };
}

// ──────────────────────────────────────────────
// Branch CRUD
// ──────────────────────────────────────────────

export interface BranchInput {
  name: string;
  color: BranchHue;
  parentBranchId: string | null;
  divergenceSortValue: number | null;
  divergenceEventId: string | null;
  description: string | null;
  sortOrder?: number;
}

function raise(error: unknown): never {
  if (isSchemaMissingError(error)) throw new BranchesOfflineError();
  throw error;
}

export async function createChronicleBranch(worldId: string, input: BranchInput) {
  const { data, error } = await supabase
    .from("chronicle_branches")
    .insert({
      world_id: worldId,
      name: input.name,
      color: input.color,
      parent_branch_id: input.parentBranchId,
      divergence_sort_value: input.divergenceSortValue,
      divergence_event_id: input.divergenceEventId,
      description: input.description,
      sort_order: input.sortOrder ?? 0,
    })
    .select()
    .single();
  if (error) raise(error);
  return mapBranch(data as Record<string, unknown>);
}

export async function updateChronicleBranch(branchId: string, input: BranchInput) {
  const { error } = await supabase
    .from("chronicle_branches")
    .update({
      name: input.name,
      color: input.color,
      parent_branch_id: input.parentBranchId,
      divergence_sort_value: input.divergenceSortValue,
      divergence_event_id: input.divergenceEventId,
      description: input.description,
      ...(input.sortOrder !== undefined ? { sort_order: input.sortOrder } : {}),
    })
    .eq("id", branchId);
  if (error) raise(error);
}

/** Events and jumps on the branch return to prime (ON DELETE SET NULL). */
export async function deleteChronicleBranch(branchId: string) {
  const { error } = await supabase.from("chronicle_branches").delete().eq("id", branchId);
  if (error) raise(error);
}

// ──────────────────────────────────────────────
// Jump CRUD
// ──────────────────────────────────────────────

export interface JumpInput {
  travelerEntryId: string | null;
  travelerLabel: string;
  fromBranchId: string | null;
  fromSortValue: number;
  toBranchId: string | null;
  toSortValue: number;
  properDuration: string | null;
  method: string;
  notes: string | null;
}

function jumpRow(input: JumpInput) {
  return {
    traveler_entry_id: input.travelerEntryId,
    traveler_label: input.travelerLabel,
    from_branch_id: input.fromBranchId,
    from_sort_value: input.fromSortValue,
    to_branch_id: input.toBranchId,
    to_sort_value: input.toSortValue,
    proper_duration: input.properDuration,
    method: input.method,
    notes: input.notes,
  };
}

export async function createChronicleJump(worldId: string, input: JumpInput) {
  const { data, error } = await supabase
    .from("chronicle_jumps")
    .insert({ world_id: worldId, ...jumpRow(input) })
    .select()
    .single();
  if (error) raise(error);
  return mapJump(data as Record<string, unknown>);
}

export async function updateChronicleJump(jumpId: string, input: JumpInput) {
  const { error } = await supabase.from("chronicle_jumps").update(jumpRow(input)).eq("id", jumpId);
  if (error) raise(error);
}

export async function deleteChronicleJump(jumpId: string) {
  const { error } = await supabase.from("chronicle_jumps").delete().eq("id", jumpId);
  if (error) raise(error);
}
