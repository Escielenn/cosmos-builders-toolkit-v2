import type { DataBurstConfig } from "./types";

export const PRIVACY_BURSTS: DataBurstConfig[] = [
  {
    content: "DOC: PRIVACY-POLICY // v3.1",
    position: { top: "6%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "SHA-256: 7f3a…c9e2",
    position: { top: "18%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "COMPLIANCE: GDPR / CCPA",
    position: { top: "45%", right: "1.5%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "DATA RETENTION: 90d",
    position: { top: "65%", left: "1%" },
    variant: "margin",
    parallax: -0.12,
  },
];

export const TERMS_BURSTS: DataBurstConfig[] = [
  {
    content: "DOC: TERMS-OF-SERVICE // v2.4",
    position: { top: "6%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "SHA-256: a1b4…f8d3",
    position: { top: "18%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "JURISDICTION: US-CO",
    position: { top: "45%", right: "1.5%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "EFFECTIVE: 2026-01-15",
    position: { top: "65%", left: "1%" },
    variant: "margin",
    parallax: -0.12,
  },
];
