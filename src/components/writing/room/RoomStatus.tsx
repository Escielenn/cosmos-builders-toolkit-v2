/**
 * RoomStatus: small readouts the tools add to the Manuscript status bar
 * (focus timer, assistant issue count). Mounted once by Write.tsx in the
 * status bar, before the word count. 1.7 seam, see RoomTools.
 */
export interface RoomStatusProps {
  worldId: string | null;
  documentId: string | null;
}

export function RoomStatus(_props: RoomStatusProps): JSX.Element | null {
  return null;
}

export default RoomStatus;
