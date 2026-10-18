/**
 * tool-worksheet — the pure half of useToolWorksheet.
 *
 * Every tool page used to carry its own copy of save / create / rename /
 * tags / local-draft code, and the copies disagreed: Goldilocks refused to
 * save without a worksheet, K-Scale did nothing when signed out, the rest
 * fell back to a browser draft. The rules now live here, once.
 *
 * Nothing in this module touches React or Supabase, so it is unit-tested
 * directly (src/lib/__tests__/tool-worksheet.test.ts).
 */

import type { Json } from "@/integrations/supabase/types";
import { isStandaloneSave, writeStandaloneBackup, type BackupContext } from "@/lib/standalone-backup";

/**
 * How one tool's form becomes a worksheet row and back. `hydrate` must accept
 * every shape the tool has ever saved: existing worksheets open unchanged.
 */
export interface ToolWorksheetCodec<S> {
  /** A fresh sheet. Also the data a sheet is created with from the selector. */
  defaults: S;
  /** Saved row data (or a browser draft) to form state. */
  hydrate: (data: unknown, defaults: S) => S;
  /** Form state to the row's `data` column. */
  serialize: (state: S) => Json;
}

/** The common codec: the row's data IS the form state. */
export function castCodec<S>(defaults: S): ToolWorksheetCodec<S> {
  return {
    defaults,
    hydrate: (data) => data as S,
    serialize: (state) => state as unknown as Json,
  };
}

/**
 * Rows store the form as-is, but older rows may lack top-level keys added
 * since: they open with the defaults for those keys (a shallow merge).
 */
export function mergeCodec<S extends object>(defaults: S): ToolWorksheetCodec<S> {
  return {
    defaults,
    hydrate: (data, d) => ({ ...d, ...((data ?? {}) as Partial<S>) }),
    serialize: (state) => state as unknown as Json,
  };
}

/** Shown when a save can only reach this browser. */
export const LOCAL_MODE_NOTICE = "LOCAL MODE. SIGN IN TO FILE THIS WORKSHEET.";

/** Marker beside a draft written while signed out, so it can be filed on sign-in. */
export function unfiledKey(localKey: string): string {
  return `${localKey}:unfiled`;
}

type ReadStore = Pick<Storage, "getItem">;
type WriteStore = Pick<Storage, "setItem" | "removeItem">;

function safeStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Read and parse a browser draft. Blocked or corrupt storage reads as none. */
export function readDraft(localKey: string, storage: ReadStore | null = safeStorage()): unknown | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(localKey);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export type DraftWrite = "written" | "skipped" | "failed";

/**
 * Write the browser draft, in standalone mode only (lib/standalone-backup).
 * A draft written signed out is marked unfiled. Never throws.
 */
export function writeDraft(
  localKey: string,
  data: unknown,
  ctx: BackupContext,
  storage: (Pick<Storage, "setItem"> & Partial<WriteStore>) | null = safeStorage(),
): DraftWrite {
  if (!storage) return isStandaloneSave(ctx) ? "failed" : "skipped";
  try {
    const wrote = writeStandaloneBackup(localKey, data, ctx, storage);
    if (wrote && !ctx.signedIn) storage.setItem(unfiledKey(localKey), "1");
    return wrote ? "written" : "skipped";
  } catch {
    return "failed";
  }
}

/** True when a signed-out draft is waiting to be filed to a world. */
export function hasUnfiledDraft(localKey: string, storage: ReadStore | null = safeStorage()): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(unfiledKey(localKey)) === "1";
  } catch {
    return false;
  }
}

/** Clear the unfiled marker once the draft is on file. The draft itself is kept. */
export function clearUnfiled(localKey: string, storage: Partial<WriteStore> | null = safeStorage()): void {
  try {
    storage?.removeItem?.(unfiledKey(localKey));
  } catch {
    // Storage blocked: the marker stays, and the next sign-in offers it again.
  }
}

export interface LoadContext {
  worldId: string | null;
  worksheetId: string | null;
  signedIn: boolean;
  authLoading: boolean;
}

/**
 * Whether the page should open on the browser draft: no worksheet asked for,
 * and the page is in standalone mode (no world, or no one to save it to).
 */
export function shouldLoadDraft({ worldId, worksheetId, signedIn, authLoading }: LoadContext): boolean {
  if (worksheetId || authLoading) return false;
  return isStandaloneSave({ worldId, signedIn });
}

/**
 * Whether a signed-out draft should be filed now: signed in, a world bound,
 * no worksheet open yet, and a draft marked unfiled.
 */
export function shouldMigrateDraft(
  ctx: { worldId: string | null; worksheetId: string | null; signedIn: boolean },
  unfiled: boolean,
): boolean {
  return unfiled && ctx.signedIn && !!ctx.worldId && !ctx.worksheetId;
}

export type SaveRoute = "update" | "create" | "local";

/** Where an explicit save goes. Signed in with a world: the cloud, creating the sheet on first save. */
export function saveRoute(ctx: { worldId: string | null; signedIn: boolean; worksheetId: string | null }): SaveRoute {
  if (!ctx.worldId || !ctx.signedIn) return "local";
  return ctx.worksheetId ? "update" : "create";
}

/** Stable comparison key for dirty tracking. */
export function stateKey(state: unknown): string {
  try {
    return JSON.stringify(state) ?? "";
  } catch {
    return "";
  }
}

/** Search params with the world and sheet set, keeping every other param (entityId, tab...). */
export function withWorksheetParams(
  current: URLSearchParams,
  worldId: string | null,
  worksheetId: string,
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (worldId) next.set("worldId", worldId);
  next.set("worksheetId", worksheetId);
  return next;
}
