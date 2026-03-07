// Timeline Keyboard Shortcuts Hook

import { useEffect, useCallback } from "react";
import type { Dispatch } from "react";
import type { TimelineAction } from "@/lib/timeline/context";
import { clampZoom } from "@/lib/timeline/utils";

interface UseTimelineKeyboardOptions {
  dispatch: Dispatch<TimelineAction>;
  selectedEventId: string | null;
  pixelsPerYear: number;
  centerYear: number;
  hasEvents: boolean;
  hasTracks: boolean;
  onNewEvent: () => void;
  onNewTrack: () => void;
  onEditEvent: () => void;
  onDeleteEvent: () => void;
  onFitAll: () => void;
}

export function useTimelineKeyboard({
  dispatch,
  selectedEventId,
  pixelsPerYear,
  centerYear,
  hasEvents,
  hasTracks,
  onNewEvent,
  onNewTrack,
  onEditEvent,
  onDeleteEvent,
  onFitAll,
}: UseTimelineKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in inputs, textareas, or contenteditable
      const tag = (e.target as HTMLElement).tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Ignore when a dialog is open (element with role="dialog" in DOM)
      if (document.querySelector("[role='dialog']")) return;

      switch (e.key) {
        case "Escape":
          if (selectedEventId) {
            e.preventDefault();
            dispatch({ type: "SELECT_EVENT", payload: null });
          }
          break;

        case "Delete":
        case "Backspace":
          if (selectedEventId) {
            e.preventDefault();
            onDeleteEvent();
          }
          break;

        case "e":
          if (!e.ctrlKey && !e.metaKey && selectedEventId) {
            e.preventDefault();
            onEditEvent();
          }
          break;

        case "n":
          if (!e.ctrlKey && !e.metaKey && hasTracks) {
            e.preventDefault();
            onNewEvent();
          }
          break;

        case "t":
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onNewTrack();
          }
          break;

        case "+":
        case "=":
          e.preventDefault();
          dispatch({
            type: "SET_VIEW_STATE",
            payload: { pixelsPerYear: clampZoom(pixelsPerYear * 2), centerYear },
          });
          break;

        case "-":
          e.preventDefault();
          dispatch({
            type: "SET_VIEW_STATE",
            payload: { pixelsPerYear: clampZoom(pixelsPerYear * 0.5), centerYear },
          });
          break;

        case "0":
          if (!e.ctrlKey && !e.metaKey && hasEvents) {
            e.preventDefault();
            onFitAll();
          }
          break;

        case "z":
          if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
            e.preventDefault();
            dispatch({ type: "UNDO" } as TimelineAction);
          }
          break;

        case "Z":
        case "y":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            dispatch({ type: "REDO" } as TimelineAction);
          }
          break;
      }
    },
    [dispatch, selectedEventId, pixelsPerYear, centerYear, hasEvents, hasTracks, onNewEvent, onNewTrack, onEditEvent, onDeleteEvent, onFitAll]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
