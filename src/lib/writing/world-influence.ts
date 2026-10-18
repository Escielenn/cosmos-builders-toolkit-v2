// ---------------------------------------------------------------------------
// world-influence, the Studio Charter's block: the six-to-ten facts that
// touch THIS scene, each as the consequence a tool already wrote for it.
//
//   // WORLD INFLUENCE · EPOCH 2340 · KELLIS BAND
//   GRAVITY   1.4 g     FELT AS 1.4× HOME. HEAVY. STAIRS ARE A HAZARD.
//   DAYLIGHT  ——        PERMANENT DAY. THE STAR HANGS 40° UP AND NEVER MOVES.
//
// Inputs come from three directions the Card declares: the place the scene
// is SET IN (Surface Cartographer: its body's facts, its sky), the POV
// (Dossier: native gravity, senses, the two calendars) and WHEN / TIMELINE.
//
// No prose is invented here. A narrative column is filled only from text the
// owning tool already produces (Dossier narrate*, Surface Cartographer
// placeSky, Gravitas movement table); otherwise the row is value + unit.
//
// Pure: no React, no network, tested.
// ---------------------------------------------------------------------------

import type { BodyFacts, BodyFactSource } from "@/lib/surface-cartographer/body";
import { placeSky } from "@/lib/surface-cartographer/illumination";
import { formatLatLon, type LatLon } from "@/lib/surface-cartographer/geo";
import {
  feltWeightRatio,
  fmt,
  narrateFeltWeight,
  narrateLocalAge,
  narrateNativeGravity,
  parseGravityG,
  parseLeadingNumber,
} from "@/lib/dossier/derive";
import { getMovementTable } from "@/lib/gravitas/experiential";
import type { ToolAccent } from "@/lib/tool-accents";

export interface InfluenceRow {
  key: string;
  /** Mono label, uppercase. */
  label: string;
  value: string;
  /** The owning tool's own sentence of consequence, or null. */
  narrative: string | null;
  /** "Genesis · Kellis", "Dossier · Verrid". */
  source: string;
  href: string | null;
  accent: ToolAccent;
}

export interface InfluencePov {
  name: string;
  /** The dossier's saved `resolved` record. */
  resolved: Readonly<Record<string, string>>;
  source: string;
  href: string | null;
}

export interface InfluenceInput {
  body: BodyFacts | null;
  place: { name: string; at: LatLon | null } | null;
  /** Where the star stands on a locked world (the cartographer's choice). */
  substellarLon?: number;
  terminatorHalfWidthDeg?: number;
  pov: InfluencePov | null;
  epoch: { when: string; branchName: string | null } | null;
}

export const MAX_INFLUENCE_ROWS = 10;

function src(s: BodyFactSource | undefined | null): { source: string; href: string | null } {
  return s ? { source: s.label, href: s.href } : { source: "", href: null };
}

/** The block's heading line. */
export function influenceHeading(input: Pick<InfluenceInput, "place" | "epoch" | "body">): string {
  const parts = ["// WORLD INFLUENCE"];
  if (input.epoch?.when) parts.push(`EPOCH ${input.epoch.when.toUpperCase()}`);
  if (input.epoch?.branchName) parts.push(input.epoch.branchName.toUpperCase());
  const where = input.place?.name ?? input.body?.name;
  if (where) parts.push(where.toUpperCase());
  return parts.join(" · ");
}

