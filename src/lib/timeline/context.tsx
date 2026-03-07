// Timeline — Context + Reducer (Phase 2 State Management)

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type {
  TimelineState,
  TimelineTrack,
  TimelineEvent,
  TimelineFilter,
  EventLink,
  ElementLink,
  ViewState,
  MoodboardImage,
  CustomCalendar,
  TimeCompression,
} from "./types";
import { initialTimelineState } from "./constants";
import { generateId, getNextTrackOrder, reorderTracks } from "./utils";

// ─── Action Types ──────────────────────────────────────────────────

export type TimelineAction =
  // Full state
  | { type: "SET_STATE"; payload: TimelineState }
  | { type: "UPDATE_PARTIAL"; payload: Partial<TimelineState> }
  // Track CRUD
  | { type: "CREATE_TRACK"; payload: Omit<TimelineTrack, "id" | "order" | "isCollapsed"> }
  | { type: "UPDATE_TRACK"; payload: TimelineTrack }
  | { type: "DELETE_TRACK"; payload: string }
  | { type: "TOGGLE_COLLAPSE"; payload: string }
  | { type: "REORDER_TRACKS"; payload: { fromIndex: number; toIndex: number } }
  // Event CRUD
  | { type: "CREATE_EVENT"; payload: Omit<TimelineEvent, "id"> }
  | { type: "UPDATE_EVENT"; payload: TimelineEvent }
  | { type: "DELETE_EVENT"; payload: string }
  // View state
  | { type: "SET_VIEW_STATE"; payload: ViewState }
  // Selection
  | { type: "SELECT_EVENT"; payload: string | null }
  // Notes & Moodboard
  | { type: "UPDATE_NOTES"; payload: string }
  | { type: "UPDATE_MOODBOARD"; payload: MoodboardImage[] }
  // Phase 2: Calendars
  | { type: "CREATE_CALENDAR"; payload: Omit<CustomCalendar, "id"> }
  | { type: "UPDATE_CALENDAR"; payload: CustomCalendar }
  | { type: "DELETE_CALENDAR"; payload: string }
  // Phase 2: Event nesting expand/collapse
  | { type: "TOGGLE_EVENT_EXPAND"; payload: string }
  // Phase 2: Time Compressions
  | { type: "CREATE_COMPRESSION"; payload: Omit<TimeCompression, "id"> }
  | { type: "UPDATE_COMPRESSION"; payload: TimeCompression }
  | { type: "DELETE_COMPRESSION"; payload: string }
  | { type: "TOGGLE_COMPRESSION_EXPAND"; payload: string }
  // Phase 3: Filtering (ephemeral — not persisted)
  | { type: "SET_FILTER"; payload: Partial<TimelineFilter> }
  | { type: "CLEAR_FILTERS" }
  // Phase 3: Track Folding
  | { type: "FOLD_TRACK"; payload: { trackId: string; intoTrackId: string } }
  | { type: "UNFOLD_TRACK"; payload: string }
  // Phase 3: Causality Links
  | { type: "CREATE_LINK"; payload: Omit<EventLink, "id"> }
  | { type: "UPDATE_LINK"; payload: EventLink }
  | { type: "DELETE_LINK"; payload: string }
  | { type: "TOGGLE_LINKS_VISIBLE" }
  // Phase 3: Element Links
  | { type: "CREATE_ELEMENT_LINK"; payload: Omit<ElementLink, "id"> }
  | { type: "DELETE_ELEMENT_LINK"; payload: string }
  // Phase 4: Undo/Redo
  | { type: "UNDO" }
  | { type: "REDO" };

// ─── Context Shape ─────────────────────────────────────────────────

interface TimelineContextValue {
  state: TimelineState;
  selectedEventId: string | null;
  filter: TimelineFilter;
  canUndo: boolean;
  canRedo: boolean;
  dispatch: Dispatch<TimelineAction>;
}

// ─── Empty Filter (default) ───────────────────────────────────────

const emptyFilter: TimelineFilter = {
  searchQuery: "",
  trackIds: [],
  eventTypes: [],
  importanceLevels: [],
  dateRange: null,
  tags: [],
};

// ─── Internal Reducer State ────────────────────────────────────────

const MAX_UNDO_STACK = 50;

interface ReducerState {
  timeline: TimelineState;
  selectedEventId: string | null;
  filter: TimelineFilter;
  undoStack: TimelineState[];
  redoStack: TimelineState[];
}

// Actions that do NOT push to the undo stack (view/ephemeral state only)
const NON_UNDOABLE_ACTIONS = new Set<string>([
  "SET_VIEW_STATE",
  "SELECT_EVENT",
  "SET_FILTER",
  "CLEAR_FILTERS",
  "TOGGLE_COLLAPSE",
  "TOGGLE_EVENT_EXPAND",
  "TOGGLE_COMPRESSION_EXPAND",
  "TOGGLE_LINKS_VISIBLE",
]);

// ─── Reducer ───────────────────────────────────────────────────────

