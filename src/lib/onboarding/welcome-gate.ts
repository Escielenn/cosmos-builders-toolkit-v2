// ---------------------------------------------------------------------------
// welcome-gate, when the signup WelcomeDialog shows.
//
// It used to show only within five minutes of account creation, which missed
// everyone who signed up, closed the tab, and came back the next day to an
// empty index. The rule now: a signed-in writer with zero worlds (archived
// included) who has not dismissed it. Profiles carry no settings column, so
// dismissal is per-user in localStorage; every access is guarded, because
// storage can throw (private windows, blocked site data).
// ---------------------------------------------------------------------------

const DISMISS_PREFIX = "sf-welcome-dismissed:";

export interface WelcomeGateInput {
  userId: string | null | undefined;
  /** False while the worlds query is still loading. */
  worldsLoaded: boolean;
  /** Active plus archived worlds. */
  worldCount: number;
  dismissed: boolean;
}

export function shouldShowWelcome({ userId, worldsLoaded, worldCount, dismissed }: WelcomeGateInput): boolean {
  return !!userId && worldsLoaded && worldCount === 0 && !dismissed;
}

export function welcomeDismissKey(userId: string): string {
  return `${DISMISS_PREFIX}${userId}`;
}

export function isWelcomeDismissed(userId: string | null | undefined, storage?: Storage | null): boolean {
  if (!userId) return false;
  try {
    const s = storage === undefined ? globalThis.localStorage : storage;
    return !!s?.getItem(welcomeDismissKey(userId));
  } catch {
    return false;
  }
}

export function dismissWelcome(userId: string | null | undefined, storage?: Storage | null): void {
  if (!userId) return;
  try {
    const s = storage === undefined ? globalThis.localStorage : storage;
    s?.setItem(welcomeDismissKey(userId), new Date().toISOString());
  } catch {
    /* storage unavailable: the dialog may show again next visit */
  }
}
