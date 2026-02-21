import { useSearchParams } from "react-router-dom";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";

/**
 * Resolves worldId from either the WorldLayout context (nested route)
 * or from URL search params (standalone tool route).
 */
export function useWorldId(): string | null {
  const layoutContext = useWorldLayoutContext();
  const [searchParams] = useSearchParams();
  return layoutContext?.worldId ?? searchParams.get("worldId");
}
