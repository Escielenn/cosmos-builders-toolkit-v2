/**
 * use-upstream-context — Fetches upstream worksheet data for the current tool
 * and generates contextual callout messages.
 *
 * When a tool loads inside a world, this hook checks for worksheets from
 * upstream cascade layers and surfaces 1-2 relevant notes that help the user
 * connect their existing worldbuilding to the current task.
 *
 * Cascade order: environment → biology → psychology → culture → mythology → technology → narrative
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  getLayerForTool,
  LAYER_ORDER,
  LAYER_TOOL_MAP,
  type CascadeLayer,
} from "@/services/world-data";
import {
  TOOL_DISPLAY_NAMES,
} from "@/lib/worksheet-links-config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpstreamCallout {
  /** Human-readable contextual message */
  message: string;
  /** Tool slug that the data comes from, e.g. "planetary-profile" */
  sourceToolType: string;
  /** Branded display name, e.g. "Genesis" */
  sourceBrandName: string;
}

// ---------------------------------------------------------------------------
// Helpers — safe nested field access
// ---------------------------------------------------------------------------

function getField(data: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let val: unknown = data;
  for (const part of parts) {
    if (val && typeof val === "object" && part in (val as Record<string, unknown>)) {
      val = (val as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return val;
}

/** Format a value for display — stringify objects/arrays simply */
function display(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.filter(Boolean).join(", ");
  return String(val);
}

// ---------------------------------------------------------------------------
// Field mapping: tool-specific upstream callout generators
// ---------------------------------------------------------------------------

type CalloutGenerator = (
  upstreamWorksheets: Array<{ tool_type: string; data: Record<string, unknown>; title: string | null }>,
) => UpstreamCallout[];

/**
 * Find the most recent worksheet of a given tool type from the list.
 */
function findWorksheet(
  worksheets: Array<{ tool_type: string; data: Record<string, unknown>; title: string | null }>,
  toolType: string,
) {
  return worksheets.find((w) => w.tool_type === toolType);
}

// ── Phylo (Evolutionary Biology) ──────────────────────────────────────────

const phyloCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const planet = findWorksheet(ws, "planetary-profile");
  if (planet) {
    const gravity = getField(planet.data, "physicalCharacteristics.surfaceGravity");
    const temp = getField(planet.data, "temperatureProfile.averageSurfaceTemp");
    const atmo = getField(planet.data, "atmosphericComposition.primaryGases");

    const parts: string[] = [];
    if (gravity) parts.push(`${display(gravity)}g gravity`);
    if (temp) parts.push(`${display(temp)} average temperature`);
    if (atmo) parts.push(`${display(atmo)} atmosphere`);

    if (parts.length > 0) {
      callouts.push({
        message: `Your world has ${parts.join(" and ")}. Consider how these constrain body plans and locomotion.`,
        sourceToolType: "planetary-profile",
        sourceBrandName: TOOL_DISPLAY_NAMES["planetary-profile"] ?? "Genesis",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Dominion (Empire Designer) ────────────────────────────────────────────

const dominionCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const evoBio = findWorksheet(ws, "evolutionary-biology");
  if (evoBio) {
    const speciesName = getField(evoBio.data, "speciesName");
    const socialStructure = getField(evoBio.data, "social.socialStructure");

    if (speciesName || socialStructure) {
      const parts: string[] = [];
      if (speciesName) parts.push(`species "${display(speciesName)}"`);
      if (socialStructure) parts.push(`${display(socialStructure)} social structure`);
      callouts.push({
        message: `Your world has ${parts.join(" with ")} from Phylo. Consider how their biology shapes political structures.`,
        sourceToolType: "evolutionary-biology",
        sourceBrandName: TOOL_DISPLAY_NAMES["evolutionary-biology"] ?? "Phylo",
      });
    }
  }

  const planet = findWorksheet(ws, "planetary-profile");
  if (planet && callouts.length < 2) {
    const gravity = getField(planet.data, "physicalCharacteristics.surfaceGravity");
    if (gravity) {
      callouts.push({
        message: `Genesis data shows ${display(gravity)}g surface gravity. High or low gravity shapes architecture, transport, and power projection.`,
        sourceToolType: "planetary-profile",
        sourceBrandName: TOOL_DISPLAY_NAMES["planetary-profile"] ?? "Genesis",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Mythos (Xenomythology) ────────────────────────────────────────────────

const mythosCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const planet = findWorksheet(ws, "planetary-profile");
  if (planet) {
    const starType = getField(planet.data, "stellarEnvironment.starType");
    const dayLength = getField(planet.data, "physicalCharacteristics.dayLength");
    const features: string[] = [];
    if (starType) features.push(`${display(starType)} star`);
    if (dayLength) features.push(`${display(dayLength)} day cycle`);

    if (features.length > 0) {
      callouts.push({
        message: `Your world's ${features.join(" and ")} would shape how inhabitants perceive the sacred and mark ritual time.`,
        sourceToolType: "planetary-profile",
        sourceBrandName: TOOL_DISPLAY_NAMES["planetary-profile"] ?? "Genesis",
      });
    }
  }

  const evoBio = findWorksheet(ws, "evolutionary-biology");
  if (evoBio && callouts.length < 2) {
    const senses = getField(evoBio.data, "sensory.primarySenses");
    const cognition = getField(evoBio.data, "cognition.cognitionType");
    const parts: string[] = [];
    if (senses) parts.push(`${display(senses)} sensory system`);
    if (cognition) parts.push(`${display(cognition)} cognition`);

    if (parts.length > 0) {
      callouts.push({
        message: `Phylo data shows ${parts.join(" and ")}. These shape which metaphors and symbols feel sacred to this species.`,
        sourceToolType: "evolutionary-biology",
        sourceBrandName: TOOL_DISPLAY_NAMES["evolutionary-biology"] ?? "Phylo",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Atlas (Surface Gravity Calculator) ────────────────────────────────────

const atlasCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const planet = findWorksheet(ws, "planetary-profile");
  if (planet) {
    const mass = getField(planet.data, "physicalCharacteristics.planetaryMass");
    const radius = getField(planet.data, "physicalCharacteristics.planetaryRadius");

    const parts: string[] = [];
    if (mass) parts.push(`mass: ${display(mass)} Earth masses`);
    if (radius) parts.push(`radius: ${display(radius)} Earth radii`);

    if (parts.length > 0) {
      callouts.push({
        message: `Genesis data shows ${parts.join(", ")}. These values can seed your gravity calculation.`,
        sourceToolType: "planetary-profile",
        sourceBrandName: TOOL_DISPLAY_NAMES["planetary-profile"] ?? "Genesis",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Sensorium ─────────────────────────────────────────────────────────────

const sensoriumCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const planet = findWorksheet(ws, "planetary-profile");
  if (planet) {
    const atmo = getField(planet.data, "atmosphericComposition.primaryGases");
    const pressure = getField(planet.data, "atmosphericComposition.atmosphericPressure");
    const water = getField(planet.data, "hydrosphere.waterPresence");

    const parts: string[] = [];
    if (atmo) parts.push(display(atmo));
    if (pressure) parts.push(`${display(pressure)} pressure`);
    if (water) parts.push(`${display(water)} water presence`);

    if (parts.length > 0) {
      callouts.push({
        message: `Your planet's ${parts.join(", ")} affects what sensory modalities are viable for life.`,
        sourceToolType: "planetary-profile",
        sourceBrandName: TOOL_DISPLAY_NAMES["planetary-profile"] ?? "Genesis",
      });
    }
  }

  const evoBio = findWorksheet(ws, "evolutionary-biology");
  if (evoBio && callouts.length < 2) {
    const speciesName = getField(evoBio.data, "speciesName");
    const primarySenses = getField(evoBio.data, "sensory.primarySenses");
    if (speciesName || primarySenses) {
      const parts: string[] = [];
      if (speciesName) parts.push(`"${display(speciesName)}"`);
      if (primarySenses) parts.push(`primary senses: ${display(primarySenses)}`);
      callouts.push({
        message: `Phylo data${speciesName ? ` for ${parts[0]}` : ""} shows ${parts.slice(speciesName ? 1 : 0).join(", ")}. Use these as a starting point.`,
        sourceToolType: "evolutionary-biology",
        sourceBrandName: TOOL_DISPLAY_NAMES["evolutionary-biology"] ?? "Phylo",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Goldilocks (Habitable Zone Calculator) ────────────────────────────────

const goldilocksCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const star = findWorksheet(ws, "star-system-builder");
  if (star) {
    const spectralClass = getField(star.data, "star.spectralClass");
    const luminosity = getField(star.data, "star.luminosity");
    const parts: string[] = [];
    if (spectralClass) parts.push(`${display(spectralClass)} spectral class`);
    if (luminosity) parts.push(`luminosity ${display(luminosity)}`);

    if (parts.length > 0) {
      callouts.push({
        message: `Orrery data shows a ${parts.join(" with ")} star. These drive your habitable zone boundaries.`,
        sourceToolType: "star-system-builder",
        sourceBrandName: TOOL_DISPLAY_NAMES["star-system-builder"] ?? "Orrery",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Paradigm (Technology Consequences) ────────────────────────────────────

const paradigmCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const evoBio = findWorksheet(ws, "evolutionary-biology");
  if (evoBio) {
    const speciesName = getField(evoBio.data, "speciesName");
    const cognition = getField(evoBio.data, "cognition.cognitionType");
    if (speciesName || cognition) {
      const parts: string[] = [];
      if (speciesName) parts.push(`species "${display(speciesName)}"`);
      if (cognition) parts.push(`${display(cognition)} cognition`);
      callouts.push({
        message: `Phylo data shows ${parts.join(" with ")}. Cognitive architecture shapes which technologies are even conceivable.`,
        sourceToolType: "evolutionary-biology",
        sourceBrandName: TOOL_DISPLAY_NAMES["evolutionary-biology"] ?? "Phylo",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Cascade (Environmental Chain Reaction) ────────────────────────────────

const cascadeCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const planet = findWorksheet(ws, "planetary-profile");
  if (planet) {
    const starType = getField(planet.data, "stellarEnvironment.starType");
    const gravity = getField(planet.data, "physicalCharacteristics.surfaceGravity");
    const temp = getField(planet.data, "temperatureProfile.averageSurfaceTemp");
    const parts: string[] = [];
    if (starType) parts.push(`${display(starType)} star`);
    if (gravity) parts.push(`${display(gravity)}g gravity`);
    if (temp) parts.push(`${display(temp)} surface temp`);

    if (parts.length > 0) {
      callouts.push({
        message: `Genesis data: ${parts.join(", ")}. Pick a parameter above to trace its cascade effects.`,
        sourceToolType: "planetary-profile",
        sourceBrandName: TOOL_DISPLAY_NAMES["planetary-profile"] ?? "Genesis",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Vessel (Spacecraft Designer) ──────────────────────────────────────────

const vesselCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const propulsion = findWorksheet(ws, "propulsion-consequences-map");
  if (propulsion) {
    const propType = getField(propulsion.data, "propulsionType");
    const maxVelocity = getField(propulsion.data, "maxVelocity");
    const parts: string[] = [];
    if (propType) parts.push(display(propType));
    if (maxVelocity) parts.push(`max velocity: ${display(maxVelocity)}`);

    if (parts.length > 0) {
      callouts.push({
        message: `Impulse data: ${parts.join(", ")}. Your drive system shapes everything from hull geometry to crew psychology.`,
        sourceToolType: "propulsion-consequences-map",
        sourceBrandName: TOOL_DISPLAY_NAMES["propulsion-consequences-map"] ?? "Impulse",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Exodus (Space Expansion Modeler) ──────────────────────────────────────

const exodusCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const empire = findWorksheet(ws, "empire-designer");
  if (empire) {
    const name = getField(empire.data, "foundation.name");
    const govType = getField(empire.data, "foundation.governmentType");
    const parts: string[] = [];
    if (name) parts.push(`"${display(name)}"`);
    if (govType) parts.push(`${display(govType)} government`);

    if (parts.length > 0) {
      callouts.push({
        message: `Dominion data: ${parts.join(" — ")}. Political structure drives expansion motives and methods.`,
        sourceToolType: "empire-designer",
        sourceBrandName: TOOL_DISPLAY_NAMES["empire-designer"] ?? "Dominion",
      });
    }
  }

  const propulsion = findWorksheet(ws, "propulsion-consequences-map");
  if (propulsion && callouts.length < 2) {
    const propType = getField(propulsion.data, "propulsionType");
    if (propType) {
      callouts.push({
        message: `Impulse data: ${display(propType)} propulsion. Drive type constrains expansion speed and colony viability.`,
        sourceToolType: "propulsion-consequences-map",
        sourceBrandName: TOOL_DISPLAY_NAMES["propulsion-consequences-map"] ?? "Impulse",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Gravitas ──────────────────────────────────────────────────────────────

const gravitasCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const planet = findWorksheet(ws, "planetary-profile");
  if (planet) {
    const gravity = getField(planet.data, "physicalCharacteristics.surfaceGravity");
    const mass = getField(planet.data, "physicalCharacteristics.planetaryMass");
    const parts: string[] = [];
    if (gravity) parts.push(`${display(gravity)}g surface gravity`);
    if (mass) parts.push(`${display(mass)} Earth masses`);

    if (parts.length > 0) {
      callouts.push({
        message: `Genesis data: ${parts.join(", ")}. Use as a reference for habitat and spacecraft gravity comparisons.`,
        sourceToolType: "planetary-profile",
        sourceBrandName: TOOL_DISPLAY_NAMES["planetary-profile"] ?? "Genesis",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Paradox (Time Dilation) ───────────────────────────────────────────────

const paradoxCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const propulsion = findWorksheet(ws, "propulsion-consequences-map");
  if (propulsion) {
    const propType = getField(propulsion.data, "propulsionType");
    const maxVelocity = getField(propulsion.data, "maxVelocity");
    const parts: string[] = [];
    if (propType) parts.push(display(propType));
    if (maxVelocity) parts.push(`max velocity: ${display(maxVelocity)}`);

    if (parts.length > 0) {
      callouts.push({
        message: `Impulse data: ${parts.join(", ")}. Velocity ceiling determines your dilation envelope.`,
        sourceToolType: "propulsion-consequences-map",
        sourceBrandName: TOOL_DISPLAY_NAMES["propulsion-consequences-map"] ?? "Impulse",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Lexdrift ──────────────────────────────────────────────────────────────

const lexdriftCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const empire = findWorksheet(ws, "empire-designer");
  if (empire) {
    const name = getField(empire.data, "foundation.name");
    if (name) {
      callouts.push({
        message: `Dominion data: "${display(name)}". Political fragmentation and contact patterns shape linguistic drift.`,
        sourceToolType: "empire-designer",
        sourceBrandName: TOOL_DISPLAY_NAMES["empire-designer"] ?? "Dominion",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ── Symbiosis (Species Interaction Matrix) ────────────────────────────────

const symbiosisCallouts: CalloutGenerator = (ws) => {
  const callouts: UpstreamCallout[] = [];
  const evoBio = findWorksheet(ws, "evolutionary-biology");
  if (evoBio) {
    const speciesName = getField(evoBio.data, "speciesName");
    if (speciesName) {
      callouts.push({
        message: `Phylo data: species "${display(speciesName)}". Define how this species interacts with others in the ecosystem.`,
        sourceToolType: "evolutionary-biology",
        sourceBrandName: TOOL_DISPLAY_NAMES["evolutionary-biology"] ?? "Phylo",
      });
    }
  }

  const planet = findWorksheet(ws, "planetary-profile");
  if (planet && callouts.length < 2) {
    const temp = getField(planet.data, "temperatureProfile.averageSurfaceTemp");
    const atmo = getField(planet.data, "atmosphericComposition.primaryGases");
    const parts: string[] = [];
    if (temp) parts.push(`${display(temp)} average temperature`);
    if (atmo) parts.push(`${display(atmo)} atmosphere`);

    if (parts.length > 0) {
      callouts.push({
        message: `Genesis: ${parts.join(", ")}. Environmental context constrains which ecological niches exist.`,
        sourceToolType: "planetary-profile",
        sourceBrandName: TOOL_DISPLAY_NAMES["planetary-profile"] ?? "Genesis",
      });
    }
  }
  return callouts.slice(0, 2);
};

// ---------------------------------------------------------------------------
// Registry: toolType → specific generator
// ---------------------------------------------------------------------------

const TOOL_CALLOUT_GENERATORS: Record<string, CalloutGenerator> = {
  "evolutionary-biology": phyloCallouts,
  "empire-designer": dominionCallouts,
  "xenomythology-framework-builder": mythosCallouts,
  "surface-gravity-calculator": atlasCallouts,
  "sensorium": sensoriumCallouts,
  "habitable-zone-calculator": goldilocksCallouts,
  "technology-consequences": paradigmCallouts,
  "environmental-chain-reaction": cascadeCallouts,
  "spacecraft-designer": vesselCallouts,
  "space-expansion-modeler": exodusCallouts,
  "gravitas": gravitasCallouts,
  "time-dilation": paradoxCallouts,
  "lexdrift": lexdriftCallouts,
  "species-interaction-matrix": symbiosisCallouts,
};

// ---------------------------------------------------------------------------
// Generic fallback: "You have N worksheets in the X layer"
// ---------------------------------------------------------------------------

function genericCallouts(
  toolType: string,
  upstreamWorksheets: Array<{ tool_type: string; data: Record<string, unknown>; title: string | null }>,
): UpstreamCallout[] {
  const currentLayer = getLayerForTool(toolType);
  const currentLayerIndex = LAYER_ORDER.indexOf(currentLayer);
  if (currentLayerIndex <= 0) return []; // nothing upstream

  const callouts: UpstreamCallout[] = [];

  // Group worksheets by their layer
  const layerCounts = new Map<CascadeLayer, number>();
  for (const ws of upstreamWorksheets) {
    const wsLayer = getLayerForTool(ws.tool_type);
    const wsLayerIndex = LAYER_ORDER.indexOf(wsLayer);
    if (wsLayerIndex < currentLayerIndex) {
      layerCounts.set(wsLayer, (layerCounts.get(wsLayer) ?? 0) + 1);
    }
  }

  // Generate up to 2 messages for the closest upstream layers
  const upstreamLayers = Array.from(layerCounts.entries())
    .sort(([a], [b]) => LAYER_ORDER.indexOf(b) - LAYER_ORDER.indexOf(a)); // closest first

  const LAYER_LABELS: Record<string, string> = {
    environment: "Environment",
    biology: "Biology",
    psychology: "Psychology",
    culture: "Culture",
    mythology: "Mythology",
    technology: "Technology",
    narrative: "Narrative",
  };

  for (const [layer, count] of upstreamLayers.slice(0, 2)) {
    callouts.push({
      message: `You have ${count} worksheet${count !== 1 ? "s" : ""} in the ${LAYER_LABELS[layer] ?? layer} layer that inform this tool.`,
      sourceToolType: upstreamWorksheets.find(
        (w) => getLayerForTool(w.tool_type) === layer,
      )?.tool_type ?? toolType,
      sourceBrandName: LAYER_LABELS[layer] ?? layer,
    });
  }

  return callouts.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Determine which tool types are upstream of a given tool
// ---------------------------------------------------------------------------

function getUpstreamToolTypes(toolType: string): string[] {
  const currentLayer = getLayerForTool(toolType);
  const currentIndex = LAYER_ORDER.indexOf(currentLayer);
  if (currentIndex <= 0) return [];

  const upstreamTools: string[] = [];
  for (let i = 0; i < currentIndex; i++) {
    const layer = LAYER_ORDER[i];
    const tools = LAYER_TOOL_MAP[layer] ?? [];
    upstreamTools.push(...tools);
  }

  // Also include tools from the same layer (peer tools can inform each other)
  const sameLayerTools = LAYER_TOOL_MAP[currentLayer] ?? [];
  for (const t of sameLayerTools) {
    if (t !== toolType) {
      upstreamTools.push(t);
    }
  }

  return upstreamTools;
}

// ---------------------------------------------------------------------------
// Main hook
// ---------------------------------------------------------------------------

export function useUpstreamContext(
  toolType: string,
  worldId: string | null,
): {
  callouts: UpstreamCallout[];
  isLoading: boolean;
} {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["upstream-context", worldId, toolType],
    queryFn: async (): Promise<UpstreamCallout[]> => {
      if (!worldId) return [];

      const upstreamToolTypes = getUpstreamToolTypes(toolType);
      if (upstreamToolTypes.length === 0) return [];

      // Fetch all upstream worksheets for this world in a single query
      const { data, error } = await supabase
        .from("worksheets")
        .select("tool_type, data, title")
        .eq("world_id", worldId)
        .in("tool_type", upstreamToolTypes)
        .is("archived_at", null)
        .order("updated_at", { ascending: false });

      if (error || !data || data.length === 0) return [];

      // Normalize worksheet data
      const worksheets = data.map((row) => ({
        tool_type: row.tool_type,
        data: (row.data as Record<string, unknown>) ?? {},
        title: row.title,
      }));

      // Try tool-specific generator first
      const generator = TOOL_CALLOUT_GENERATORS[toolType];
      if (generator) {
        const specific = generator(worksheets);
        if (specific.length > 0) return specific;
      }

      // Fall back to generic upstream count
      return genericCallouts(toolType, worksheets);
    },
    enabled: !!user && !!worldId && !!toolType,
    staleTime: 5 * 60 * 1000, // 5 min — upstream data changes rarely
    refetchOnWindowFocus: false,
  });

  return {
    callouts: query.data ?? [],
    isLoading: query.isLoading,
  };
}
