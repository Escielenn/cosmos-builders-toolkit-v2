/**
 * standalone-backup — the one rule for a tool page's localStorage backup.
 *
 * Every tool page keeps its form in a single fixed localStorage key per tool
 * (not per world). Writing that key while a world is open meant one world's
 * worksheet reloaded the next time the tool opened in standalone mode, and
 * world data lingered in the browser on shared machines.
 *
 * The backup is now written only in standalone mode: no world open, or no
 * signed-in user to save the world to (in which case the browser copy is the
 * only save there is, so it is kept). When a world is open and the user is
 * signed in, the world's cloud save is the record and nothing is written
 * here. Existing standalone backups are never deleted by this module.
 */

export interface BackupContext {
  worldId?: string | null;
  signedIn: boolean;
}

/** True when the page saves only to the browser (no cloud world save). */
export function isStandaloneSave({ worldId, signedIn }: BackupContext): boolean {
  return !(worldId && signedIn);
}

/**
 * Write `data` to the tool's localStorage backup key, in standalone mode
 * only. Returns whether a write happened. Storage errors propagate as they
 * did when pages called localStorage.setItem directly.
 */
export function writeStandaloneBackup(
  key: string,
  data: unknown,
  ctx: BackupContext,
  storage: Pick<Storage, "setItem"> = localStorage
): boolean {
  if (!isStandaloneSave(ctx)) return false;
  storage.setItem(key, JSON.stringify(data));
  return true;
}
