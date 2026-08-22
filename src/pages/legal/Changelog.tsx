import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TOTAL_TOOL_COUNT } from "@/lib/tools-config";

interface ChangelogEntry {
  version: string;
  date: string;
  type: "feature" | "improvement" | "fix" | "policy";
  title: string;
  changes: string[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "0.6950",
    date: "August 2026",
    type: "feature",
    title: "Your simulations reach the page",
    changes: [
      "Star names, planet names, orbital distances, and the constellations you draw and name yourself now appear in the writing inspector, one click from your prose. Until now a saved simulation sat in the database with no way into the manuscript.",
      "ExoSky's Save, Load, and Publish buttons work. They previously did nothing at all: the button asked the simulator for its state and nothing was listening, so no dialog ever opened and no error was shown.",
      "ExoSky saves keep your vantage point, where you were looking, your display settings, and every constellation you named, and restore all of it.",
      "A named constellation inserts its name into your prose rather than its star count.",
    ],
  },
  {
    version: "0.6941",
    date: "August 2026",
    type: "improvement",
    title: "One word for a world",
    changes: [
      "The site called the same thing a project in some places and a world in others. It is a world everywhere now.",
      "Studio sits next to Worlds in the main menu instead of fourth behind About.",
      "The continuity checker gained a second tier. It now flags prose that contradicts the physical conditions your world runs under, not just its recorded numbers: a sunrise on a tidally locked world, rain on a world with no water, a casual stroll at three gravities. Each note explains the physics rather than just objecting.",
      "The writing surfaces read in one voice. World pages, the codex, and the studio log now use sentence case and plain language instead of tracked capitals.",
      "The studio log varies its verbs instead of saying every document was \"touched\".",
    ],
  },
  {
    version: "0.6922",
    date: "August 2026",
    type: "fix",
    title: "Index cards were reading blank",
    changes: [
      "Document metadata was never actually fetched, so synopsis, POV, status, and in-world date all read as empty no matter what you had entered. Every corkboard card and the metadata bar were affected.",
      "Find and replace in the editor, with case sensitivity and whole-word matching.",
      "The corkboard: your manuscript as index cards, grouped by chapter, dragged to reorder.",
      "Filing a document into a chapter from the binder.",
    ],
  },
  {
    version: "0.6908",
    date: "August 2026",
    type: "feature",
    title: "Your world can answer back",
    changes: [
      "Continuity checking: a new Check tab in the writing inspector compares your prose against the numbers your tools recorded. Write a gravity, a day length, or a population that contradicts your own worldbuilding and it says so, showing both figures and never blocking, because breaking your own rules on purpose is allowed.",
      "Index-card fields on every document: synopsis, POV character, draft status, and in-world date, collapsed to a single line above the prose.",
      "The writing footer now shows progress toward your daily goal instead of an astronomical date.",
      "The world page opens quieter. Secondary panels (worksheets, elements, tools, notes, history) collapse into one rail, so a world opens on where you left off rather than a wall of panels.",
    ],
  },
  {
    version: "0.6896",
    date: "August 2026",
    type: "improvement",
    title: "One voice, fewer buttons",
    changes: [
      "The world toolbar went from nine controls to four. Export, Export View, World Bible, and Snapshot were four separate buttons doing one job; they now live under a single Export menu.",
      "The StellarForge wordmark rendered four different ways across the site. It is now one lockup everywhere.",
      "The Codex sidebar reads in the writer's voice, with cascade layers, your world's name, and recent edits in sentence case rather than tracked capitals.",
      "Background picker no longer shows a grid of empty preview tiles when animated backdrops are unavailable.",
    ],
  },
  {
    version: "0.6885",
    date: "August 2026",
    type: "feature",
    title: "Tool data reaches the page",
    changes: [
      "Real values from your tools now appear in the writing inspector's Refs panel, with one click to drop them into your prose: a planet's surface gravity, a drive's cruise velocity, a species' biochemistry.",
      "Pinning a worksheet to your writing space shows its actual values instead of a description of the tool.",
      "Export a single document to Word, Markdown, or plain text from the editor.",
      "Compile can append a world reference chapter to the manuscript.",
      "Thirteen tools now expose their recorded values to the writing surface.",
    ],
  },
  {
    version: "0.6864",
    date: "August 2026",
    type: "fix",
    title: "Editor correctness",
    changes: [
      "Folders appear in the binder. Creating one previously wrote a row you could never see.",
      "The binder no longer reshuffles while you type. Documents stay where you dragged them.",
      "Switching documents mid-sentence no longer misattributes your word count to the wrong document.",
      "The save indicator advances instead of freezing at \"1s ago\", renaming a document updates its title immediately, and a failed save now tells you rather than failing silently.",
      "Closing a tab no longer loses the last second of typing.",
      "Daily word totals are recorded atomically, so two open tabs no longer overwrite each other's progress.",
    ],
  },
  {
    version: "0.6854",
    date: "August 2026",
    type: "improvement",
    title: "Readability pass",
    changes: [
      "Raised text contrast across the interface. Helper and label text was set for a dark studio and washed out on ordinary monitors.",
      "Larger type throughout. The interface leaned on 9-12px text in nearly two thousand places.",
      "Buttons, inputs, and controls sized for comfortable clicking.",
      "Tool counts, names, and links now come from one source, so the catalog can no longer disagree with itself between pages.",
      "Fixed a decorative layer that added roughly 1,200 pixels of empty scroll below the footer on every page.",
      "Restored error reporting, which had been silently blocked in production.",
    ],
  },
  {
    version: "0.1.0",
    date: "February 2026",
    type: "feature",
    title: "Initial Public Release",
    changes: [
      "Launch of the StellarForge.tools worldbuilding platform",
      `${TOTAL_TOOL_COUNT} interactive worldbuilding tools and simulators`,
      "World dashboard with connections and notes",
      "Pro subscription tier with advanced features",
      "Privacy Policy and Terms of Service published",
      "Cookie consent with opt-out functionality",
    ],
  },
];

