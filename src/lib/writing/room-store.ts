// ---------------------------------------------------------------------------
// room-store, the writing room's tools as one small store.
//
// The Manuscript mounts the tools in three places (the bar, the phone menu,
// the status bar) and some of those unmount while their tool is still at
// work: the phone menu closes, focus mode hides the bar. So nothing
// long-lived sits in a component. The focus timer, the assistant's state,
// the loaded playlist and which panel is open all live here; components
// subscribe.
//
// Also the only place that owns timers and per-device storage for the room.
// No world data: that goes through the canon layer and the world hooks.
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import type { Editor } from "@tiptap/react";
import { localDay } from "@/lib/local-day";
import {
  formatClock,
  initialTimer,
  recordFocus,
  sanitizeFocusLog,
  timerReducer,
  type FocusLog,
  type TimerAction,
  type TimerState,
} from "@/lib/writing/timer";
import {
  parsePlaylistLink,
  rememberPlaylist,
  sanitizeSavedPlaylists,
  type PlaylistLink,
  type SavedPlaylist,
} from "@/lib/writing/music";
import type { ProofIssue } from "@/lib/writing/assistant/proofread-plugin";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type RoomPanelId = "assistant" | "targets" | "music";
export type AssistantTab = "review" | "world" | "lexicon";
export type AssistantPhase = "off" | "loading" | "ready" | "checking" | "failed";

export interface AssistantSettings {
  enabled: boolean;
  /** harper.js Dialect (0 = American). */
  dialect: number;
  /** Check the active paragraph after a pause. */
  auto: boolean;
}

export interface AssistantState {
  settings: AssistantSettings;
  phase: AssistantPhase;
  issues: ProofIssue[];
  /** One Ship's Voice line about the last check. */
  note: string;
  /** The issue to bring into view in the review list. */
  picked: string | null;
}

export interface LoadedPlaylist extends PlaylistLink {
  name: string;
}

export interface MusicState {
  current: LoadedPlaylist | null;
  /** The embedded player is loaded but tucked away. */
  minimized: boolean;
  saved: SavedPlaylist[];
}

export interface RoomState {
  panel: RoomPanelId | null;
  /** Where the open panel hangs from (px from the top), set by the opener. */
  anchorTop: number | null;
  tab: AssistantTab;
  assistant: AssistantState;
  timer: TimerState;
  focusLog: FocusLog;
  music: MusicState;
  /** Mounted host slots, best first. The first one renders the panels. */
  hosts: Array<{ id: string; rank: number }>;
  /** TargetsStatus is mounted, so the Targets panel has somewhere to live. */
  targetsHosted: boolean;
  worldId: string | null;
  documentId: string | null;
}

// ---------------------------------------------------------------------------
// Per-device storage
// ---------------------------------------------------------------------------

const LS_ASSISTANT = "sf-writing-assistant:v1";
const LS_FOCUS = "sf-focus-time:v1";
const LS_PLAYLISTS = "sf-writing-playlists:v1";
const SS_TIMER = "sf-focus-session:v1";

