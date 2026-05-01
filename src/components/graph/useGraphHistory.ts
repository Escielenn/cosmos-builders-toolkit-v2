// ---------------------------------------------------------------------------
// useGraphHistory, Lightweight undo/redo for graph operations.
// Stores a stack of operations with their reverse actions.
// ---------------------------------------------------------------------------

import { useState, useCallback, useRef } from "react";

export interface GraphOperation {
  type: "create_entity" | "delete_entity" | "create_connection" | "delete_connection" | "move_node";
  description: string;
  /** Function to undo this operation */
  undo: () => Promise<void> | void;
  /** Function to redo this operation */
  redo: () => Promise<void> | void;
}

interface GraphHistoryState {
  past: GraphOperation[];
  future: GraphOperation[];
}

const MAX_HISTORY = 50;

export function useGraphHistory() {
  const [state, setState] = useState<GraphHistoryState>({
    past: [],
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  /** Record a new operation (clears redo stack) */
  const push = useCallback((operation: GraphOperation) => {
    setState((prev) => ({
      past: [...prev.past.slice(-MAX_HISTORY + 1), operation],
      future: [],
    }));
  }, []);

  /** Undo the most recent operation */
  const undo = useCallback(async () => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const operation = prev.past[prev.past.length - 1];
      // Execute undo asynchronously
      Promise.resolve(operation.undo()).catch(console.error);
      return {
        past: prev.past.slice(0, -1),
        future: [operation, ...prev.future],
      };
    });
  }, []);

  /** Redo the most recently undone operation */
  const redo = useCallback(async () => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const operation = prev.future[0];
      // Execute redo asynchronously
      Promise.resolve(operation.redo()).catch(console.error);
      return {
        past: [...prev.past, operation],
        future: prev.future.slice(1),
      };
    });
  }, []);

  /** Clear all history */
  const clear = useCallback(() => {
    setState({ past: [], future: [] });
  }, []);

  return {
    canUndo,
    canRedo,
    push,
    undo,
    redo,
    clear,
    lastOperation: state.past[state.past.length - 1] ?? null,
  };
}
