import type { Editor } from "@tiptap/react";

/**
 * RoomTools: the Manuscript's tool group (writing assistant, targets and
 * timer, music). Mounted once in the Manuscript's top bar by Write.tsx.
 * 1.7 seam: the bar owner mounts it, the tools owner fills it.
 */
export interface RoomToolsProps {
  worldId: string | null;
  documentId: string | null;
  /** The live Tiptap editor for the focused document, or null while loading. */
  getEditor: () => Editor | null;
  /** Compact = phone bar: render inside an overflow menu instead of icons. */
  compact?: boolean;
}

export function RoomTools(_props: RoomToolsProps): JSX.Element | null {
  return null;
}

export default RoomTools;
