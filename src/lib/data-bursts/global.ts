import type { DataBurstConfig } from "./types";

/** Header region — upper-right, partially cropped */
export const HEADER_BURSTS: DataBurstConfig[] = [
  {
    content: "UPLINK: ACTIVE // 2.4 GHz",
    position: { top: "12px", right: "180px" },
    variant: "status",
    animation: "flicker",
    parallax: 0.02,
  },
  {
    content: "ν = 1420.405 MHz",
    position: { top: "28px", right: "200px" },
    variant: "coordinates",
    animation: "breathe",
    parallax: 0.04,
  },
  {
    content: "SYNC: UTC+0",
    position: { top: "12px", left: "120px" },
    variant: "coordinates",
    parallax: 0.03,
  },
];

/** Left edge — film frame numbers, hidden below md */
export const EDGE_BURSTS: DataBurstConfig[] = [
  { content: "▸ 001", position: { top: "12%", left: "6px" }, variant: "edge", parallax: 0.06 },
  { content: "▸ 002", position: { top: "24%", left: "6px" }, variant: "edge", animation: "breathe", parallax: 0.04 },
  { content: "▸ 003", position: { top: "36%", left: "6px" }, variant: "edge", parallax: 0.06 },
  { content: "▸ 004", position: { top: "48%", left: "6px" }, variant: "edge", animation: "breathe", parallax: 0.03 },
  { content: "▸ 005", position: { top: "60%", left: "6px" }, variant: "edge", parallax: 0.05 },
  { content: "▸ 006", position: { top: "72%", left: "6px" }, variant: "edge", animation: "breathe", parallax: 0.04 },
  { content: "▸ 007", position: { top: "84%", left: "6px" }, variant: "edge", parallax: 0.06 },
];

/** Right edge — secondary film frame marks */
export const RIGHT_EDGE_BURSTS: DataBurstConfig[] = [
  { content: "◂ A1", position: { top: "18%", right: "6px" }, variant: "edge", parallax: 0.05 },
  { content: "◂ A2", position: { top: "42%", right: "6px" }, variant: "edge", animation: "breathe", parallax: 0.03 },
  { content: "◂ A3", position: { top: "66%", right: "6px" }, variant: "edge", parallax: 0.05 },
];

/** Footer region — near status bar */
export const FOOTER_BURSTS: DataBurstConfig[] = [
  {
    content: "T_CMB = 2.7255 ± 0.0006 K",
    position: { bottom: "36px", left: "12px" },
    variant: "coordinates",
    animation: "live",
    parallax: 0.02,
  },
  {
    content: "EPOCH: J2000.0",
    position: { bottom: "36px", right: "120px" },
    variant: "status",
    parallax: 0.03,
  },
  {
    content: "λ_obs = 21.106 cm",
    position: { bottom: "52px", left: "140px" },
    variant: "coordinates",
    animation: "breathe",
    parallax: 0.04,
  },
];