const typeStyles: Record<ChangelogEntry["type"], { bg: string; text: string; label: string }> = {
  feature: { bg: "bg-green-500/20", text: "text-green-400", label: "New Feature" },
  improvement: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Improvement" },
  fix: { bg: "bg-amber-500/20", text: "text-sf-amber", label: "Bug Fix" },
  policy: { bg: "bg-purple-500/20", text: "text-purple-400", label: "Policy Update" },
};

const Changelog = () => {
  return (
    <LegalPageLayout
      title="Changelog"
      subtitle="What's new in StellarForge. Track updates, new features, and policy changes."
      lastUpdated="August 2026"
      badgeIcon={<History className="w-3 h-3 mr-1" />}
      badgeText="Updates"
    >
      <div className="space-y-10 not-prose">
        {changelog.map((entry) => {
          const style = typeStyles[entry.type];
          return (
            <section key={entry.version} className="relative">
              {/* Version header */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h2 className="font-heading text-2xl font-medium text-t1">
                  v{entry.version}
                </h2>
                <Badge className={`${style.bg} ${style.text} border-0`}>
                  {style.label}
                </Badge>
                <span className="text-sm text-t3">{entry.date}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-medium text-t1 mb-3">{entry.title}</h3>

              {/* Changes list */}
              <ul className="space-y-2">
                {entry.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-t2 leading-relaxed">
                    <span className="mt-1.5 shrink-0 text-primary">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {/* Future updates notice */}
        <section className="pt-8 border-t border-sf-line-interactive">
          <p className="text-t3 text-center">
            Subscribe to our{" "}
            <a
              href="https://xenomythology.substack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Substack
            </a>{" "}
            for updates on new features and worldbuilding content.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default Changelog;
