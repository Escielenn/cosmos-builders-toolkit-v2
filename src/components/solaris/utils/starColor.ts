import type { StarClass } from "../types";

const STAR_COLORS: Record<StarClass, string> = {
  O: "#9BB0FF",
  B: "#AAC0FF",
  A: "#CAD7FF",
  F: "#F8F7FF",
  G: "#FFF4E8",
  K: "#FFD2A1",
  M: "#FFB56C",
};

export function getStarColor(classification: StarClass): string {
  return STAR_COLORS[classification] ?? "#FFF4E8";
}