function timelineReducer(state: ReducerState, action: TimelineAction): ReducerState {
  const tl = state.timeline;

  // ── Undo/Redo (Phase 4) ──────────────────────────────────────
  if (action.type === "UNDO") {
    if (state.undoStack.length === 0) return state;
    const prev = state.undoStack[state.undoStack.length - 1];
    return {
      ...state,
      timeline: prev,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, tl].slice(-MAX_UNDO_STACK),
    };
  }

  if (action.type === "REDO") {
    if (state.redoStack.length === 0) return state;
    const next = state.redoStack[state.redoStack.length - 1];
    return {
      ...state,
      timeline: next,
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, tl].slice(-MAX_UNDO_STACK),
    };
  }

  // ── Apply action ─────────────────────────────────────────────
  const result = applyAction(state, action);

  // Push to undo stack for undoable mutations
  if (
    result !== state &&
    result.timeline !== tl &&
    !NON_UNDOABLE_ACTIONS.has(action.type)
  ) {
    // SET_STATE resets undo history (worksheet load, template apply)
    if (action.type === "SET_STATE") {
      return { ...result, undoStack: [], redoStack: [] };
    }
    return {
      ...result,
      undoStack: [...state.undoStack, tl].slice(-MAX_UNDO_STACK),
      redoStack: [],
    };
  }

  return result;
}

