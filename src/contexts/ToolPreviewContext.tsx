import { createContext, useContext, type ReactNode } from "react";

/**
 * Read-only preview of a Pro instrument (ProToolGuard, finding 15).
 *
 * When `readOnly` is true nothing on the page may write: useToolWorksheet
 * turns save, create, rename, tags, draft autosave and draft filing into
 * no-ops, and ToolPageLayout drops the action bar, the Ctrl/Cmd+S binding
 * and every world-binding control. The tool's inputs sit in a disabled,
 * inert fieldset, so the preview is visible but cannot be edited.
 */
export interface ToolPreviewValue {
  readOnly: boolean;
  /** The clearance panel ToolPageLayout pins beside the preview. */
  clearance?: ReactNode;
}

const ToolPreviewContext = createContext<ToolPreviewValue>({ readOnly: false });

export function useToolPreview(): ToolPreviewValue {
  return useContext(ToolPreviewContext);
}

export const ToolPreviewProvider = ToolPreviewContext.Provider;

export function useToolReadOnly(): boolean {
  return useContext(ToolPreviewContext).readOnly;
}

/** Ship's Voice line shown when a write is attempted in preview. */
export const PREVIEW_WRITE_BLOCKED = "PREVIEW ONLY. PRO CLEARANCE REQUIRED TO FILE WORK.";
