// ---------------------------------------------------------------------------
// useRoomSettings: the writing room on this device (lib/writing/room.ts).
//
// Until the writer changes something, the room is derived from what they had
// already chosen in the old Type and Page theme menus, so nobody's page
// resets. The first change stores the whole room in localStorage.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ROOM_DEFAULTS,
  applyLook as applyLookTo,
  liveVoidColors,
  readLooks,
  readRoom,
  roomFromLegacy,
  roomStorage,
  roomStyle,
  sanitizeRoom,
  saveLook as saveLookTo,
  writeLooks,
  writeRoom,
  type LegacyWritingLook,
  type RoomLook,
  type RoomSettings,
} from "@/lib/writing/room";
import type { PaperColors } from "@/lib/writing/themes";

function readVoid(): PaperColors | null {
  if (typeof document === "undefined") return null;
  try {
    const cs = getComputedStyle(document.documentElement);
    return liveVoidColors((name) => cs.getPropertyValue(name));
  } catch {
    return null;
  }
}

export interface RoomController {
  room: RoomSettings;
  /** True once this device has a stored room (the writer changed something). */
  stored: boolean;
  update: (patch: Partial<RoomSettings>) => void;
  reset: () => void;
  style: CSSProperties;
  /** The instrument theme's live colours (for the "Void" paper's floor). */
  voidColors: PaperColors | null;
  looks: RoomLook[];
  /** False when the shelf is full or the name is empty. */
  saveLook: (name: string) => boolean;
  applyLook: (look: RoomLook) => void;
  deleteLook: (id: string) => void;
}

export function useRoomSettings(legacy: LegacyWritingLook): RoomController {
  const [stored, setStored] = useState<RoomSettings | null>(() => readRoom(roomStorage()));
  const [looks, setLooks] = useState<RoomLook[]>(() => readLooks(roomStorage()));

  const { themeId, lineSpacing, writingFont, writingMeasure } = legacy;
  const derived = useMemo(
    () => roomFromLegacy({ themeId, lineSpacing, writingFont, writingMeasure }),
    [themeId, lineSpacing, writingFont, writingMeasure],
  );
  const room = stored ?? derived;
  const roomRef = useRef(room);
  roomRef.current = room;

  const commit = useCallback((next: RoomSettings) => {
    roomRef.current = next;
    setStored(next);
    writeRoom(roomStorage(), next);
  }, []);

  const update = useCallback(
    (patch: Partial<RoomSettings>) => commit(sanitizeRoom({ ...roomRef.current, ...patch }, roomRef.current)),
    [commit],
  );

  // Reset the look; the chrome comforts (binder width, compact rows, text
  // size) are about the device, not the page, and stay as they are.
  const reset = useCallback(() => {
    const { binderWidth, binderCompact, uiSize } = roomRef.current;
    commit({ ...ROOM_DEFAULTS, binderWidth, binderCompact, uiSize });
  }, [commit]);

  // The theme can change while the Manuscript is open (the theme picker):
  // re-read the tokens the "Void" paper is made of.
  const [voidColors, setVoidColors] = useState<PaperColors | null>(null);
  useEffect(() => {
    setVoidColors(readVoid());
    if (typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(() => setVoidColors(readVoid()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
    return () => mo.disconnect();
  }, []);

  const style = useMemo(() => roomStyle(room, voidColors ?? undefined) as CSSProperties, [room, voidColors]);

  const saveLook = useCallback((name: string): boolean => {
    let ok = false;
    setLooks((prev) => {
      const next = saveLookTo(prev, name, roomRef.current);
      if (!next) return prev;
      ok = true;
      writeLooks(roomStorage(), next);
      return next;
    });
    return ok;
  }, []);

  const applyLook = useCallback((look: RoomLook) => commit(applyLookTo(roomRef.current, look)), [commit]);

  const deleteLook = useCallback((id: string) => {
    setLooks((prev) => {
      const next = prev.filter((l) => l.id !== id);
      writeLooks(roomStorage(), next);
      return next;
    });
  }, []);

  return { room, stored: stored !== null, update, reset, style, voidColors, looks, saveLook, applyLook, deleteLook };
}
