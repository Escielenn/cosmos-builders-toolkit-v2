import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Bookmark,
  PenLine,
  FileText,
  Atom,
  Flame,
  Network,
  CalendarCheck,
  BookOpen,
  Layers,
  ArrowDownWideNarrow,
  Microscope,
  Calendar,
  Workflow,
  Library,
  BookText,
  Compass,
  Orbit,
  Link,
  Globe2,
  Scroll,
  CalendarRange,
  Building2,
  BookMarked,
  Crown,
  Tags,
  Share2,
  Users,
  Handshake,
  Eye,
  Crosshair,
  Repeat,
  Pickaxe,
  Gem,
} from "lucide-react";
import { TOOL_WIKI } from "@/lib/tool-wiki-data";

export type BadgeTier = "nascent" | "forming" | "stellar" | "legendary";

export type BadgeCategory =
  | "exploration"
  | "consistency"
  | "depth";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  lockedHint: string;
  tier: BadgeTier;
  category: BadgeCategory;
  icon: LucideIcon;
  evaluate: (data: BadgeEvalData) => boolean;
}

export interface BadgeEvalData {
  worldCount: number;
  worlds: { id: string; name: string; description?: string | null }[];
  worksheetCount: number;
  worksheetToolTypes: string[];
  writingEntryCount: number;
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  worksheetCascadePositions: string[];
  writingEntriesWithWorld: number;
  worldWorksheetCounts: Map<string, Set<string>>;
  worksheetTags: string[][];
  writingEntryTags: string[][];
  writingEntriesByWorld: Map<string, number>;
  // Phase 4: Social & Sharing
  shareLinkCount: number;
  totalShareViews: number;
  worldsWithCollaborators: number;
  acceptedInviteCount: number;
  // Phase 5: Mastery
  worksheetCountsByTool: Map<string, number>;
}

/** Map tool IDs to cascade positions for badge evaluation */
const TOOL_CASCADE_MAP = new Map(
  Object.values(TOOL_WIKI).map((t) => [t.id, t.cascade])
);