function read(storage: "local" | "session", key: string): unknown {
  try {
    const s = storage === "local" ? localStorage : sessionStorage;
    const raw = s.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function write(storage: "local" | "session", key: string, value: unknown): void {
  try {
    const s = storage === "local" ? localStorage : sessionStorage;
    s.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full: the room still works for this visit */
  }
}

export function sanitizeAssistantSettings(raw: unknown): AssistantSettings {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const dialect = Number(r.dialect);
  return {
    enabled: r.enabled === true,
    dialect: Number.isInteger(dialect) && dialect >= 0 && dialect <= 4 ? dialect : 0,
    auto: r.auto !== false,
  };
}

function hydrateTimer(): { timer: TimerState; focusLog: FocusLog } {
  const day = localDay();
  const focusLog = sanitizeFocusLog(read("local", LS_FOCUS));
  const session = read("session", SS_TIMER) as { ms?: unknown } | undefined;
  const sessionMs = Number(session?.ms);
  const visible = typeof document === "undefined" ? true : document.visibilityState !== "hidden";
  const timer = timerReducer(initialTimer(day, visible), {
    type: "hydrate",
    sessionMs: Number.isFinite(sessionMs) ? sessionMs : 0,
    day,
    dayMs: (focusLog[day] ?? 0) * 1000,
  });
  return { timer, focusLog };
}

function initialState(): RoomState {
  return {
    panel: null,
    anchorTop: null,
    tab: "review",
    assistant: {
      settings: sanitizeAssistantSettings(read("local", LS_ASSISTANT)),
      phase: "off",
      issues: [],
      note: "",
      picked: null,
    },
    ...hydrateTimer(),
    music: { current: null, minimized: false, saved: sanitizeSavedPlaylists(read("local", LS_PLAYLISTS)) },
    hosts: [],
    targetsHosted: false,
    worldId: null,
    documentId: null,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

let state: RoomState = initialState();
const listeners = new Set<() => void>();

export function getRoom(): RoomState {
  return state;
}

function set(patch: Partial<RoomState> | ((s: RoomState) => Partial<RoomState>)): void {
  const p = typeof patch === "function" ? patch(state) : patch;
  let changed = false;
  for (const k of Object.keys(p) as Array<keyof RoomState>) {
    if (!Object.is(state[k], p[k])) changed = true;
  }
  if (!changed) return;
  state = { ...state, ...p };
  for (const l of [...listeners]) l();
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Subscribe to one slice. The selector must return a stored reference or a primitive. */
export function useRoom<T>(selector: (s: RoomState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

// ---------------------------------------------------------------------------
// Panels
// ---------------------------------------------------------------------------

export function openPanel(panel: RoomPanelId, opts: { anchor?: Element | null; tab?: AssistantTab } = {}): void {
  const rect = opts.anchor?.getBoundingClientRect();
  set((s) => ({
    panel,
    anchorTop: rect && rect.height > 0 ? Math.round(rect.bottom + 8) : s.anchorTop,
    tab: opts.tab ?? s.tab,
  }));
}

export function closePanel(): void {
  set({ panel: null });
}

export function togglePanel(panel: RoomPanelId, anchor?: Element | null): void {
  if (state.panel === panel) closePanel();
  else openPanel(panel, { anchor });
}

export function setAssistantTab(tab: AssistantTab): void {
  set({ tab });
}

// ---------------------------------------------------------------------------
// Hosts: one mounted slot renders the panels and runs the assistant
// ---------------------------------------------------------------------------

export function registerHost(id: string, rank: number): () => void {
  set((s) => ({ hosts: [...s.hosts.filter((h) => h.id !== id), { id, rank }].sort((a, b) => a.rank - b.rank) }));
  return () => {
    set((s) => ({ hosts: s.hosts.filter((h) => h.id !== id) }));
    // The Manuscript is gone: nothing may keep running behind the writer.
    // Checked a moment later, so a remount (a layout change, not a
    // departure) does not stop the timer or the music.
    setTimeout(() => {
      if (state.hosts.length === 0) leaveRoom();
    }, 0);
  };
}

export function setRoomContext(worldId: string | null, documentId: string | null): void {
  set({ worldId, documentId });
}

export function setTargetsHosted(hosted: boolean): void {
  set({ targetsHosted: hosted });
}

let editorGetter: (() => Editor | null) | null = null;

/** The Manuscript's own accessor for the open document's editor. */
export function setEditorGetter(get: (() => Editor | null) | null): void {
  editorGetter = get;
}

export function roomEditor(): Editor | null {
  try {
    const ed = editorGetter?.() ?? null;
    return ed && !ed.isDestroyed ? ed : null;
  } catch {
    return null;
  }
}

function leaveRoom(): void {
  pauseTimer();
  editorGetter = null;
  set({ panel: null });
  // The assistant's worker is stopped by the host's own cleanup (it owns the
  // engine); the playlist iframe unmounts with the host.
  set((s) => ({ music: { ...s.music, current: null } }));
}

// ---------------------------------------------------------------------------
// Assistant (state only; the engine lives in assistant/engine.ts)
// ---------------------------------------------------------------------------

export function patchAssistant(patch: Partial<AssistantState>): void {
  set((s) => ({ assistant: { ...s.assistant, ...patch } }));
}

export function updateAssistantSettings(patch: Partial<AssistantSettings>): void {
  const settings = sanitizeAssistantSettings({ ...state.assistant.settings, ...patch });
  write("local", LS_ASSISTANT, settings);
  patchAssistant({ settings });
}

// ---------------------------------------------------------------------------
// Focus timer
// ---------------------------------------------------------------------------

const FLUSH_MS = 5_000;
let interval: ReturnType<typeof setInterval> | null = null;
let lastFlush = 0;
let listening = false;

function dispatchTimer(action: TimerAction): void {
  const next = timerReducer(state.timer, action);
  if (next !== state.timer) set({ timer: next });
}

function flushTimer(force = false): void {
  const now = Date.now();
  if (!force && now - lastFlush < FLUSH_MS) return;
  lastFlush = now;
  const { timer } = state;
  write("session", SS_TIMER, { ms: timer.sessionMs });
  // Another tab may have written today's total too: keep the larger.
  const stored = sanitizeFocusLog(read("local", LS_FOCUS));
  const focusLog = recordFocus({ ...stored, ...state.focusLog }, timer.day, timer.dayMs / 1000);
  write("local", LS_FOCUS, focusLog);
  set({ focusLog });
}

function onVisibility(): void {
  dispatchTimer({
    type: "visibility",
    visible: document.visibilityState !== "hidden",
    now: Date.now(),
    day: localDay(),
  });
  if (document.visibilityState === "hidden") flushTimer(true);
}

function onPageHide(): void {
  flushTimer(true);
}

function ensureListeners(): void {
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
}

export function startTimer(): void {
  ensureListeners();
  dispatchTimer({ type: "start", now: Date.now(), day: localDay() });
  if (interval === null) {
    interval = setInterval(() => {
      dispatchTimer({ type: "tick", now: Date.now(), day: localDay() });
      flushTimer();
    }, 1000);
  }
}

export function pauseTimer(): void {
  if (interval !== null) {
    clearInterval(interval);
    interval = null;
  }
  if (!state.timer.running) return;
  dispatchTimer({ type: "pause", now: Date.now(), day: localDay() });
  flushTimer(true);
}

export function toggleTimer(): void {
  if (state.timer.running) pauseTimer();
  else startTimer();
}

/** New session: the session clock returns to 00:00 (today's total stays). */
export function resetTimerSession(): void {
  dispatchTimer({ type: "reset", now: Date.now(), day: localDay() });
  flushTimer(true);
}

export { formatClock };

// ---------------------------------------------------------------------------
// Music (the writer's own playlist links, per device)
// ---------------------------------------------------------------------------

export type LoadResult = { ok: true } | { ok: false };

/** Load a pasted link into the embedded player. Nothing plays until the writer presses play in it. */
export function loadPlaylist(url: string, name: string): LoadResult {
  const link = parsePlaylistLink(url);
  if (!link) return { ok: false };
  const label = name.trim().slice(0, 80) || `${link.provider} playlist`;
  const saved = rememberPlaylist(state.music.saved, { name: label, url: link.url });
  write("local", LS_PLAYLISTS, saved);
  set({ music: { current: { ...link, name: label }, minimized: false, saved } });
  return { ok: true };
}

export function stopPlaylist(): void {
  set((s) => ({ music: { ...s.music, current: null } }));
}

export function setPlayerMinimized(minimized: boolean): void {
  set((s) => ({ music: { ...s.music, minimized } }));
}

export function forgetPlaylist(url: string): void {
  const saved = state.music.saved.filter((p) => p.url !== url);
  write("local", LS_PLAYLISTS, saved);
  set((s) => ({ music: { ...s.music, saved } }));
}

/** Tests only: back to a cold start. */
export function resetRoomForTests(): void {
  if (interval !== null) clearInterval(interval);
  interval = null;
  editorGetter = null;
  state = initialState();
}
