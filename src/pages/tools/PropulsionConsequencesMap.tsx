import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { useSearchParams } from "react-router-dom";
import { Info, ExternalLink, Atom, FileText, ChevronDown, Image as ImageIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useWorksheets, useWorksheet, useWorksheetsByType, useRenameWorksheet } from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import SectionNavigation, { Section, MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, { KeyChoicesSection, MobileKeyChoices } from "@/components/tools/KeyChoicesSidebar";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import QuestionSection from "@/components/tools/QuestionSection";
import ShareDialog from "@/components/sharing/ShareDialog";
import { useWorksheetShare } from "@/hooks/use-sharing";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { WorksheetNotesSheet } from "@/components/tools/WorksheetNotesSheet";
import { WorksheetMoodboardSheet } from "@/components/tools/WorksheetMoodboardSheet";
import { PropulsionSummaryTemplate, PropulsionFullReportTemplate } from "@/lib/pdf/templates";
import { useWorlds } from "@/hooks/use-worlds";
import { useEntityMatch } from "@/hooks/use-entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import { Json } from "@/integrations/supabase/types";

// Section definitions for navigation
const SECTIONS: Section[] = [
  { id: "section-propulsion", title: "1. Define Propulsion" },
  { id: "section-economic", title: "2. Economic" },
  { id: "section-political", title: "3. Political" },
  { id: "section-military", title: "4. Military" },
  { id: "section-social", title: "5. Social" },
  { id: "section-psychological", title: "6. Psychological" },
  { id: "section-integration", title: "7. Integration" },
  { id: "section-examples", title: "SF Examples" },
  { id: "section-synthesis", title: "Final Synthesis" },
];

// Types for form state
interface PropulsionSystem {
  type: string;
  customType: string;
  maxVelocity: string;
  acceleration: string;
  energySource: string;
  communicationSpeed: string;
  costComparison: string;
}

interface TravelBenchmark {
  earthMars: string;
  earthJupiter: string;
  earthNeptune: string;
  solAlphaCentauri: string;
  solProximaB: string;
  customRoute: string;
  customRouteTime: string;
}

interface EconomicCosts {
  fuelEnergy: string;
  construction: string;
  maintenance: string;
  crewCapacity: string;
  cargoCapacity: string;
  serviceLife: string;
}

interface DomainResponses {
  [key: string]: string | string[];
}

interface FormState {
  system: PropulsionSystem;
  benchmarks: TravelBenchmark;
  costs: EconomicCosts;
  economic: DomainResponses;
  political: DomainResponses;
  military: DomainResponses;
  social: DomainResponses;
  psychological: DomainResponses;
  synthesis: {
    consistencyChecks: string[];
    inconsistency: string;
    unexpectedConsequences: string;
    economicConflicts: string;
    politicalConflicts: string;
    socialConflicts: string;
    propulsionThesis: string;
    mostImportant: string;
    storyConflict: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const initialFormState: FormState = {
  system: {
    type: "",
    customType: "",
    maxVelocity: "",
    acceleration: "",
    energySource: "",
    communicationSpeed: "",
    costComparison: "",
  },
  benchmarks: {
    earthMars: "",
    earthJupiter: "",
    earthNeptune: "",
    solAlphaCentauri: "",
    solProximaB: "",
    customRoute: "",
    customRouteTime: "",
  },
  costs: {
    fuelEnergy: "",
    construction: "",
    maintenance: "",
    crewCapacity: "",
    cargoCapacity: "",
    serviceLife: "",
  },
  economic: {},
  political: {},
  military: {},
  social: {},
  psychological: {},
  synthesis: {
    consistencyChecks: [],
    inconsistency: "",
    unexpectedConsequences: "",
    economicConflicts: "",
    politicalConflicts: "",
    socialConflicts: "",
    propulsionThesis: "",
    mostImportant: "",
    storyConflict: "",
  },
  generalNotes: "",
  moodboard: [],
};

const PROPULSION_TYPES = [
  { value: "chemical", label: "Chemical rockets", description: "Current technology" },
  { value: "ion", label: "Ion drives", description: "Proven, slow acceleration" },
  { value: "nuclear-thermal", label: "Nuclear thermal", description: "High thrust, tested 1960s-70s" },
  { value: "nuclear-pulse", label: "Nuclear pulse", description: "Orion-style, requires bombs" },
  { value: "fusion", label: "Fusion drive", description: "Theoretical, high efficiency" },
  { value: "antimatter", label: "Antimatter", description: "Theoretical, enormous energy" },
  { value: "solar-sail", label: "Solar/laser sails", description: "Continuous low thrust" },
  { value: "bussard", label: "Bussard ramjet", description: "Theoretical hydrogen scoop" },
  { value: "alcubierre", label: "Alcubierre warp drive", description: "Speculative FTL" },
  { value: "hyperspace", label: "Hyperspace/jump drive", description: "Speculative FTL" },
  { value: "wormhole", label: "Wormholes/portals", description: "Speculative instant travel" },
  { value: "generation", label: "Generation ships", description: "Subluminal, multi-century" },
  { value: "other", label: "Other", description: "Custom propulsion system" },
];

const ENERGY_SOURCES = [
  { value: "chemical", label: "Chemical combustion" },
  { value: "fission", label: "Nuclear fission" },
  { value: "fusion", label: "Nuclear fusion" },
  { value: "antimatter", label: "Matter-antimatter annihilation" },
  { value: "zero-point", label: "Zero-point energy" },
  { value: "other", label: "Other" },
];

const COST_COMPARISONS = [
  { value: "cheap", label: "Cheaper than air travel", description: "Democratized" },
  { value: "air", label: "Like air travel", description: "Middle class accessible" },
  { value: "private-jet", label: "Like private jet", description: "Wealthy only" },
  { value: "government", label: "Like space program", description: "Governments/corporations only" },
  { value: "ruinous", label: "Ruinously expensive", description: "Rare, desperate journeys" },
];

const ACCESS_STRATIFICATIONS = [
  { id: "universal", label: "Universal access", description: "Everyone can afford travel (cheap/subsidized)" },
  { id: "middle", label: "Middle class & up", description: "Like modern air travel—affordable but significant expense" },
  { id: "elite", label: "Elite only", description: "Wealthy individuals, corporations, governments" },
  { id: "state", label: "State monopoly", description: "Only government-authorized travel" },
  { id: "corporate", label: "Corporate control", description: "Companies own all ships, control access" },
];

const TRADE_VIABILITY = [
  { id: "high-value", label: "High-value, low-mass goods only", description: "Data, rare elements, luxury items" },
  { id: "specialized", label: "Specialized products unavailable locally", description: "Unique biosphere products" },
  { id: "bulk", label: "Bulk commodities viable", description: "Food, raw materials" },
  { id: "people", label: "People as cargo", description: "Labor migration, colonists" },
  { id: "information", label: "Information only", description: "If FTL communication exists" },
];

const GOVERNANCE_STRUCTURES = [
  { id: "empire", label: "Centralized Empire", description: "Fast travel/communication enables tight control", example: "Star Wars (hyperspace), Star Trek (warp drive)" },
  { id: "feudal", label: "Feudal/Autonomous Systems", description: "Slow travel creates independent fiefdoms", example: "Foundation series, Dune's Great Houses" },
  { id: "corporate", label: "Corporate States", description: "Expensive travel means corporations control access", example: "Alien franchise (Weyland-Yutani), The Expanse" },
  { id: "confederation", label: "Loose Confederation", description: "Worlds coordinate but remain independent", example: "Firefly's Alliance, Ancillary Justice" },
  { id: "isolated", label: "Isolated Settlements", description: "No effective governance beyond local", example: "Revelation Space, Aurora" },
];

const MILITARY_STRUCTURES = [
  { id: "large-fleets", label: "Large fleets", description: "If travel is fast/cheap" },
  { id: "system-defense", label: "System defense forces", description: "If travel is slow/expensive" },
  { id: "q-ships", label: "Q-ships/raiders", description: "If identification is difficult" },
  { id: "privateers", label: "Privateers/mercenaries", description: "If state control is weak" },
];

const EXTERNAL_RESOURCES = [
  { name: "Atomic Rockets", url: "http://www.projectrho.com/public_html/rocket/", description: "Comprehensive propulsion encyclopedia" },
  { name: "Relativistic Travel Calculator", url: "https://www.omnicalculator.com/physics/time-dilation", description: "Time dilation effects" },
  { name: "NASA Technology Roadmaps", url: "https://www.nasa.gov/general/nasa-technology-taxonomy/", description: "Current and near-future propulsion" },
];

// --- Travel time calculation engine ---

const FTL_TYPES = ["alcubierre", "hyperspace", "wormhole"];

const BENCHMARK_ROUTES: {
  key: keyof TravelBenchmark;
  label: string;
  minAU: number;
  maxAU: number;
  distanceLabel: string;
}[] = [
  { key: "earthMars", label: "Earth → Mars", minAU: 0.52, maxAU: 2.52, distanceLabel: "0.5–2.5 AU" },
  { key: "earthJupiter", label: "Earth → Jupiter", minAU: 3.93, maxAU: 6.47, distanceLabel: "4–6.5 AU" },
  { key: "earthNeptune", label: "Earth → Neptune", minAU: 28.7, maxAU: 31.3, distanceLabel: "~30 AU" },
  { key: "solAlphaCentauri", label: "Sol → Alpha Centauri", minAU: 276364, maxAU: 276364, distanceLabel: "4.37 ly" },
  { key: "solProximaB", label: "Sol → Proxima b", minAU: 268132, maxAU: 268132, distanceLabel: "4.24 ly" },
];

const AU_TO_KM = 149_597_870.7;
const C_KM_S = 299_792.458;
const G_TO_KM_S2 = 9.81e-3;

function parseNumericValue(text: string): number | null {
  if (!text) return null;
  const match = text.match(/[\d.]+/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) || num <= 0 ? null : num;
}

function calcTravelTimeSeconds(
  distanceAU: number,
  velocityPercentC: number,
  accelerationG: number | null
): number {
  const d = distanceAU * AU_TO_KM;
  const vMax = (velocityPercentC / 100) * C_KM_S;

  if (accelerationG && accelerationG > 0) {
    const a = accelerationG * G_TO_KM_S2;
    const tAccel = vMax / a;
    const dAccel = 0.5 * a * tAccel * tAccel;
    if (2 * dAccel >= d) {
      // Pure brachistochrone—never reaches max velocity
      return 2 * Math.sqrt(d / a);
    }
    // Accelerate, cruise, decelerate
    return 2 * tAccel + (d - 2 * dAccel) / vMax;
  }

  // Constant cruise velocity
  return d / vMax;
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "—";
  const days = seconds / 86400;
  const months = days / 30.44;
  const years = days / 365.25;

  if (years >= 1_000_000) return `~${(years / 1_000_000).toFixed(1)}M years`;
  if (years >= 1000) return `~${Math.round(years).toLocaleString()} years`;
  if (years >= 10) return `~${Math.round(years)} years`;
  if (years >= 1) return `~${years.toFixed(1)} years`;
  if (months >= 2) return `~${months.toFixed(1)} months`;
  if (days >= 14) return `~${(days / 7).toFixed(1)} weeks`;
  if (days >= 2) return `~${days.toFixed(1)} days`;
  if (seconds >= 3600) return `~${(seconds / 3600).toFixed(1)} hours`;
  if (seconds >= 60) return `~${Math.round(seconds / 60)} min`;
  return "< 1 min";
}

function computeBenchmarkRange(
  minAU: number,
  maxAU: number,
  velocityPercentC: number,
  accelerationG: number | null
): string {
  const tMin = calcTravelTimeSeconds(minAU, velocityPercentC, accelerationG);
  const tMax = calcTravelTimeSeconds(maxAU, velocityPercentC, accelerationG);
  const fMin = formatDuration(tMin);
  const fMax = formatDuration(tMax);
  if (minAU === maxAU || fMin === fMax) return fMin;
  return `${fMin} – ${fMax}`;
}

// --- Propulsion-specific economic cost guidance ---

const PROPULSION_COST_GUIDANCE: Record<string, { fuel: string; construction: string }> = {
  chemical: {
    fuel: "Affordable per unit but enormous fuel mass required (90%+ of ship is fuel). Millions per mission.",
    construction: "Proven technology, moderate cost. $100M–$2B per vehicle (comparable to modern rockets).",
  },
  ion: {
    fuel: "Very efficient—minimal fuel mass. Xenon propellant is moderately priced, quantities are small.",
    construction: "Moderate cost. Solar arrays or compact reactor + ion engines. $200M–$1B.",
  },
  "nuclear-thermal": {
    fuel: "Enriched uranium + hydrogen propellant—regulated and expensive. 2–3× more efficient than chemical.",
    construction: "Requires nuclear-rated facilities. $1B–$10B per vehicle.",
  },
  "nuclear-pulse": {
    fuel: "Nuclear devices as propellant—politically and economically extreme. Thousands of bombs per mission.",
    construction: "Manhattan Project scale engineering. $10B–$100B+ per vehicle.",
  },
  fusion: {
    fuel: "Deuterium/He-3—abundant in gas giants but expensive to harvest and transport.",
    construction: "Requires mature fusion technology. $10B–$100B per vessel, decreasing with infrastructure.",
  },
  antimatter: {
    fuel: "Most expensive substance possible. Current cost: ~$62.5 trillion/gram. Civilization-scale energy investment.",
    construction: "Exotic containment systems, magnetic bottles. $100B+ per vessel minimum.",
  },
  "solar-sail": {
    fuel: "Free (photon pressure). Laser-pushed variants need massive ground infrastructure ($100B+).",
    construction: "Sail material is relatively cheap. Total cost depends on laser array vs. pure solar.",
  },
  bussard: {
    fuel: "Free (scoops interstellar hydrogen)—but collection efficiency is debated. Drag may exceed thrust.",
    construction: "Enormous magnetic scoop (potentially thousands of km). Megastructure-scale investment.",
  },
  alcubierre: {
    fuel: "Requires exotic matter with negative energy density. Cost undefined by current physics.",
    construction: "Beyond current tech—spacetime manipulation. Define based on your setting's physics.",
  },
  hyperspace: {
    fuel: "Setting-dependent. Consider: rare exotic fuel (elite travel) or abundant fuel (mass transit)?",
    construction: "Setting-dependent. Is the drive component rare and expensive, or mass-produced?",
  },
  wormhole: {
    fuel: "Portal maintenance may require exotic matter or enormous energy. Transit itself could be cheap.",
    construction: "Infrastructure-heavy—wormhole creation is the major cost. Ships themselves can be simple.",
  },
  generation: {
    fuel: "Conventional propulsion fuel for centuries plus ecosystem maintenance. Massive reserves required.",
    construction: "Self-contained biosphere for centuries. Most expensive single vehicle conceivable ($1T+).",
  },
};

const SF_EXAMPLES = [
  {
    title: "THE EXPANSE - Epstein Drive (Efficient Fusion)",
    data: [
      { domain: "Economics", consequence: "Allows Belt mining; Ice haulers viable; Middle class can afford travel" },
      { domain: "Politics", consequence: "Three-way power balance (Earth/Mars/Belt); Regional autonomy with central tension" },
      { domain: "Military", consequence: "Ships = missiles; Constant burn & flip maneuver; Stealth is critical" },
      { domain: "Social", consequence: 'Belter culture distinct from planets; "Gravity wells" vs. spacers; Long-term health effects' },
      { domain: "Psychology", consequence: 'Direction is relative; "Down" is thrust direction; Belters distrust grounders' },
    ],
    insight: "Architecture follows thrust—ships built like towers with decks perpendicular to drive",
  },
  {
    title: "DUNE - Holtzman Effect (Instantaneous FTL)",
    data: [
      { domain: "Economics", consequence: "Only spice-enabled Navigators can pilot safely = total spice dependency" },
      { domain: "Politics", consequence: "Spacing Guild controls all travel = political kingmaker; Centralized empire possible despite vast distances" },
      { domain: "Military", consequence: "No-ships develop to counter prescience; Atomics exist but are taboo; Personal shields change melee combat" },
      { domain: "Social", consequence: "Aristocratic houses travel freely; Common people rarely leave planets; Cultural homogeneity across empire" },
      { domain: "Psychology", consequence: '"Distance" becomes political rather than physical; Fear of being trapped on-planet; Navigator mutation accepted' },
    ],
    insight: "FTL doesn't create freedom—it creates monopoly. Whoever controls travel controls everything.",
  },
  {
    title: "REVELATION SPACE - Lighthugger Ships (Relativistic, No FTL)",
    data: [
      { domain: "Economics", consequence: "Only ultra-rich or desperate travel; Self-contained ship economies; Information is primary trade good" },
      { domain: "Politics", consequence: "Complete planetary independence; No empires possible; Each system isolated" },
      { domain: "Military", consequence: "Weapons deployment requires decades of planning; System defense only; No star-spanning wars" },
      { domain: "Social", consequence: 'Ship crews experience years while centuries pass outside; "Ultras" become separate culture/species; Family bonds impossible across systems' },
      { domain: "Psychology", consequence: "Time as weapon and barrier; Present = moving target; Spacers psychologically alien to grounders" },
    ],
    insight: "Time dilation creates permanent cultural divide—spacers and grounders are effectively different species.",
  },
  {
    title: "HYPERION CANTOS - Hawking Drive + Farcaster Network",
    data: [
      { domain: "Economics", consequence: "Farcasters enable instant portals = centralized economy; Hawking drives for non-network travel = slow/expensive backup" },
      { domain: "Politics", consequence: "Hegemony controls farcasters = absolute power; Lose network access = isolation; Outcasts trapped on slow ships" },
      { domain: "Military", consequence: "Farcaster warfare = instant troop deployment; Control portals = control everything; Severing worlds = ultimate punishment" },
      { domain: "Social", consequence: "Elite live in multi-world houses (breakfast on Renaissance V, dinner on Tau Ceti); Working class stuck on single worlds; Massive inequality" },
      { domain: "Psychology", consequence: '"Place" becomes meaningless for elite; Omnipresence as status symbol; Disconnected life as poverty marker' },
    ],
    insight: "Two-tier travel system creates two-tier society. The story explores what happens when the network fails.",
  },
];

const TOOL_TYPE = "propulsion-consequences-map";

const PropulsionConsequencesMap = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { worlds } = useWorlds();

  // Get URL params for worldId and worksheetId
  const [searchParams, setSearchParams] = useSearchParams();
  const worldId = useWorldId();
  const worksheetId = searchParams.get("worksheetId");

  // Get world name from worldId
  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const worldName = currentWorld?.name;

  // Supabase hooks
  const entityMatch = useEntityMatch(worldId);
  const { createWorksheet, updateWorksheet } = useWorksheets(worldId || undefined, false, {
    onDraftCreated: entityMatch.check,
  });
  const { data: existingWorksheet, isLoading: worksheetLoading } = useWorksheet(worksheetId || undefined);
  const { data: existingWorksheets = [], isLoading: worksheetsLoading } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  const renameWorksheet = useRenameWorksheet();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [moodboardSheetOpen, setMoodboardSheetOpen] = useState(false);
  const { data: shareConfig } = useWorksheetShare(currentWorksheetId || worksheetId || undefined);
  const { updateWorksheetTags } = useTags();
  const [worksheetTags, setWorksheetTags] = useState<string[]>([]);

  // Show worksheet selector when worldId is present but no worksheetId
  useEffect(() => {
    if (worldId && !worksheetId && !worksheetsLoading && user) {
      setWorksheetSelectorOpen(true);
    }
  }, [worldId, worksheetId, worksheetsLoading, user]);

  // Load existing worksheet from Supabase if worksheetId is provided
  useEffect(() => {
    if (existingWorksheet && existingWorksheet.data) {
      try {
        const data = existingWorksheet.data as unknown as FormState;
        setFormState(data);
        setCurrentWorksheetId(existingWorksheet.id);
        setCurrentWorksheetTitle(existingWorksheet.title);
        if (existingWorksheet.tags) {
          setWorksheetTags(existingWorksheet.tags);
        }
        toast({
          title: "Worksheet Loaded",
          description: "WORK RESTORED FROM CLOUD.",
        });
      } catch {
        // Ignore parse errors
      }
    }
  }, [existingWorksheet]);

  // Fallback to localStorage if no worldId (standalone mode)
  useEffect(() => {
    if (!worldId && !worksheetId) {
      const saved = localStorage.getItem("pcm-worksheet");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormState(parsed);
        } catch {
          // Ignore parse errors
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldId, worksheetId]);

  // Generate key choices for sidebar
  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    const countFilledDomain = (domain: DomainResponses) =>
      Object.values(domain).filter((v) => v && (typeof v === 'string' ? v.trim() : (v as string[]).length > 0)).length;

    return [
      {
        id: "propulsion",
        title: "1. Propulsion",
        choices: [
          { label: "Type", value: formState.system.type },
          { label: "Speed", value: formState.system.maxVelocity },
          { label: "Cost", value: formState.system.costComparison },
        ],
      },
      {
        id: "economic",
        title: "2. Economic",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.economic) > 0 ? `${countFilledDomain(formState.economic)} filled` : undefined },
        ],
      },
      {
        id: "political",
        title: "3. Political",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.political) > 0 ? `${countFilledDomain(formState.political)} filled` : undefined },
        ],
      },
      {
        id: "military",
        title: "4. Military",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.military) > 0 ? `${countFilledDomain(formState.military)} filled` : undefined },
        ],
      },
      {
        id: "social",
        title: "5. Social",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.social) > 0 ? `${countFilledDomain(formState.social)} filled` : undefined },
        ],
      },
      {
        id: "psychological",
        title: "6. Psychological",
        choices: [
          { label: "Responses", value: countFilledDomain(formState.psychological) > 0 ? `${countFilledDomain(formState.psychological)} filled` : undefined },
        ],
      },
      {
        id: "synthesis",
        title: "7. Synthesis",
        choices: [
          { label: "Thesis", value: formState.synthesis.propulsionThesis ? "Defined" : undefined },
        ],
      },
    ];
  }, [formState]);

  // Travel time auto-calculation
  const isFTL = FTL_TYPES.includes(formState.system.type);
  const velocityPercent = parseNumericValue(formState.system.maxVelocity);
  const accelerationG = parseNumericValue(formState.system.acceleration);
  const costGuidance = PROPULSION_COST_GUIDANCE[formState.system.type];

  const computedBenchmarks = useMemo(() => {
    if (!velocityPercent || isFTL) return null;
    return Object.fromEntries(
      BENCHMARK_ROUTES.map((route) => [
        route.key,
        computeBenchmarkRange(route.minAU, route.maxAU, velocityPercent, accelerationG),
      ])
    ) as Record<string, string>;
  }, [velocityPercent, accelerationG, isFTL]);

  // Auto-fill benchmark fields when computed values change
  useEffect(() => {
    if (!computedBenchmarks) return;
    setFormState((prev) => ({
      ...prev,
      benchmarks: {
        ...prev.benchmarks,
        earthMars: computedBenchmarks.earthMars,
        earthJupiter: computedBenchmarks.earthJupiter,
        earthNeptune: computedBenchmarks.earthNeptune,
        solAlphaCentauri: computedBenchmarks.solAlphaCentauri,
        solProximaB: computedBenchmarks.solProximaB,
      },
    }));
  }, [computedBenchmarks]);

  const updateSystem = (field: keyof PropulsionSystem, value: string) => {
    setFormState((prev) => ({
      ...prev,
      system: { ...prev.system, [field]: value },
    }));
  };

  const updateBenchmarks = (field: keyof TravelBenchmark, value: string) => {
    setFormState((prev) => ({
      ...prev,
      benchmarks: { ...prev.benchmarks, [field]: value },
    }));
  };

  const updateCosts = (field: keyof EconomicCosts, value: string) => {
    setFormState((prev) => ({
      ...prev,
      costs: { ...prev.costs, [field]: value },
    }));
  };

  const updateDomain = (
    domain: "economic" | "political" | "military" | "social" | "psychological",
    field: string,
    value: string | string[]
  ) => {
    setFormState((prev) => ({
      ...prev,
      [domain]: { ...prev[domain], [field]: value },
    }));
  };

  const updateSynthesis = (field: keyof FormState["synthesis"], value: string | string[]) => {
    setFormState((prev) => ({
      ...prev,
      synthesis: { ...prev.synthesis, [field]: value },
    }));
  };

  const handleSave = async () => {
    // Always save to localStorage as backup
    localStorage.setItem("pcm-worksheet", JSON.stringify(formState));

    // If we have a worldId and user is authenticated, save to Supabase
    if (worldId && user) {
      const worksheetData = formState as unknown as Json;

      try {
        if (currentWorksheetId || worksheetId) {
          // Update existing worksheet - preserve user-provided title
          await updateWorksheet.mutateAsync({
            worksheetId: currentWorksheetId || worksheetId!,
            data: worksheetData,
          });
        } else {
          // Should not reach here - worksheet must be created via selector first
          toast({
            title: "OPERATION FAILED.",
            description: "SELECT OR CREATE A WORKSHEET BEFORE TRANSMITTING.",
            variant: "destructive",
          });
        }
      } catch {
        // Error already handled by the mutation
      }
    } else {
      toast({
        title: "Draft Saved",
        description: "WORK SECURED TO LOCAL STORAGE.",
      });
    }
  };

  const handleWorksheetSelect = (selectedWorksheetId: string) => {
    setSearchParams({ worldId: worldId!, worksheetId: selectedWorksheetId });
    setWorksheetSelectorOpen(false);
  };

  const handleWorksheetCreate = async (name: string): Promise<string> => {
    const worksheetData = initialFormState as unknown as Json;
    const result = await createWorksheet.mutateAsync({
      worldId: worldId!,
      toolType: TOOL_TYPE,
      title: name,
      data: worksheetData,
    });
    setCurrentWorksheetId(result.id);
    setCurrentWorksheetTitle(result.title);
    setSearchParams({ worldId: worldId!, worksheetId: result.id });
    return result.id;
  };

  // Handle worksheet rename
  const handleRename = async (newTitle: string) => {
    const wsId = currentWorksheetId || worksheetId;
    if (!wsId) return;

    await renameWorksheet.mutateAsync({ worksheetId: wsId, title: newTitle });
    setCurrentWorksheetTitle(newTitle);
  };

  const handleTagsChange = (newTags: string[]) => {
    setWorksheetTags(newTags);
    const wsId = currentWorksheetId || worksheetId;
    if (wsId) {
      updateWorksheetTags.mutate({ worksheetId: wsId, tags: newTags });
    }
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onPrint={handlePrint}
      onExport={handleExport}
      onShare={(currentWorksheetId || worksheetId) ? () => setShareDialogOpen(true) : undefined}
      isShared={!!shareConfig?.enabled}
      isCloudEnabled={!!(worldId && user)}
      onNotesClick={() => setNotesSheetOpen(true)}
      onMoodboardClick={() => setMoodboardSheetOpen(true)}
      moodboardCount={formState.moodboard?.length || 0}
      extraActions={
        <QuickExportButton
          toolName="Impulse"
          worldName={worldName}
          formState={formState}
          summaryTemplate={<PropulsionSummaryTemplate formState={formState} worldName={worldName} />}
          fullTemplate={<PropulsionFullReportTemplate formState={formState} worldName={worldName} />}
          defaultFilename="propulsion-consequences-map"
        />
      }
      worksheetId={currentWorksheetId || worksheetId}
      worksheetTitle={currentWorksheetTitle}
      onRenameWorksheet={handleRename}
      worksheetLoading={worksheetLoading}
      worksheetTags={worksheetTags}
      onTagsChange={handleTagsChange}
      worksheetIcon={<FileText className="w-4 h-4 text-primary" />}
      isLoggedIn={!!user}
    >

        {/* Introduction */}
        <GlassPanel glow className="p-6 md:p-8 mb-8">
          <h2 className="font-heading text-xl font-light uppercase tracking-[2px] mb-4 gradient-text">
            Propulsion as Worldbuilding
          </h2>
          <blockquote className="border-l-2 border-primary pl-4 italic text-lg mb-4">
            "Your propulsion system isn't just a way to move the plot between locations—it fundamentally shapes economics, politics, relationships, and psychology."
          </blockquote>
          <p className="text-t2 mb-4">
            Fast travel creates empires; slow travel creates autonomous colonies. Cheap travel democratizes; expensive travel stratifies.
          </p>
          <div className="text-sm text-t3 mb-4">
            <strong className="text-foreground">The Cascading Principle for Propulsion:</strong>
            <p className="mt-1">Travel speed → Economics → Politics → Social structures → Psychology → Culture</p>
          </div>
          
          {/* External Resources */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Essential Resources</h4>
            <div className="flex flex-wrap gap-2">
              {EXTERNAL_RESOURCES.map((resource) => (
                <a
                  key={resource.name}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {resource.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </GlassPanel>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Section 1: Define Propulsion System */}
          <CollapsibleSection
            id="section-propulsion"
            title="Define Your Propulsion System"
            subtitle="What technology moves your ships?"
            levelNumber={1}
            defaultOpen={true}
          >
            <div className="space-y-6">
              {/* Propulsion Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Propulsion Type</Label>
                <RadioGroup
                  value={formState.system.type}
                  onValueChange={(value) => updateSystem("type", value)}
                  className="grid gap-2 md:grid-cols-2"
                >
                  {PROPULSION_TYPES.map((type) => (
                    <div key={type.value} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={type.value} id={type.value} className="mt-0.5" />
                      <Label htmlFor={type.value} className="cursor-pointer flex-1">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-t2 ml-2 text-sm">—{type.description}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {formState.system.type === "other" && (
                  <Input
                    placeholder="Describe your custom propulsion system..."
                    value={formState.system.customType}
                    onChange={(e) => updateSystem("customType", e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Performance Specifications */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="maxVelocity">Maximum Velocity (% of light speed)</Label>
                  <Input
                    id="maxVelocity"
                    placeholder="e.g., 10% c for fusion, 99.99% c for relativistic"
                    value={formState.system.maxVelocity}
                    onChange={(e) => updateSystem("maxVelocity", e.target.value)}
                  />
                  <p className="text-xs text-t4">Chemical: &lt;0.001% c; Fusion: ~10% c; Theoretical limit: 99.99% c</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acceleration">Acceleration (g)</Label>
                  <Input
                    id="acceleration"
                    placeholder="e.g., 1g sustained, 0.001g for ion"
                    value={formState.system.acceleration}
                    onChange={(e) => updateSystem("acceleration", e.target.value)}
                  />
                  <p className="text-xs text-t4">Chemical: ~3g; Ion: 0.001g; Epstein (Expanse): ~5g sustained</p>
                </div>
              </div>

              {/* Energy Source */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Energy Source</Label>
                <RadioGroup
                  value={formState.system.energySource}
                  onValueChange={(value) => updateSystem("energySource", value)}
                  className="grid gap-2 md:grid-cols-3"
                >
                  {ENERGY_SOURCES.map((source) => (
                    <div key={source.value} className="flex items-center gap-2">
                      <RadioGroupItem value={source.value} id={`energy-${source.value}`} />
                      <Label htmlFor={`energy-${source.value}`} className="cursor-pointer">{source.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Travel Time Benchmarks */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Travel Time Benchmarks</Label>
                  {computedBenchmarks && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Atom className="w-3 h-3" />
                      Auto-calculated
                    </Badge>
                  )}
                </div>

                {computedBenchmarks ? (
                  <>
                    <p className="text-xs text-t4">
                      Based on {formState.system.maxVelocity || "?"} max velocity
                      {accelerationG
                        ? ` with ${formState.system.acceleration} acceleration (brachistochrone trajectory)`
                        : " (cruise velocity)"}
                    </p>
                    <div className="rounded-lg border border-border divide-y divide-border/50">
                      {BENCHMARK_ROUTES.map((route) => (
                        <div key={route.key} className="flex items-center justify-between px-4 py-2.5">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-medium">{route.label}</span>
                            <span className="text-xs text-t4">({route.distanceLabel})</span>
                          </div>
                          <span className="text-sm text-primary font-mono">
                            {computedBenchmarks[route.key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : isFTL ? (
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm text-t3 mb-3">
                      FTL travel times depend on your setting's specific mechanics. Define travel times for key routes:
                    </p>
                    <div className="grid gap-3">
                      {BENCHMARK_ROUTES.map((route) => (
                        <div key={route.key} className="grid grid-cols-2 gap-2 items-center">
                          <span className="text-sm">{route.label} ({route.distanceLabel})</span>
                          <Input
                            placeholder={route.key.startsWith("sol") ? "e.g., instant, 3 days" : "e.g., hours, minutes"}
                            value={formState.benchmarks[route.key]}
                            onChange={(e) => updateBenchmarks(route.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-t4">
                      Enter a max velocity above to auto-calculate, or enter times manually.
                    </p>
                    <div className="grid gap-3">
                      {BENCHMARK_ROUTES.map((route) => (
                        <div key={route.key} className="grid grid-cols-2 gap-2 items-center">
                          <span className="text-sm">{route.label} ({route.distanceLabel})</span>
                          <Input
                            placeholder={route.key.startsWith("sol") ? "e.g., 43 years at 10% c" : "e.g., 2 weeks, 6 months"}
                            value={formState.benchmarks[route.key]}
                            onChange={(e) => updateBenchmarks(route.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Custom route — always editable */}
                <div className="grid grid-cols-2 gap-2 items-center">
                  <Input
                    placeholder="Custom route (e.g., Between your worlds)"
                    value={formState.benchmarks.customRoute}
                    onChange={(e) => updateBenchmarks("customRoute", e.target.value)}
                  />
                  <Input
                    placeholder="Travel time"
                    value={formState.benchmarks.customRouteTime}
                    onChange={(e) => updateBenchmarks("customRouteTime", e.target.value)}
                  />
                </div>
              </div>

              {/* Communication Lag */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Communication Speed</Label>
                <RadioGroup
                  value={formState.system.communicationSpeed}
                  onValueChange={(value) => updateSystem("communicationSpeed", value)}
                  className="grid gap-2"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="ftl" id="comm-ftl" />
                    <Label htmlFor="comm-ftl">Faster than ships (FTL communication)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="same" id="comm-same" />
                    <Label htmlFor="comm-same">Same speed as ships</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="slower" id="comm-slower" />
                    <Label htmlFor="comm-slower">Slower than ships (ships carry messages)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Economic Parameters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Economic Costs</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="fuelEnergy" className="text-xs">Fuel/Energy Cost</Label>
                    <Input
                      id="fuelEnergy"
                      placeholder="e.g., Antimatter: astronomical"
                      value={formState.costs.fuelEnergy}
                      onChange={(e) => updateCosts("fuelEnergy", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="construction" className="text-xs">Construction Cost (per ship)</Label>
                    <Input
                      id="construction"
                      placeholder="e.g., GDP of small nation"
                      value={formState.costs.construction}
                      onChange={(e) => updateCosts("construction", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="crewCapacity" className="text-xs">Crew/Passenger Capacity</Label>
                    <Input
                      id="crewCapacity"
                      placeholder="e.g., 50 crew, 200 passengers"
                      value={formState.costs.crewCapacity}
                      onChange={(e) => updateCosts("crewCapacity", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cargoCapacity" className="text-xs">Cargo Capacity</Label>
                    <Input
                      id="cargoCapacity"
                      placeholder="e.g., 10,000 tons"
                      value={formState.costs.cargoCapacity}
                      onChange={(e) => updateCosts("cargoCapacity", e.target.value)}
                    />
                  </div>
                </div>
                {costGuidance && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-sf-border space-y-2 md:col-span-2">
                    <p className="text-xs font-medium text-t2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Cost guidance for{" "}
                      {PROPULSION_TYPES.find((t) => t.value === formState.system.type)?.label || formState.system.type}
                    </p>
                    <div className="grid gap-1.5 text-xs text-t4">
                      <p><span className="font-medium text-t2">Fuel:</span> {costGuidance.fuel}</p>
                      <p><span className="font-medium text-t2">Construction:</span> {costGuidance.construction}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost Comparison */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Cost Comparison</Label>
                <RadioGroup
                  value={formState.system.costComparison}
                  onValueChange={(value) => updateSystem("costComparison", value)}
                  className="grid gap-2 md:grid-cols-2"
                >
                  {COST_COMPARISONS.map((comp) => (
                    <div key={comp.value} className="flex items-start gap-2 p-2 rounded border border-border">
                      <RadioGroupItem value={comp.value} id={`cost-${comp.value}`} className="mt-0.5" />
                      <Label htmlFor={`cost-${comp.value}`} className="cursor-pointer">
                        <span className="font-medium">{comp.label}</span>
                        <span className="text-t2 ml-1 text-xs">({comp.description})</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CollapsibleSection>

          {/* Domain 1: Economic Implications */}
          <CollapsibleSection
            id="section-economic"
            title="Domain 1: Economic Implications"
            subtitle="Who can afford this travel? What's worth shipping?"
            levelNumber={2}
            thinkLike="an economist: Price determines who moves, what moves, and why."
          >
            <div className="space-y-6">
              {/* Access Stratification */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Access Stratification</Label>
                <div className="grid gap-2">
                  {ACCESS_STRATIFICATIONS.map((option) => (
                    <div key={option.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <Checkbox
                        id={`access-${option.id}`}
                        checked={(formState.economic.accessStratification as string[] || []).includes(option.id)}
                        onCheckedChange={(checked) => {
                          const current = (formState.economic.accessStratification as string[]) || [];
                          updateDomain(
                            "economic",
                            "accessStratification",
                            checked
                              ? [...current, option.id]
                              : current.filter((id) => id !== option.id)
                          );
                        }}
                      />
                      <Label htmlFor={`access-${option.id}`} className="cursor-pointer">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-t2 ml-2 text-sm">—{option.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="economic-immediate"
                label="Immediate Consequence"
                prompts={["What immediately results from this access pattern?"]}
                value={(formState.economic.immediateConsequence as string) || ""}
                onChange={(value) => updateDomain("economic", "immediateConsequence", value)}
              />

              {/* Trade Viability */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Trade Viability</Label>
                <p className="text-xs text-t4">What's worth shipping given travel costs and time?</p>
                <div className="grid gap-2">
                  {TRADE_VIABILITY.map((option) => (
                    <div key={option.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <Checkbox
                        id={`trade-${option.id}`}
                        checked={(formState.economic.tradeViability as string[] || []).includes(option.id)}
                        onCheckedChange={(checked) => {
                          const current = (formState.economic.tradeViability as string[]) || [];
                          updateDomain(
                            "economic",
                            "tradeViability",
                            checked
                              ? [...current, option.id]
                              : current.filter((id) => id !== option.id)
                          );
                        }}
                      />
                      <Label htmlFor={`trade-${option.id}`} className="cursor-pointer">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-t2 ml-2 text-sm">—{option.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="economic-trade-goods"
                label="Primary Interstellar Trade Goods"
                prompts={["What specific goods are worth the cost of interstellar shipping in your setting?"]}
                example="In The Expanse, ice from Saturn's rings is valuable for water. In Dune, spice is the only commodity worth interstellar shipping costs."
                value={(formState.economic.tradeGoods as string) || ""}
                onChange={(value) => updateDomain("economic", "tradeGoods", value)}
              />

              <QuestionSection
                id="economic-wealth"
                label="Wealth Disparities Created"
                prompts={[
                  "If travel is expensive: Trapped populations? Elite mobility? Spacer vs. grounder split?",
                  "If travel is cheap: Resource competition? Brain drain? Cultural homogenization?",
                ]}
                value={(formState.economic.wealthDisparities as string) || ""}
                onChange={(value) => updateDomain("economic", "wealthDisparities", value)}
              />

              <QuestionSection
                id="economic-labor"
                label="Labor & Migration Patterns"
                prompts={[
                  "Job markets: How do travel costs affect employment?",
                  "Skilled labor migration: Where do experts go?",
                  "Colonization economics: Who can afford to settle new worlds?",
                ]}
                value={(formState.economic.laborPatterns as string) || ""}
                onChange={(value) => updateDomain("economic", "laborPatterns", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Domain 2: Political & Governance */}
          <CollapsibleSection
            id="section-political"
            title="Domain 2: Political & Governance"
            subtitle="How does travel time affect control?"
            levelNumber={3}
            thinkLike="a political scientist: Communication lag and travel time determine possible governance structures."
          >
            <div className="space-y-6">
              <QuestionSection
                id="political-transit"
                label="Message/Command Transit Time"
                prompts={["How long to send orders to distant colonies? Days, months, years?"]}
                value={(formState.political.transitTime as string) || ""}
                onChange={(value) => updateDomain("political", "transitTime", value)}
              />

              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <h4 className="text-sm font-medium">What This Means for Governance:</h4>
                <div className="grid gap-3 text-sm">
                  <div>
                    <span className="font-medium text-primary">If transit time &lt;1 week:</span>
                    <p className="text-t2">Centralized empire possible, real-time oversight, unified legal systems, fast military response</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">If transit time 1 month - 1 year:</span>
                    <p className="text-t2">Regional autonomy necessary, colonial governors with broad authority, rebellions can establish before response</p>
                  </div>
                  <div>
                    <span className="font-medium text-primary">If transit time &gt;1 year:</span>
                    <p className="text-t2">Effective independence, governance like letters to medieval lords, cultural drift accelerates</p>
                  </div>
                </div>
              </div>

              <QuestionSection
                id="political-implications"
                label="Your World's Implications"
                prompts={["Based on your transit times, what governance is actually possible?"]}
                value={(formState.political.implications as string) || ""}
                onChange={(value) => updateDomain("political", "implications", value)}
              />

              {/* Governance Structures */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Governance Structures</Label>
                <p className="text-xs text-t4">Select the model(s) that fit your propulsion parameters</p>
                <div className="grid gap-2">
                  {GOVERNANCE_STRUCTURES.map((structure) => (
                    <div key={structure.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <Checkbox
                        id={`gov-${structure.id}`}
                        checked={(formState.political.governanceStructures as string[] || []).includes(structure.id)}
                        onCheckedChange={(checked) => {
                          const current = (formState.political.governanceStructures as string[]) || [];
                          updateDomain(
                            "political",
                            "governanceStructures",
                            checked
                              ? [...current, structure.id]
                              : current.filter((id) => id !== structure.id)
                          );
                        }}
                      />
                      <Label htmlFor={`gov-${structure.id}`} className="cursor-pointer flex-1">
                        <span className="font-medium">{structure.label}</span>
                        <span className="text-t2 ml-2 text-sm">—{structure.description}</span>
                        <p className="text-xs text-primary mt-1">Example: {structure.example}</p>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="political-enforcement"
                label="How Is This Structure Enforced/Maintained?"
                prompts={["What mechanisms keep this political structure stable?"]}
                value={(formState.political.enforcement as string) || ""}
                onChange={(value) => updateDomain("political", "enforcement", value)}
              />

              <QuestionSection
                id="political-tensions"
                label="Political Tensions Created"
                prompts={[
                  "Core vs. Periphery conflicts?",
                  "Independence movements?",
                  "Resource control disputes?",
                ]}
                value={(formState.political.tensions as string) || ""}
                onChange={(value) => updateDomain("political", "tensions", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Domain 3: Military & Conflict */}
          <CollapsibleSection
            id="section-military"
            title="Domain 3: Military & Conflict"
            subtitle="Combat implications of your propulsion"
            levelNumber={4}
            thinkLike="a military strategist: Propulsion determines tactics, strategy, and what's even worth fighting over."
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Response Time to Threats</Label>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Respond to distress call (same system)</span>
                    <Input
                      placeholder="e.g., hours, days"
                      value={(formState.military.responseDistress as string) || ""}
                      onChange={(e) => updateDomain("military", "responseDistress", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Respond to invasion (neighboring system)</span>
                    <Input
                      placeholder="e.g., weeks, months"
                      value={(formState.military.responseInvasion as string) || ""}
                      onChange={(e) => updateDomain("military", "responseInvasion", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Project force across territory</span>
                    <Input
                      placeholder="e.g., months, years"
                      value={(formState.military.projectForce as string) || ""}
                      onChange={(e) => updateDomain("military", "projectForce", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-sm">Retreat/escape pursuit</span>
                    <Input
                      placeholder="e.g., depends on drive efficiency"
                      value={(formState.military.retreatEscape as string) || ""}
                      onChange={(e) => updateDomain("military", "retreatEscape", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <QuestionSection
                id="military-strategic"
                label="Strategic Implications"
                prompts={["What do these response times mean for military doctrine?"]}
                value={(formState.military.strategicImplications as string) || ""}
                onChange={(value) => updateDomain("military", "strategicImplications", value)}
              />

              <QuestionSection
                id="military-drive-weapon"
                label="Drive as Weapon"
                prompts={[
                  "Can the drive be used offensively? (Epstein drive in The Expanse = kinetic weapon)",
                  "Engagement ranges: Does slow acceleration mean long-range missile combat?",
                  "Escape/pursuit dynamics: Can ships outrun weapons? Can attackers catch fleeing targets?",
                ]}
                value={(formState.military.driveAsWeapon as string) || ""}
                onChange={(value) => updateDomain("military", "driveAsWeapon", value)}
              />

              <QuestionSection
                id="military-offensive"
                label="Offensive Capabilities"
                prompts={["What can your military do well given propulsion constraints?"]}
                value={(formState.military.offensive as string) || ""}
                onChange={(value) => updateDomain("military", "offensive", value)}
              />

              <QuestionSection
                id="military-defensive"
                label="Defensive Vulnerabilities"
                prompts={["What weaknesses does your propulsion system create?"]}
                value={(formState.military.defensive as string) || ""}
                onChange={(value) => updateDomain("military", "defensive", value)}
              />

              <QuestionSection
                id="military-chokepoints"
                label="Chokepoints & Strategic Locations"
                prompts={["What locations become militarily critical given your propulsion?"]}
                value={(formState.military.chokepoints as string) || ""}
                onChange={(value) => updateDomain("military", "chokepoints", value)}
              />

              {/* Military Organization */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Military Organization</Label>
                <p className="text-xs text-t4">What military structures fit your propulsion?</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {MILITARY_STRUCTURES.map((structure) => (
                    <div key={structure.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                      <Checkbox
                        id={`mil-${structure.id}`}
                        checked={(formState.military.organization as string[] || []).includes(structure.id)}
                        onCheckedChange={(checked) => {
                          const current = (formState.military.organization as string[]) || [];
                          updateDomain(
                            "military",
                            "organization",
                            checked
                              ? [...current, structure.id]
                              : current.filter((id) => id !== structure.id)
                          );
                        }}
                      />
                      <Label htmlFor={`mil-${structure.id}`} className="cursor-pointer">
                        <span className="font-medium">{structure.label}</span>
                        <span className="text-t2 ml-2 text-sm">—{structure.description}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="military-structure"
                label="Your Military Structure"
                prompts={["Describe the military organization that emerges from your propulsion constraints"]}
                value={(formState.military.structure as string) || ""}
                onChange={(value) => updateDomain("military", "structure", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Domain 4: Social & Family Structures */}
          <CollapsibleSection
            id="section-social"
            title="Domain 4: Social & Family Structures"
            subtitle="How does travel time affect human relationships?"
            levelNumber={5}
            thinkLike="a sociologist: Long absences and relativity reshape families, careers, and social bonds."
          >
            <div className="space-y-6">
              <QuestionSection
                id="social-romantic"
                label="Romantic Relationships"
                prompts={[
                  "Long-distance relationships across systems",
                  '"Spacer" vs. "grounder" relationship difficulties',
                  "Crew relationships and regulations",
                ]}
                value={(formState.social.romantic as string) || ""}
                onChange={(value) => updateDomain("social", "romantic", value)}
              />

              <QuestionSection
                id="social-family"
                label="Family Structures"
                prompts={[
                  "Families separated by light-years for careers",
                  "Children born during multi-year journeys",
                  "Generational disconnection",
                ]}
                value={(formState.social.family as string) || ""}
                onChange={(value) => updateDomain("social", "family", value)}
              />

              <QuestionSection
                id="social-career"
                label="Career Implications"
                prompts={[
                  "Career mobility: Can you change jobs across systems?",
                  "Expertise concentration: Do experts travel to problems, or problems to experts?",
                  "Training/education: Study off-world and return, or local-only?",
                ]}
                value={(formState.social.career as string) || ""}
                onChange={(value) => updateDomain("social", "career", value)}
              />

              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-accent" />
                  Time Dilation Effects (If Applicable)
                </h4>
                <p className="text-xs text-t4">
                  If traveling at relativistic speeds, travelers experience less time than stationary observers.
                </p>
                <div className="text-sm space-y-2">
                  <p><span className="font-medium text-accent">For travelers:</span> Outlive friends/family, return to changed societies, professional obsolescence</p>
                  <p><span className="font-medium text-accent">For stay-at-homes:</span> Loved ones age slowly, "temporal immigrants" from past returning</p>
                  <p className="text-xs text-t4 italic">Example: Joe Haldeman's The Forever War—soldiers fight centuries-long war, experience only years</p>
                </div>
              </div>

              <QuestionSection
                id="social-dilation"
                label="Your World's Time Dilation Consequences"
                prompts={["If applicable, how does time dilation affect society?"]}
                value={(formState.social.timeDilation as string) || ""}
                onChange={(value) => updateDomain("social", "timeDilation", value)}
              />

              <QuestionSection
                id="social-drift"
                label="Cultural Drift & Isolation"
                prompts={[
                  "If travel is rare/slow: Languages diverge, cultural practices evolve independently, 'founder effects' amplified",
                  "If travel is common/fast: Cultural homogenization, shared media/trends, less diversity",
                ]}
                value={(formState.social.culturalDrift as string) || ""}
                onChange={(value) => updateDomain("social", "culturalDrift", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Domain 5: Psychological Concepts */}
          <CollapsibleSection
            id="section-psychological"
            title="Domain 5: Psychological Concepts"
            subtitle="How does your propulsion change fundamental concepts?"
            levelNumber={6}
            thinkLike="a psychologist: Travel systems reshape how people conceptualize reality."
          >
            <div className="space-y-6">
              <QuestionSection
                id="psych-distance"
                label='Concept of "Distance"'
                prompts={[
                  "What feels 'close'? What feels 'impossibly far'?",
                  "How do they describe distance? Time ('three months away') or space ('40 light-years')?",
                ]}
                example="In The Expanse, everything is measured in travel time and fuel (delta-v), not kilometers."
                value={(formState.psychological.distance as string) || ""}
                onChange={(value) => updateDomain("psychological", "distance", value)}
              />

              <QuestionSection
                id="psych-time"
                label='Concept of "Time"'
                prompts={[
                  "Relativistic travel: Subjective vs. objective time becomes meaningful",
                  "Cryosleep: Experienced time vs. calendar time ('I'm 30 but born 200 years ago')",
                  "FTL with no dilation: Time remains universal, simultaneity preserved",
                ]}
                value={(formState.psychological.time as string) || ""}
                onChange={(value) => updateDomain("psychological", "time", value)}
              />

              <QuestionSection
                id="psych-home"
                label='Concept of "Home"'
                prompts={[
                  "If travel is easy: Multiple homes possible, fluid belonging, cosmopolitan identity",
                  "If travel is difficult: 'Home' is permanent, strong planetary identity, fear of displacement",
                  "If relativistic: 'Home' is a time as much as a place, can never truly return",
                ]}
                value={(formState.psychological.home as string) || ""}
                onChange={(value) => updateDomain("psychological", "home", value)}
              />

              <QuestionSection
                id="psych-other"
                label='Concept of "Foreign" and "Other"'
                prompts={[
                  "Frequent contact: Cosmopolitan tolerance, 'we're all spacers together', less xenophobia",
                  "Rare contact: Strong in-group/out-group boundaries, colony loyalty trumps species loyalty, suspicion of outsiders",
                ]}
                value={(formState.psychological.other as string) || ""}
                onChange={(value) => updateDomain("psychological", "other", value)}
              />
            </div>
          </CollapsibleSection>

          {/* Integration & Story Potential */}
          <CollapsibleSection
            id="section-integration"
            title="Integration & Story Potential"
            subtitle="Bringing it all together"
            levelNumber={7}
          >
            <div className="space-y-6">
              {/* Consistency Check */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Consistency Check</Label>
                <p className="text-xs text-t4">Review all five domains. Do they fit together logically?</p>
                <div className="grid gap-2">
                  {[
                    { id: "economics", label: "Economics → Does your political structure match travel costs?" },
                    { id: "politics", label: "Politics → Does your military match communication lag?" },
                    { id: "military", label: "Military → Do your tactics match drive capabilities?" },
                    { id: "social", label: "Social → Do family structures match travel times?" },
                    { id: "psychology", label: "Psychology → Do cultural concepts match travel experience?" },
                  ].map((check) => (
                    <div key={check.id} className="flex items-center gap-3 p-2 rounded border border-border">
                      <Checkbox
                        id={`check-${check.id}`}
                        checked={formState.synthesis.consistencyChecks.includes(check.id)}
                        onCheckedChange={(checked) => {
                          updateSynthesis(
                            "consistencyChecks",
                            checked
                              ? [...formState.synthesis.consistencyChecks, check.id]
                              : formState.synthesis.consistencyChecks.filter((id) => id !== check.id)
                          );
                        }}
                      />
                      <Label htmlFor={`check-${check.id}`} className="cursor-pointer text-sm">
                        {check.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <QuestionSection
                id="synthesis-inconsistency"
                label="Biggest Inconsistency to Resolve"
                prompts={["What doesn't quite fit together? How might you fix it?"]}
                value={formState.synthesis.inconsistency}
                onChange={(value) => updateSynthesis("inconsistency", value)}
              />

              <QuestionSection
                id="synthesis-unexpected"
                label="Unexpected Consequences"
                prompts={["What surprising implications emerged from this exercise?"]}
                value={formState.synthesis.unexpectedConsequences}
                onChange={(value) => updateSynthesis("unexpectedConsequences", value)}
              />

              <div className="space-y-4">
                <Label className="text-sm font-medium">Story Conflicts Generated</Label>
                <p className="text-xs text-t4">These become your narrative engines.</p>
                
                <div className="space-y-2">
                  <Label htmlFor="conflict-economic" className="text-xs">Economic Conflicts</Label>
                  <Suspense fallback={<div className="min-h-[80px] rounded-md border border-border bg-background/50 animate-pulse" />}>
                    <RichTextEditor
                      content={formState.synthesis.economicConflicts}
                      onChange={(value) => updateSynthesis("economicConflicts", value)}
                      placeholder="What economic tensions drive conflict in your world?"
                      minHeight="80px"
                      className="bg-background/50"
                    />
                  </Suspense>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conflict-political" className="text-xs">Political Conflicts</Label>
                  <Suspense fallback={<div className="min-h-[80px] rounded-md border border-border bg-background/50 animate-pulse" />}>
                    <RichTextEditor
                      content={formState.synthesis.politicalConflicts}
                      onChange={(value) => updateSynthesis("politicalConflicts", value)}
                      placeholder="What political tensions emerge from your travel system?"
                      minHeight="80px"
                      className="bg-background/50"
                    />
                  </Suspense>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conflict-social" className="text-xs">Social Conflicts</Label>
                  <Suspense fallback={<div className="min-h-[80px] rounded-md border border-border bg-background/50 animate-pulse" />}>
                    <RichTextEditor
                      content={formState.synthesis.socialConflicts}
                      onChange={(value) => updateSynthesis("socialConflicts", value)}
                      placeholder="What social tensions arise from propulsion constraints?"
                      minHeight="80px"
                      className="bg-background/50"
                    />
                  </Suspense>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* SF Examples */}
          <CollapsibleSection
            id="section-examples"
            title="Examples from Master Worldbuilders"
            subtitle="Learn from published SF settings"
          >
            <div className="space-y-6">
              {SF_EXAMPLES.map((example, index) => (
                <Collapsible key={index}>
                  <CollapsibleTrigger asChild>
                    <button type="button" className="w-full p-4 rounded-lg border border-border hover:border-primary/50 transition-colors text-left flex items-center justify-between">
                      <span className="font-medium text-sm">{example.title}</span>
                      <ChevronDown className="w-4 h-4 text-t2" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 p-4 rounded-lg bg-muted/30 space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left p-2 font-medium">Domain</th>
                              <th className="text-left p-2 font-medium">Consequence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {example.data.map((row, i) => (
                              <tr key={i} className="border-b border-sf-border">
                                <td className="p-2 text-primary font-medium">{row.domain}</td>
                                <td className="p-2 text-t2">{row.consequence}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-sm italic border-l-2 border-accent pl-3">
                        <strong>Key insight:</strong> {example.insight}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CollapsibleSection>

          {/* Final Synthesis */}
          <CollapsibleSection
            id="section-synthesis"
            title="Final Synthesis: The Propulsion Thesis"
            subtitle="Distill your worldbuilding into key insights"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="thesis" className="text-sm font-medium">
                  Propulsion Thesis (2-3 sentences)
                </Label>
                <p className="text-xs text-t4">
                  Summarize how your travel system shapes your world.
                </p>
                <Suspense fallback={<div className="min-h-[120px] rounded-md border border-border bg-background/50 animate-pulse" />}>
                  <RichTextEditor
                    content={formState.synthesis.propulsionThesis}
                    onChange={(value) => updateSynthesis("propulsionThesis", value)}
                    placeholder="In my world, [propulsion type] means that [key consequence], which leads to [cultural/political result]. The most important tension is between [X] and [Y]."
                    minHeight="120px"
                    className="bg-background/50"
                  />
                </Suspense>
              </div>

              <QuestionSection
                id="synthesis-most-important"
                label="The Single Most Important Consequence"
                prompts={["What one thing about your propulsion system matters most for your stories?"]}
                value={formState.synthesis.mostImportant}
                onChange={(value) => updateSynthesis("mostImportant", value)}
              />

              <QuestionSection
                id="synthesis-story-conflict"
                label="The Most Interesting Story Conflict"
                prompts={["What tension, generated by your propulsion system, will drive your narratives?"]}
                value={formState.synthesis.storyConflict}
                onChange={(value) => updateSynthesis("storyConflict", value)}
              />
            </div>
          </CollapsibleSection>

        </div>

        {/* Desktop Sidebars - Right side */}
        <ToolSidebar>
          <SectionNavigation sections={SECTIONS} mode="inline" />
          <KeyChoicesSidebar sections={keyChoicesSections} title="Propulsion Summary" mode="inline" />
        </ToolSidebar>

        {/* Mobile Sidebars - Right side floating buttons */}
        <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
          <MobileSectionNav sections={SECTIONS} />
          <MobileKeyChoices sections={keyChoicesSections} title="Propulsion Summary" />
        </div>
      <WorksheetNotesSheet
        open={notesSheetOpen}
        onOpenChange={setNotesSheetOpen}
        content={formState.generalNotes}
        onChange={(html) => setFormState(prev => ({ ...prev, generalNotes: html }))}
      />

      <WorksheetMoodboardSheet
        open={moodboardSheetOpen}
        onOpenChange={setMoodboardSheetOpen}
        worksheetId={currentWorksheetId || "local"}
        images={formState.moodboard || []}
        onImagesChange={(images) => setFormState(prev => ({ ...prev, moodboard: images }))}
      />
      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="Impulse"
        worldName={worldName}
        formState={formState}
        summaryTemplate={<PropulsionSummaryTemplate formState={formState} worldName={worldName} />}
        fullTemplate={<PropulsionFullReportTemplate formState={formState} worldName={worldName} />}
        defaultFilename="propulsion-consequences-map"
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        entityType="worksheet"
        entityId={currentWorksheetId || worksheetId || ""}
        entityTitle={currentWorksheetTitle || "Untitled Worksheet"}
      />

      {/* Worksheet Selector Dialog */}
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={worldName}
          toolType={TOOL_TYPE}
          toolDisplayName="Impulse"
          worksheets={existingWorksheets}
          isLoading={worksheetsLoading}
          onSelect={handleWorksheetSelect}
          onCreate={handleWorksheetCreate}
        />
      )}

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default PropulsionConsequencesMap;
