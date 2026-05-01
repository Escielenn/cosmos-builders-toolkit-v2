import type { DataBurstConfig } from "./types";

// Auth page, security / access control
export const AUTH_BURSTS: DataBurstConfig[] = [
  {
    content: "CLEARANCE: PENDING",
    position: { top: "8%", right: "3%" },
    variant: "status",
    animation: "flicker",
    parallax: -0.05,
  },
  {
    content: "BIOMETRIC SCAN: INITIALIZING",
    position: { top: "24%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "AUTH PROTOCOL: PKCE",
    position: { top: "42%", right: "2%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "ENCRYPTION: AES-256-GCM",
    position: { top: "58%", left: "1%" },
    variant: "margin",
    animation: "live",
    parallax: -0.12,
  },
  {
    content: "ACCESS TIER: DETERMINING",
    position: { top: "72%", right: "1.5%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.06,
  },
];

// Archive, vault / cold storage
export const ARCHIVE_BURSTS: DataBurstConfig[] = [
  {
    content: "ARCHIVE SECTOR: DELTA-7",
    position: { top: "8%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "RETRIEVAL STATUS: READY",
    position: { top: "22%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "COLD STORAGE: 4.2 K",
    position: { top: "40%", right: "2%" },
    variant: "coordinates",
    animation: "live",
    parallax: -0.08,
  },
  {
    content: "VAULT INTEGRITY: 99.97%",
    position: { top: "56%", left: "1%" },
    variant: "margin",
    animation: "live",
    parallax: -0.12,
  },
  {
    content: "DECOMMISSION: HOLD",
    position: { top: "70%", right: "1.5%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.06,
  },
];

// Bookshelf, library / reference stacks
export const BOOKSHELF_BURSTS: DataBurstConfig[] = [
  {
    content: "CATALOG: ACTIVE",
    position: { top: "8%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "REF INDEX: 042.7, ASTROBIOLOGY",
    position: { top: "22%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "DEWEY: 808.3876 (SF TECHNIQUE)",
    position: { top: "38%", left: "1%" },
    variant: "margin",
    parallax: -0.08,
  },
  {
    content: "STACKS: OPEN ACCESS",
    position: { top: "54%", right: "2%" },
    variant: "coordinates",
    animation: "breathe",
    parallax: -0.06,
  },
  {
    content: "ACQUISITIONS: 2026-Q1",
    position: { top: "68%", left: "1%" },
    variant: "margin",
    animation: "live",
    parallax: -0.12,
  },
];

// Collection, inventory / manifest
export const COLLECTION_BURSTS: DataBurstConfig[] = [
  {
    content: "MANIFEST: LOADING",
    position: { top: "8%", right: "3%" },
    variant: "status",
    animation: "flicker",
    parallax: -0.05,
  },
  {
    content: "CARGO BAY: OPEN",
    position: { top: "22%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "INVENTORY SCAN: IN PROGRESS",
    position: { top: "38%", right: "2%" },
    variant: "coordinates",
    animation: "live",
    parallax: -0.06,
  },
  {
    content: "ITEMS: CATALOGUED",
    position: { top: "54%", left: "1%" },
    variant: "margin",
    parallax: -0.08,
  },
  {
    content: "SORTING: CHRONOLOGICAL",
    position: { top: "68%", right: "1.5%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.12,
  },
];

// NotFound, lost signal / search
export const NOT_FOUND_BURSTS: DataBurstConfig[] = [
  {
    content: "SIGNAL LOST",
    position: { top: "12%", right: "3%" },
    variant: "status",
    animation: "flicker",
    parallax: -0.05,
  },
  {
    content: "SCANNING FREQUENCIES...",
    position: { top: "28%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "LAST KNOWN: UNKNOWN SECTOR",
    position: { top: "44%", right: "2%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "BEACON: NO RESPONSE",
    position: { top: "60%", left: "1%" },
    variant: "margin",
    animation: "flicker",
    parallax: -0.12,
  },
  {
    content: "SEARCH RADIUS: EXPANDING",
    position: { top: "74%", right: "1.5%" },
    variant: "margin",
    animation: "live",
    parallax: -0.06,
  },
];

// InviteAccept, docking / handshake
export const INVITE_ACCEPT_BURSTS: DataBurstConfig[] = [
  {
    content: "DOCKING PROTOCOL: ACTIVE",
    position: { top: "8%", right: "3%" },
    variant: "status",
    animation: "flicker",
    parallax: -0.05,
  },
  {
    content: "AIRLOCK: STANDBY",
    position: { top: "24%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "HANDSHAKE: AWAITING SYNC",
    position: { top: "42%", right: "2%" },
    variant: "coordinates",
    animation: "live",
    parallax: -0.06,
  },
  {
    content: "CLEARANCE: PENDING CREW AUTH",
    position: { top: "58%", left: "1%" },
    variant: "margin",
    parallax: -0.08,
  },
  {
    content: "BERTH ASSIGNMENT: HOLD",
    position: { top: "72%", right: "1.5%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.12,
  },
];

// SharedWorksheetView, broadcast / transmission
export const SHARED_WORKSHEET_BURSTS: DataBurstConfig[] = [
  {
    content: "BROADCAST: OPEN CHANNEL",
    position: { top: "8%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "FREQ: 2.4 GHz // BAND: ISM",
    position: { top: "24%", left: "1%" },
    variant: "margin",
    animation: "live",
    parallax: -0.08,
  },
  {
    content: "SIGNAL: CLEAR",
    position: { top: "40%", right: "2%" },
    variant: "coordinates",
    animation: "breathe",
    parallax: -0.12,
  },
  {
    content: "READ-ONLY RELAY: ACTIVE",
    position: { top: "56%", left: "1%" },
    variant: "margin",
    parallax: -0.06,
  },
  {
    content: "ORIGIN: AUTHENTICATED",
    position: { top: "70%", right: "1.5%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
];

// SharedWorldView, observatory / visitor
export const SHARED_WORLD_BURSTS: DataBurstConfig[] = [
  {
    content: "OBSERVATORY MODE: ACTIVE",
    position: { top: "8%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "VISITOR PASS: VALID",
    position: { top: "24%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
  {
    content: "VIEWING ANGLE: 0.47 arcsec",
    position: { top: "40%", left: "1%" },
    variant: "margin",
    animation: "live",
    parallax: -0.06,
  },
  {
    content: "WORLD SURVEY: READ-ONLY",
    position: { top: "56%", right: "2%" },
    variant: "coordinates",
    parallax: -0.08,
  },
  {
    content: "EXPOSURE: LONG-BASELINE",
    position: { top: "70%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.12,
  },
];

// WorldConnections, network / relay
export const WORLD_CONNECTIONS_BURSTS: DataBurstConfig[] = [
  {
    content: "RELAY NETWORK: ONLINE",
    position: { top: "8%", right: "3%" },
    variant: "status",
    parallax: -0.05,
  },
  {
    content: "NODE COUNT: ACTIVE",
    position: { top: "24%", left: "1%" },
    variant: "margin",
    animation: "live",
    parallax: -0.08,
  },
  {
    content: "TOPOLOGY: MESH // HOPS: 3",
    position: { top: "40%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.12,
  },
  {
    content: "LINK INTEGRITY: 99.2%",
    position: { top: "56%", right: "2%" },
    variant: "coordinates",
    animation: "live",
    parallax: -0.06,
  },
  {
    content: "GRAPH RENDER: PROCESSING",
    position: { top: "70%", left: "1%" },
    variant: "margin",
    animation: "breathe",
    parallax: -0.1,
  },
];
