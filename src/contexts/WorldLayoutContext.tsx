import { createContext, useContext } from "react";

export interface WorldLayoutContextValue {
  worldId: string;
  worldName: string;
  isWorldLayout: true;
}

const WorldLayoutContext = createContext<WorldLayoutContextValue | null>(null);

export function WorldLayoutProvider({
  value,
  children,
}: {
  value: WorldLayoutContextValue;
  children: React.ReactNode;
}) {
  return (
    <WorldLayoutContext.Provider value={value}>
      {children}
    </WorldLayoutContext.Provider>
  );
}

/** Returns context when inside WorldLayout, or null when standalone. */
export function useWorldLayoutContext(): WorldLayoutContextValue | null {
  return useContext(WorldLayoutContext);
}

/** Convenience: true when inside WorldLayout. */
export function useIsWorldLayout(): boolean {
  return useContext(WorldLayoutContext) !== null;
}
