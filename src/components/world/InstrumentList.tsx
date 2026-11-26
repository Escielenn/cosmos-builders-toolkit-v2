// ---------------------------------------------------------------------------
// InstrumentList: the Instruments space's list (1.6 finding 18).
//
// It was 31 identical cards in one alphabetical grid. Now the instruments are
// grouped by cascade layer (Physics → Environment → Biology → Psychology →
// Mythology → Culture, then Integration), simulators as their own group, and
// each row carries a glyph, a name, one line of purpose and a FREE/PRO tag.
// The layer comes from the tool's cascade accent (src/lib/tool-accents), so a
// tool's colour and its group can never disagree.
// ---------------------------------------------------------------------------

import { Link } from "react-router-dom";
import { CalendarClock, Wrench } from "lucide-react";
import { getToolIcon } from "@/components/icons/tool-icons";
import { getToolAccent, type ToolAccent } from "@/lib/tool-accents";
import { cn } from "@/lib/utils";

export interface InstrumentItem {
  id: string;
  name: string;
  href: string;
  isSim: boolean;
  isPro: boolean;
}

export type InstrumentGroupId =
  | "physics"
  | "environment"
  | "biology"
  | "psychology"
  | "mythology"
  | "culture"
  | "integration"
  | "simulators";

/** Group order and labels. The square beside each label is the layer hue. */
export const INSTRUMENT_GROUPS: { id: InstrumentGroupId; label: string; swatch: string }[] = [
  { id: "physics", label: "Physics", swatch: "bg-sf-amber" },
  { id: "environment", label: "Environment", swatch: "bg-sf-azure" },
  { id: "biology", label: "Biology", swatch: "bg-sf-emerald" },
  { id: "psychology", label: "Psychology", swatch: "bg-sf-magenta" },
  { id: "mythology", label: "Mythology", swatch: "bg-sf-stellar" },
  { id: "culture", label: "Culture", swatch: "bg-sf-violet" },
  { id: "integration", label: "Integration", swatch: "bg-sf-teal" },
  { id: "simulators", label: "Simulators", swatch: "bg-sf-primary" },
];

const ACCENT_GROUP: Record<ToolAccent, InstrumentGroupId> = {
  amber: "physics",
  azure: "environment",
  emerald: "biology",
  magenta: "psychology",
  stellar: "mythology",
  violet: "culture",
  teal: "integration",
  crimson: "integration",
};

/** Tools whose accent falls back to teal but whose subject is clearly a layer. */
const GROUP_OVERRIDES: Record<string, InstrumentGroupId> = {
  "stellar-cartographer": "physics",
};

export function instrumentGroup(id: string, isSim: boolean): InstrumentGroupId {
  if (isSim) return "simulators";
  return GROUP_OVERRIDES[id] ?? ACCENT_GROUP[getToolAccent(id)];
}

/** One line of purpose per instrument. */
export const INSTRUMENT_PURPOSE: Record<string, string> = {
  "environmental-chain-reaction": "Trace one planetary parameter down the whole cascade.",
  "spacecraft-designer": "Lived-in ships with history, wear and culture aboard.",
  "propulsion-consequences-map": "What a drive technology does to the society that flies it.",
  "planetary-profile": "Star, mass, atmosphere and habitability of a world.",
  "space-expansion-modeler": "The forces that shape expansion beyond the home world.",
  "drake-equation-calculator": "How many civilizations share the galaxy.",
  "xenomythology-framework-builder": "Myths that grow out of a species' biology.",
  "evolutionary-biology": "Plausible species from evolutionary pressures.",
  "star-system-builder": "Multi-planet systems and their orbital mechanics.",
  "empire-designer": "Governance, power structures and internal factions.",
  "technology-consequences": "How a technology cascades through society and culture.",
  "species-interaction-matrix": "Relationships between the species that share a world.",
  "one-big-lie": "Declare the one physics violation and trace its cost.",
  "time-dilation": "Relativistic time for interstellar journeys.",
  "habitable-zone-calculator": "Habitable zone boundaries for any star.",
  lexdrift: "How languages drift across distance and generations.",
  "surface-gravity-calculator": "Surface gravity, and how weight shapes a world.",
  timeline: "Events across deep time on multiple tracks.",
  sensorium: "Senses evolved for this world's light, sound and chemistry.",
  gravitas: "Gravity on ships, habitats and surfaces.",
  "kardashev-scale": "Classify a civilization by the energy it commands.",
  dossier: "Characters who inherit their bodies and beliefs from the world.",
  "generation-ship": "Crew genetics, life support and spin for a long voyage.",
  rogue: "Wandering objects passing through a system.",
  tidelock: "A tidally locked world, day side to night side.",
  exosky: "The night sky from any exoplanet, with your own constellations.",
  exoforge: "Forge an exoplanet procedurally and inspect it.",
  solaris: "A procedural star system in motion.",
  "stellar-cartographer": "Galaxies, territories, trade routes and wormholes.",
  "surface-cartographer": "Maps of planets and moons.",
  "writing-workshop": "Prompts that start a scene from the world's facts.",
  "time-travel-timelines": "Branching timelines and jumps, as a Chronicle view.",
};