/** Tool types considered physics/environment in the cascade */
const PHYSICS_ENV_TOOLS = new Set([
  "environmental-chain-reaction",
  "star-system-builder",
  "planetary-profile",
  "habitable-zone-calculator",
  "surface-gravity-calculator",
  "time-dilation",
]);

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "world-born",
    name: "World Born",
    description: "Created your first world -a universe begins with a single act of will.",
    lockedHint: "Create your first world",
    tier: "nascent",
    category: "exploration",
    icon: Globe,
    evaluate: (data) => data.worldCount >= 1,
  },
  {
    id: "named-and-claimed",
    name: "Named and Claimed",
    description: "Gave a world both name and purpose. Identity precedes existence.",
    lockedHint: "Name a world and add a description",
    tier: "nascent",
    category: "exploration",
    icon: Bookmark,
    evaluate: (data) =>
      data.worlds.some(
        (w) => w.name.trim().length > 0 && w.description && w.description.trim().length > 0
      ),
  },
  {
    id: "first-words",
    name: "First Words",
    description: "Put words on the page. The hardest part is already behind you.",
    lockedHint: "Write your first entry in Writing Prompts",
    tier: "nascent",
    category: "exploration",
    icon: PenLine,
    evaluate: (data) => data.writingEntryCount >= 1,
  },
  {
    id: "first-contact",
    name: "First Contact",
    description: "Completed your first worksheet. The cascade has begun.",
    lockedHint: "Save your first worksheet in any tool",
    tier: "nascent",
    category: "exploration",
    icon: FileText,
    evaluate: (data) => data.worksheetCount >= 1,
  },
  {
    id: "the-first-law",
    name: "The First Law",
    description: "Established the physics of your universe. Everything else follows from here.",
    lockedHint: "Complete a worksheet in a physics or environment tool",
    tier: "forming",
    category: "depth",
    icon: Atom,
    evaluate: (data) =>
      data.worksheetToolTypes.some((t) => PHYSICS_ENV_TOOLS.has(t)),
  },
  {
    id: "three-days-hence",
    name: "Three Days Hence",
    description: "Maintained a 3-day writing streak. Consistency builds worlds.",
    lockedHint: "Achieve a 3-day writing streak",
    tier: "forming",
    category: "consistency",
    icon: Flame,
    evaluate: (data) =>
      data.currentStreak >= 3 || data.longestStreak >= 3,
  },
  {
    id: "systems-thinker",
    name: "Systems Thinker",
    description: "Used 5 different tools. You see the cascade -not just the pieces.",
    lockedHint: "Use 5 different tool types",
    tier: "stellar",
    category: "depth",
    icon: Network,
    evaluate: (data) => {
      const unique = new Set(data.worksheetToolTypes);
      return unique.size >= 5;
    },
  },
  {
    id: "week-one",
    name: "Week One",
    description: "Seven consecutive days of writing. You are no longer visiting -you live here.",
    lockedHint: "Achieve a 7-day writing streak",
    tier: "stellar",
    category: "consistency",
    icon: CalendarCheck,
    evaluate: (data) =>
      data.currentStreak >= 7 || data.longestStreak >= 7,
  },

  // ── Phase 2: Cascade Commendations ────────────────────────────

  // Nascent
  {
    id: "ten-thousand-words",
    name: "Ten Thousand Words",
    description: "Ten thousand words committed to the void. Your universe is taking shape.",
    lockedHint: "Write 10,000 total words",
    tier: "nascent",
    category: "consistency",
    icon: BookOpen,
    evaluate: (data) => data.totalWords >= 10_000,
  },
  {
    id: "world-builder",
    name: "World Builder",
    description: "Three worlds orbit your imagination. Each one a different question.",
    lockedHint: "Create 3 worlds",
    tier: "nascent",
    category: "exploration",
    icon: Layers,
    evaluate: (data) => data.worldCount >= 3,
  },

  // Forming
  {
    id: "cascade-initiate",
    name: "Cascade Initiate",
    description: "You've touched three layers of the cascade. Physics begets biology begets culture.",
    lockedHint: "Complete worksheets across 3 cascade layers",
    tier: "forming",
    category: "depth",
    icon: ArrowDownWideNarrow,
    evaluate: (data) => new Set(data.worksheetCascadePositions).size >= 3,
  },
  {
    id: "deep-dive",
    name: "Deep Dive",
    description: "Ten worksheets deep. You're no longer skimming the surface.",
    lockedHint: "Complete 10 worksheets",
    tier: "forming",
    category: "depth",
    icon: Microscope,
    evaluate: (data) => data.worksheetCount >= 10,
  },
  {
    id: "fortnight",
    name: "Fortnight",
    description: "Fourteen consecutive days of writing. The habit is becoming instinct.",
    lockedHint: "Achieve a 14-day writing streak",
    tier: "forming",
    category: "consistency",
    icon: Calendar,
    evaluate: (data) => data.currentStreak >= 14 || data.longestStreak >= 14,
  },

  // Stellar
  {
    id: "cascade-master",
    name: "Cascade Master",
    description: "Five layers of the cascade, woven together. Your world has internal logic.",
    lockedHint: "Complete worksheets across 5 cascade layers",
    tier: "stellar",
    category: "depth",
    icon: Workflow,
    evaluate: (data) => new Set(data.worksheetCascadePositions).size >= 5,
  },
  {
    id: "library",
    name: "The Library",
    description: "Ten worlds. You're building a library, not a book.",
    lockedHint: "Create 10 worlds",
    tier: "stellar",
    category: "exploration",
    icon: Library,
    evaluate: (data) => data.worldCount >= 10,
  },
  {
    id: "novelist",
    name: "Novelist",
    description: "Fifty thousand words -a novel's worth of worldbuilding prose.",
    lockedHint: "Write 50,000 total words",
    tier: "stellar",
    category: "consistency",
    icon: BookText,
    evaluate: (data) => data.totalWords >= 50_000,
  },
  {
    id: "polymath",
    name: "Polymath",
    description: "Ten different tools mastered. You see the whole system, not just the parts.",
    lockedHint: "Use 10 different tool types",
    tier: "stellar",
    category: "depth",
    icon: Compass,
    evaluate: (data) => new Set(data.worksheetToolTypes).size >= 10,
  },

  // Legendary
  {
    id: "cascade-complete",
    name: "Cascade Complete",
    description: "Every layer of the cascade -physics through culture -unified in service of your vision. Legendary.",
    lockedHint: "Complete all 6 cascade layers, build 3+ worlds, and write 5,000+ words",
    tier: "legendary",
    category: "depth",
    icon: Orbit,
    evaluate: (data) =>
      new Set(data.worksheetCascadePositions).size >= 6 &&
      data.worldCount >= 3 &&
      data.totalWords >= 5_000,
  },

  // ── Phase 3: Integration & Mastery ──────────────────────────────

  // Nascent
  {
    id: "linked-worlds",
    name: "Linked Worlds",
    description: "Connected your writing to a world. Words gain gravity when they have a home.",
    lockedHint: "Link a writing entry to a world",
    tier: "nascent",
    category: "exploration",
    icon: Link,
    evaluate: (data) => data.writingEntriesWithWorld >= 1,
  },
  {
    id: "tagged-and-sorted",
    name: "Tagged and Sorted",
    description: "Applied tags to your work. Organization is the first act of mastery.",
    lockedHint: "Add 2+ tags to any worksheet or writing entry",
    tier: "nascent",
    category: "exploration",
    icon: Tags,
    evaluate: (data) =>
      data.worksheetTags.some((t) => t.length >= 2) ||
      data.writingEntryTags.some((t) => t.length >= 2),
  },

  // Forming
  {
    id: "five-worlds",
    name: "Five Worlds",
    description: "Five universes, five questions, five answers the cosmos has never heard.",
    lockedHint: "Create 5 worlds",
    tier: "forming",
    category: "exploration",
    icon: Globe2,
    evaluate: (data) => data.worldCount >= 5,
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "One hundred thousand words. You've written a saga.",
    lockedHint: "Write 100,000 total words",
    tier: "forming",
    category: "consistency",
    icon: Scroll,
    evaluate: (data) => data.totalWords >= 100_000,
  },

  // Stellar
  {
    id: "month-one",
    name: "Month One",
    description: "Thirty consecutive days of writing. The craft is no longer a habit -it's who you are.",
    lockedHint: "Achieve a 30-day writing streak",
    tier: "stellar",
    category: "consistency",
    icon: CalendarRange,
    evaluate: (data) => data.currentStreak >= 30 || data.longestStreak >= 30,
  },
  {
    id: "architect",
    name: "Architect",
    description: "A single world explored through four different lenses. Depth over breadth.",
    lockedHint: "Use 4+ different tools on one world",
    tier: "stellar",
    category: "depth",
    icon: Building2,
    evaluate: (data) => {
      for (const toolSet of data.worldWorksheetCounts.values()) {
        if (toolSet.size >= 4) return true;
      }
      return false;
    },
  },
  {
    id: "chronicler",
    name: "Chronicler",
    description: "Five writing entries bound to a single world. You're building its history.",
    lockedHint: "Link 5+ writing entries to the same world",
    tier: "stellar",
    category: "depth",
    icon: BookMarked,
    evaluate: (data) => {
      for (const count of data.writingEntriesByWorld.values()) {
        if (count >= 5) return true;
      }
      return false;
    },
  },

  // Legendary
  {
    id: "lorekeeper",
    name: "Lorekeeper",
    description: "Ten worlds, a hundred thousand words, twenty worksheets. You are the keeper of lore. Legendary.",
    lockedHint: "Create 10+ worlds, write 100k+ words, and complete 20+ worksheets",
    tier: "legendary",
    category: "depth",
    icon: Crown,
    evaluate: (data) =>
      data.worldCount >= 10 &&
      data.totalWords >= 100_000 &&
      data.worksheetCount >= 20,
  },

  // ── Phase 4: Social & Sharing ──────────────────────────────────

  // Nascent
  {
    id: "first-share",
    name: "First Share",
    description: "Opened a window into your universe. Someone else can see what you've built.",
    lockedHint: "Create a share link for any worksheet or world",
    tier: "nascent",
    category: "exploration",
    icon: Share2,
    evaluate: (data) => data.shareLinkCount >= 1,
  },

  // Forming
  {
    id: "open-doors",
    name: "Open Doors",
    description: "Invited another mind into your world. Creation is richer when shared.",
    lockedHint: "Invite a collaborator to one of your worlds",
    tier: "forming",
    category: "exploration",
    icon: Users,
    evaluate: (data) => data.acceptedInviteCount >= 1,
  },
  {
    id: "signal-received",
    name: "Signal Received",
    description: "Your shared work has been viewed 10 times. The signal reached someone.",
    lockedHint: "Accumulate 10 views on your shared links",
    tier: "forming",
    category: "exploration",
    icon: Eye,
    evaluate: (data) => data.totalShareViews >= 10,
  },

  // Stellar
  {
    id: "ambassador",
    name: "Ambassador",
    description: "Three worlds with open doors. You're building a community, not just a cosmos.",
    lockedHint: "Have collaborators on 3+ worlds",
    tier: "stellar",
    category: "exploration",
    icon: Handshake,
    evaluate: (data) => data.worldsWithCollaborators >= 3,
  },

  // ── Phase 5: Mastery & Specialization ──────────────────────────

  // Forming
  {
    id: "specialist",
    name: "Specialist",
    description: "Five worksheets in one discipline. You've moved past dabbling into study.",
    lockedHint: "Complete 5+ worksheets with the same tool",
    tier: "forming",
    category: "depth",
    icon: Crosshair,
    evaluate: (data) => {
      for (const count of data.worksheetCountsByTool.values()) {
        if (count >= 5) return true;
      }
      return false;
    },
  },

  // Stellar
  {
    id: "full-spectrum",
    name: "Full Spectrum",
    description: "Every cascade layer touched -physics through culture. You see the whole frequency.",
    lockedHint: "Use tools from all 6 cascade layers",
    tier: "stellar",
    category: "depth",
    icon: Repeat,
    evaluate: (data) => new Set(data.worksheetCascadePositions).size >= 6,
  },
  {
    id: "deep-specialist",
    name: "Deep Specialist",
    description: "Ten worksheets in one tool. You've gone beyond mastery into instinct.",
    lockedHint: "Complete 10+ worksheets with the same tool",
    tier: "stellar",
    category: "depth",
    icon: Pickaxe,
    evaluate: (data) => {
      for (const count of data.worksheetCountsByTool.values()) {
        if (count >= 10) return true;
      }
      return false;
    },
  },

  // Legendary
  {
    id: "grandmaster",
    name: "Grandmaster",
    description: "Every tool used, every cascade layer explored, 50+ worksheets completed. You've mastered the forge. Legendary.",
    lockedHint: "Use all tool types, cover all cascade layers, and complete 50+ worksheets",
    tier: "legendary",
    category: "depth",
    icon: Gem,
    evaluate: (data) =>
      new Set(data.worksheetToolTypes).size >= 15 &&
      new Set(data.worksheetCascadePositions).size >= 6 &&
      data.worksheetCount >= 50,
  },
];

/** Quick lookup by badge ID */
export const BADGE_MAP = new Map(
  BADGE_DEFINITIONS.map((b) => [b.id, b])
);
