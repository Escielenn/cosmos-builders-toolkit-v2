import type React from "react";

export type DataBurstAnimation =
  | "none"
  | "breathe"
  | "flicker"
  | "typewriter"
  | "live";

export interface DataBurstConfig {
  content: string;
  position: React.CSSProperties;
  variant?:
    | "default"
    | "coordinates"
    | "watermark"
    | "starchart"
    | "status"
    | "margin"
    | "edge";
  animation?: DataBurstAnimation;
  /** Parallax depth factor. Negative = lags behind scroll (background depth).
   *  Positive = drifts with scroll (for fixed overlays). Typical: -0.12 to 0.06 */
  parallax?: number;
}