function Glyph({ id }: { id: string }): JSX.Element {
  const Icon = getToolIcon(id);
  if (Icon) return <Icon className="h-8 w-8 shrink-0 rounded-none" />;
  const Fallback = id === "time-travel-timelines" ? CalendarClock : Wrench;
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-sf-line">
      <Fallback className="h-4 w-4 text-t3" aria-hidden />
    </span>
  );
}

function AccessTag({ pro, label }: { pro: boolean; label?: string }): JSX.Element {
  return (
    <span
      className={cn(
        "shrink-0 rounded-sf-tag border px-1.5 font-mono text-[12px] uppercase",
        pro ? "border-sf-line text-t3" : "border-sf-primary text-sf-primary-text",
      )}
    >
      {label ?? (pro ? "Pro" : "Free")}
    </span>
  );
}

function splitName(name: string): { brand: string; rest: string | null } {
  const i = name.indexOf(": ");
  return i === -1 ? { brand: name, rest: null } : { brand: name.slice(0, i), rest: name.slice(i + 2) };
}

export function InstrumentRow({
  item,
  subjectName,
  tagLabel,
}: {
  item: InstrumentItem;
  subjectName?: string | null;
  tagLabel?: string;
}): JSX.Element {
  const { brand, rest } = splitName(item.name);
  const purpose = INSTRUMENT_PURPOSE[item.id];
  return (
    <li>
      <Link
        to={item.href}
        className="group flex min-h-[56px] items-center gap-3 border-l-2 border-transparent px-3 py-2 transition-colors duration-base hover:border-sf-primary-bright hover:bg-sf-surface"
      >
        <Glyph id={item.id} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate font-sans text-[15px] font-medium text-t1">{brand}</span>
            {rest && <span className="hidden truncate font-sans text-[14px] text-t3 sm:inline">{rest}</span>}
          </span>
          {purpose && <span className="block truncate font-sans text-[14px] text-t2">{purpose}</span>}
          {subjectName && (
            <span className="block truncate font-mono text-[12px] uppercase text-t4">on {subjectName}</span>
          )}
        </span>
        <AccessTag pro={item.isPro} label={tagLabel} />
      </Link>
    </li>
  );
}

export function InstrumentGroup({
  id,
  label,
  swatch,
  count,
  children,
}: {
  id: string;
  label: string;
  swatch: string;
  count: number;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section aria-labelledby={`instruments-${id}`} className="mt-8 first:mt-6">
      <h2
        id={`instruments-${id}`}
        className="mb-1 flex items-center gap-2 border-b border-sf-line-hairline pb-2 font-heading text-sf-eyebrow uppercase text-t4"
      >
        <span className={cn("h-2 w-2", swatch)} aria-hidden />
        {label}
        <span className="font-mono text-[12px] text-t4">{count}</span>
      </h2>
      <ul className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">{children}</ul>
    </section>
  );
}