export function buildWorldInfluence(input: InfluenceInput): InfluenceRow[] {
  const rows: InfluenceRow[] = [];
  const { body, place, pov } = input;
  const nativeG = pov ? parseGravityG(pov.resolved.gravityAdaptation) : null;

  // GRAVITY: what this body does to this body.
  const g = body?.surfaceGravityG;
  if (g) {
    let narrative: string | null = null;
    const ratio = feltWeightRatio(nativeG, g.value);
    if (ratio !== null) {
      narrative = `FELT AS ${fmt(ratio)}× HOME. ${narrateFeltWeight(ratio)}`;
    } else {
      const m = getMovementTable(g.value);
      narrative = `Walking: ${m.walking.toLowerCase()}. Running: ${m.running.toLowerCase()}.`;
    }
    rows.push({ key: "gravity", label: "GRAVITY", value: `${fmt(g.value)} g`, narrative, ...src(g.source), accent: "amber" });
  }

  // LIGHT: the sky over this place, or the day length when no place is set.
  const locked = body?.tidallyLocked?.value === true;
  if (place?.at && body) {
    const sky = placeSky(place.at, {
      tiltDeg: body.tiltDeg?.value ?? null,
      dayLengthHours: body.dayLengthHours?.value ?? null,
      tidallyLocked: locked,
      substellarLon: input.substellarLon ?? 0,
      terminatorHalfWidthDeg: input.terminatorHalfWidthDeg,
    });
    const value = sky.lockedSky
      ? "——"
      : sky.daylight
        ? `${fmt(sky.daylight.equinoxHours)} h light`
        : "——";
    rows.push({
      key: "daylight",
      label: "DAYLIGHT",
      value,
      narrative: sky.narrative,
      ...src(body.dayLengthHours?.source ?? body.tidallyLocked?.source ?? body.tiltDeg?.source),
      accent: "azure",
    });
    rows.push({
      key: "band",
      label: locked ? "ZONE" : "LATITUDE",
      value: `${sky.band} · ${formatLatLon(place.at)}`,
      narrative: null,
      source: "Surface Cartographer",
      href: null,
      accent: "azure",
    });
  } else if (body?.tidallyLocked?.value) {
    rows.push({ key: "day", label: "DAY LENGTH", value: "——", narrative: "TIDALLY LOCKED.", ...src(body.tidallyLocked.source), accent: "azure" });
  } else if (body?.dayLengthHours) {
    rows.push({ key: "day", label: "DAY LENGTH", value: `${fmt(body.dayLengthHours.value)} h`, narrative: null, ...src(body.dayLengthHours.source), accent: "azure" });
  }

  if (body?.atmoPressureBar) {
    const comp = body.atmoComposition?.value;
    rows.push({
      key: "atmosphere",
      label: "ATMOSPHERE",
      value: `${fmt(body.atmoPressureBar.value)} bar${comp ? ` · ${comp}` : ""}`,
      narrative: null,
      ...src(body.atmoPressureBar.source),
      accent: "azure",
    });
  } else if (body?.atmoComposition) {
    rows.push({ key: "atmosphere", label: "ATMOSPHERE", value: body.atmoComposition.value, narrative: null, ...src(body.atmoComposition.source), accent: "azure" });
  }

  if (body?.meanTempC) {
    rows.push({ key: "temperature", label: "MEAN TEMP", value: `${fmt(body.meanTempC.value)} °C`, narrative: null, ...src(body.meanTempC.source), accent: "azure" });
  }

  if (body?.starClass) {
    rows.push({ key: "star", label: "STAR", value: body.starClass.value, narrative: null, ...src(body.starClass.source), accent: "amber" });
  }

  // POV: the body the viewpoint lives in.
  if (pov) {
    const r = pov.resolved;
    const base = { source: pov.source, href: pov.href, accent: "magenta" as const };
    if (nativeG !== null) {
      rows.push({ key: "pov.gravity", label: "POV GREW UP AT", value: `${fmt(nativeG)} g`, narrative: narrateNativeGravity(nativeG) || null, ...base });
    }
    if (r.blindTo?.trim()) {
      rows.push({ key: "pov.blind", label: "POV BLIND TO", value: r.blindTo.trim(), narrative: null, ...base });
    }
    if (r.dominantSense?.trim()) {
      rows.push({ key: "pov.sense", label: "POV SENSE", value: r.dominantSense.trim(), narrative: null, ...base });
    }
    const std = parseLeadingNumber(r.ageStandard);
    const loc = parseLeadingNumber(r.ageLocal);
    const ageLine = narrateLocalAge(std, loc);
    if (ageLine && std !== null && loc !== null) {
      rows.push({ key: "pov.age", label: "POV AGE", value: `${fmt(std)} std · ${fmt(loc)} local`, narrative: ageLine, ...base });
    }
  }

  if (input.epoch?.when) {
    rows.push({
      key: "epoch",
      label: "WHEN",
      value: input.epoch.branchName ? `${input.epoch.when} · ${input.epoch.branchName}` : input.epoch.when,
      narrative: null,
      source: "Card",
      href: null,
      accent: "violet",
    });
  }

  return rows.slice(0, MAX_INFLUENCE_ROWS);
}