function applyAction(state: ReducerState, action: TimelineAction): ReducerState {
  const tl = state.timeline;

  switch (action.type) {
    // ── Full state ──────────────────────────────────────────────
    case "SET_STATE":
      return { ...state, timeline: action.payload };

    case "UPDATE_PARTIAL":
      return { ...state, timeline: { ...tl, ...action.payload } };

    // ── Track CRUD ──────────────────────────────────────────────
    case "CREATE_TRACK":
      return {
        ...state,
        timeline: {
          ...tl,
          tracks: [
            ...tl.tracks,
            {
              ...action.payload,
              id: generateId(),
              order: getNextTrackOrder(tl.tracks),
              isCollapsed: false,
            },
          ],
        },
      };

    case "UPDATE_TRACK":
      return {
        ...state,
        timeline: {
          ...tl,
          tracks: tl.tracks.map((t) => (t.id === action.payload.id ? action.payload : t)),
        },
      };

    case "DELETE_TRACK":
      return {
        ...state,
        timeline: {
          ...tl,
          tracks: tl.tracks.filter((t) => t.id !== action.payload),
          events: tl.events.filter((e) => e.trackId !== action.payload),
        },
      };

    case "TOGGLE_COLLAPSE":
      return {
        ...state,
        timeline: {
          ...tl,
          tracks: tl.tracks.map((t) =>
            t.id === action.payload ? { ...t, isCollapsed: !t.isCollapsed } : t
          ),
        },
      };

    case "REORDER_TRACKS":
      return {
        ...state,
        timeline: {
          ...tl,
          tracks: reorderTracks(tl.tracks, action.payload.fromIndex, action.payload.toIndex),
        },
      };

    // ── Event CRUD ──────────────────────────────────────────────
    case "CREATE_EVENT": {
      const newEvent: TimelineEvent = { ...action.payload, id: generateId() };
      return {
        ...state,
        timeline: { ...tl, events: [...tl.events, newEvent] },
      };
    }

    case "UPDATE_EVENT":
      return {
        ...state,
        timeline: {
          ...tl,
          events: tl.events.map((e) => (e.id === action.payload.id ? action.payload : e)),
        },
      };

    case "DELETE_EVENT":
      return {
        ...state,
        selectedEventId: state.selectedEventId === action.payload ? null : state.selectedEventId,
        timeline: {
          ...tl,
          events: tl.events
            .map((e) => (e.parentEventId === action.payload ? { ...e, parentEventId: undefined } : e))
            .filter((e) => e.id !== action.payload),
        },
      };

    // ── View state ──────────────────────────────────────────────
    case "SET_VIEW_STATE":
      return {
        ...state,
        timeline: { ...tl, viewState: action.payload },
      };

    // ── Selection ───────────────────────────────────────────────
    case "SELECT_EVENT":
      return { ...state, selectedEventId: action.payload };

    // ── Notes & Moodboard ───────────────────────────────────────
    case "UPDATE_NOTES":
      return { ...state, timeline: { ...tl, generalNotes: action.payload } };

    case "UPDATE_MOODBOARD":
      return { ...state, timeline: { ...tl, moodboard: action.payload } };

    // ── Calendars (Phase 2) ─────────────────────────────────────
    case "CREATE_CALENDAR":
      return {
        ...state,
        timeline: {
          ...tl,
          calendars: [...tl.calendars, { ...action.payload, id: generateId() }],
        },
      };

    case "UPDATE_CALENDAR":
      return {
        ...state,
        timeline: {
          ...tl,
          calendars: tl.calendars.map((c) => (c.id === action.payload.id ? action.payload : c)),
        },
      };

    case "DELETE_CALENDAR":
      return {
        ...state,
        timeline: {
          ...tl,
          calendars: tl.calendars.filter((c) => c.id !== action.payload),
        },
      };

    // ── Event nesting expand/collapse (Phase 2) ─────────────────
    case "TOGGLE_EVENT_EXPAND": {
      const id = action.payload;
      const expanded = tl.expandedEventIds.includes(id)
        ? tl.expandedEventIds.filter((eid) => eid !== id)
        : [...tl.expandedEventIds, id];
      return {
        ...state,
        timeline: { ...tl, expandedEventIds: expanded },
      };
    }

    // ── Time Compressions (Phase 2) ─────────────────────────────
    case "CREATE_COMPRESSION":
      return {
        ...state,
        timeline: {
          ...tl,
          compressions: [...tl.compressions, { ...action.payload, id: generateId() }],
        },
      };

    case "UPDATE_COMPRESSION":
      return {
        ...state,
        timeline: {
          ...tl,
          compressions: tl.compressions.map((c) =>
            c.id === action.payload.id ? action.payload : c
          ),
        },
      };

    case "DELETE_COMPRESSION":
      return {
        ...state,
        timeline: {
          ...tl,
          compressions: tl.compressions.filter((c) => c.id !== action.payload),
        },
      };

    case "TOGGLE_COMPRESSION_EXPAND": {
      return {
        ...state,
        timeline: {
          ...tl,
          compressions: tl.compressions.map((c) =>
            c.id === action.payload ? { ...c, isExpanded: !c.isExpanded } : c
          ),
        },
      };
    }

    // ── Filtering (Phase 3 — ephemeral) ──────────────────────────
    case "SET_FILTER":
      return { ...state, filter: { ...state.filter, ...action.payload } };

    case "CLEAR_FILTERS":
      return { ...state, filter: { ...emptyFilter } };

    // ── Track Folding (Phase 3) ───────────────────────────────────
    case "FOLD_TRACK": {
      const { trackId, intoTrackId } = action.payload;
      // Validation: can't fold into self or into an already-folded track
      const targetTrack = tl.tracks.find((t) => t.id === intoTrackId);
      if (!targetTrack || targetTrack.foldedIntoTrackId || trackId === intoTrackId) {
        return state;
      }
      return {
        ...state,
        timeline: {
          ...tl,
          tracks: tl.tracks.map((t) =>
            t.id === trackId ? { ...t, foldedIntoTrackId: intoTrackId } : t
          ),
        },
      };
    }

    case "UNFOLD_TRACK":
      return {
        ...state,
        timeline: {
          ...tl,
          tracks: tl.tracks.map((t) =>
            t.id === action.payload ? { ...t, foldedIntoTrackId: undefined } : t
          ),
        },
      };

    // ── Causality Links (Phase 3) ─────────────────────────────────
    case "CREATE_LINK":
      return {
        ...state,
        timeline: {
          ...tl,
          eventLinks: [...tl.eventLinks, { ...action.payload, id: generateId() }],
        },
      };

    case "UPDATE_LINK":
      return {
        ...state,
        timeline: {
          ...tl,
          eventLinks: tl.eventLinks.map((l) =>
            l.id === action.payload.id ? action.payload : l
          ),
        },
      };

    case "DELETE_LINK":
      return {
        ...state,
        timeline: {
          ...tl,
          eventLinks: tl.eventLinks.filter((l) => l.id !== action.payload),
        },
      };

    case "TOGGLE_LINKS_VISIBLE":
      return {
        ...state,
        timeline: {
          ...tl,
          causalityLinksVisible: !tl.causalityLinksVisible,
        },
      };

    // ── Element Links (Phase 3) ─────────────────────────────────────
    case "CREATE_ELEMENT_LINK":
      return {
        ...state,
        timeline: {
          ...tl,
          elementLinks: [...tl.elementLinks, { ...action.payload, id: generateId() }],
        },
      };

    case "DELETE_ELEMENT_LINK":
      return {
        ...state,
        timeline: {
          ...tl,
          elementLinks: tl.elementLinks.filter((l) => l.id !== action.payload),
        },
      };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────

const TimelineContext = createContext<TimelineContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────

interface TimelineProviderProps {
  children: ReactNode;
}

export function TimelineProvider({ children }: TimelineProviderProps) {
  const [reducerState, dispatch] = useReducer(timelineReducer, {
    timeline: initialTimelineState,
    selectedEventId: null,
    filter: { ...emptyFilter },
    undoStack: [],
    redoStack: [],
  });

  return (
    <TimelineContext.Provider
      value={{
        state: reducerState.timeline,
        selectedEventId: reducerState.selectedEventId,
        filter: reducerState.filter,
        canUndo: reducerState.undoStack.length > 0,
        canRedo: reducerState.redoStack.length > 0,
        dispatch,
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────

export function useTimeline(): TimelineContextValue {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline must be used within a TimelineProvider");
  return ctx;
}
