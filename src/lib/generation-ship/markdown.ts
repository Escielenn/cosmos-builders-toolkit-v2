// ---------------------------------------------------------------------------
// Generation Ship Designer (Ark): markdown export.
// Pure; the page copies it to the clipboard and the tests read it.
// ---------------------------------------------------------------------------

import { htmlToPlainText } from "@/lib/html-utils";
import type { GenShipFormState, GenShipResults } from "./calculations";
import { DAYS_PER_YEAR } from "./calculations";
import { chronicleYear, type DriftEvent } from "./drift-events";
import { CONSUMABLES_SOURCE, MVP_REFERENCES } from "./data";

export function fmt(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "∞";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function fmtYears(y: number): string {
  if (!Number.isFinite(y)) return "never";
  if (y < 10) return `${fmt(y, 2)} years`;
  return `${fmt(y, 0)} years`;
}

export function buildGenShipMarkdown(
  form: GenShipFormState,
  r: GenShipResults,
  events: DriftEvent[],
  worldName?: string,
): string {
  const name = form.identity.shipName.trim() || "Unnamed generation ship";
  const v = r.voyage;
  const g = r.genetics;
  const ls = r.lifeSupport;
  const h = r.habitat;
  const d = r.drift;
  const lines: string[] = [];

  lines.push(`# ${name}`);
  lines.push(`*Generation ship${worldName ? ` · ${worldName}` : ""}${form.identity.speciesName ? ` · crew: ${form.identity.speciesName}` : ""}*`);
  lines.push("");
  lines.push("## Voyage");
  lines.push(`- Route: ${form.identity.originName || "origin"} → ${form.identity.destinationName || "destination"}, ${fmt(form.voyage.distanceLy, 2)} ly`);
  lines.push(`- Cruise: ${fmt(form.voyage.cruiseFractionC * 100, 3)}% of c${form.voyage.accelG > 0 ? `, boost at ${fmt(form.voyage.accelG, 3)} g` : ", coasting"}`);
  if (v.valid) {
    lines.push(`- Duration: ${fmtYears(v.shipYears)} aboard, ${fmtYears(v.earthYears)} at home (γ ${v.lorentzFactor.toFixed(6)})`);
    lines.push(`- Generations aboard: ${fmt(g.generations, 1)} at ${fmt(form.population.generationYears, 1)} years each`);
  } else {
    lines.push(`- Duration: unresolved (${v.error ?? "check inputs"})`);
  }
  lines.push("");
  lines.push("## Population genetics");
  lines.push(`- Founding population: ${fmt(form.population.founding, 0)}`);
  lines.push(`- Effective population (Ne): ${fmt(g.eff.ne, 0)} (${fmt(g.eff.neOverN * 100, 0)}% of census)`);
  lines.push(`- Inbreeding at arrival (F): ${g.fAtArrival.toFixed(4)}; heterozygosity retained ${fmt(g.heterozygosityRetained * 100, 1)}%`);
  lines.push(`- Ne needed to arrive below first-cousin level (F 0.0625): ${fmt(g.neNeededFirstCousin, 0)}`);
  if (g.bank.enabled) {
    lines.push(`- Frozen bank: ${fmt(form.population.bank.samples, 0)} samples, ${fmt(form.population.bank.contributionPct, 0)}% of births, lasts ${fmt(g.bank.lastsGenerations, 1)} generations`);
  }
  lines.push("- Published minimum populations:");
  for (const ref of MVP_REFERENCES) lines.push(`  - ${ref.label}: ${ref.figure} (${ref.source})`);
  lines.push("");
  lines.push("## Closed loop");
  lines.push(`- Closed-loop efficiency (mass-weighted): ${fmt(ls.closedLoopEfficiency * 100, 2)}%`);
  for (const l of ls.loops) {
    const life = Number.isFinite(l.daysToFailure) ? fmtYears(l.daysToFailure / DAYS_PER_YEAR) : "indefinitely";
    lines.push(`- ${l.label}: ${fmt(l.efficiency * 100, 2)}% recovered, ${fmt(l.makeupKgDay, 1)} kg/day lost, reserves last ${life}${l.failsBeforeArrival ? " — FAILS BEFORE ARRIVAL" : ""}`);
  }
  lines.push(`- Per-capita figures: ${CONSUMABLES_SOURCE}`);
  lines.push("");
  lines.push("## Habitat");
  lines.push(`- ${form.habitat.shape === "cylinder" ? "Cylinder" : "Ring"}: radius ${fmt(form.habitat.radiusM, 0)} m at ${fmt(form.habitat.rpm, 2)} rpm → ${h.rimG.toFixed(2)} g at the rim`);
  lines.push(`- Coriolis on a walker: ${fmt(h.coriolisRatio * 100, 1)}% of local g; head-to-foot gravity drop ${fmt(h.headToFootGradient * 100, 1)}%`);
  lines.push(`- Deck area: ${fmt(h.availableAreaM2, 0)} m² available, ${fmt(h.requiredAreaM2, 0)} m² required (crops ${fmt(h.cropAreaM2, 0)} m²)`);
  lines.push(`- Shielding: ~${fmt(h.shieldMassTonnes, 0)} t at ${fmt(form.habitat.shieldingTPerM2, 1)} t/m²`);
  lines.push("");
  lines.push("## Social drift");
  lines.push(`- Core vocabulary shared with home on arrival: ${fmt(d.sharedCoreVocabulary * 100, 0)}% (glottochronology, contested)`);
  lines.push(`- LexDrift model: ${fmt(d.lexdrift.divergencePct, 0)}% divergence, ${d.lexdrift.severityLabel}`);
  lines.push(`- Last home-born crew member dies: year ${fmt(d.lastHomeBornYears, 0)} of the voyage`);
  lines.push("");
  if (events.length > 0) {
    lines.push("## Drift events");
    for (const e of events) {
      lines.push(`- **${chronicleYear(form.identity.launchYear, e)}** (generation ${e.generation}) — ${e.title}. ${e.description}`);
    }
    lines.push("");
  }
  const life = htmlToPlainText(form.notes.shipboardLife || "").trim();
  const forgotten = htmlToPlainText(form.notes.forgotten || "").trim();
  if (life || forgotten) {
    lines.push("## Shipboard notes");
    if (life) lines.push(life, "");
    if (forgotten) lines.push(`What the ship has forgotten: ${forgotten}`, "");
  }
  return lines.join("\n").trimEnd() + "\n";
}
