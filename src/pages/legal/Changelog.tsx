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
    version: "0.7342",
    date: "August 2026",
    type: "improvement",
    title: "Interface consistency pass",
    changes: [
      "Save, Load, and Publish now behave and look the same way in the same order across all five simulators, instead of each one doing it slightly differently.",
      "Pro badges were two different visual styles depending on which page you were on. Now there's one.",
      "Tool counts across the site now always match the real number instead of drifting out of sync as new tools were added.",
      "Worlds, Collection, the wiki index, and World Connections now read in the same warmer voice as Studio and the writing surface, instead of switching to a colder, more clinical tone partway through your session.",
    ],
  },
  {
    version: "0.7330",
    date: "August 2026",
    type: "fix",
    title: "Simulators run smoother",
    changes: [
      "ExoSky's night sky used to visibly stutter while you dragged or zoomed around, especially with a lot of stars on screen. The star field render was doing far more work than it needed to. Fixed, and dragging now feels as smooth as sitting still.",
      "ExoForge's planet could jump or spin oddly if you switched away and came back to the tab. Fixed.",
      "Tidelock's zoom now feels the same regardless of your monitor's refresh rate.",
      "All five simulators now work properly on a phone: buttons are big enough to tap, text is legible, and panels no longer cover the thing you're trying to look at.",
      "Rogue's control panel and playback controls (launch, pause, step, rewind) are laid out consistently with the other simulators now, instead of crowding the bottom-left corner.",
    ],
  },
  {
    version: "0.7317",
    date: "August 2026",
    type: "fix",
    title: "Your wiki pages were hiding your data",
    changes: [
      "Wiki pages for planets, species, ships, and more were carrying over almost none of the data you'd entered in the actual tool. A mismatch between two different maps of where that data lives meant most fields came back empty, and a couple even showed the literal text \"[object Object]\" instead of your content. Fixed across nine tools.",
      "Clicking a node in the Worksheet Graph used to do nothing, even though it promised to open that worksheet. It opens the worksheet now. The graph also explains itself when your worksheets exist but nothing links them together yet, instead of just showing a scatter of disconnected dots.",
      "The Mind Map view and every wiki page also got a contrast and legibility pass, matching the rest of the site.",
    ],
  },
  {
    version: "0.7305",
    date: "August 2026",
    type: "feature",
    title: "Publish a planet, and it travels with you",
    changes: [
      "Build a system in Solaris, publish a planet, and open it directly in ExoSky or Tidelock, already loaded, without re-entering a single number.",
    ],
  },
  {
    version: "0.7295",
    date: "August 2026",
    type: "fix",
    title: "A pass through the loose ends",
    changes: [
      "Saving a worksheet from a tool page with no worlds yet was a dead end. You can now create a world right from that dialog.",
      "\"Pin to References\" said it worked but didn't actually save anything. It saves now.",
      "Deleting a document forever now asks you to confirm first, matching how every other destructive action on the site already works.",
      "A few places had two buttons doing the same job with slightly different behavior, Export most of all. Unified.",
      "Studio's daily writing goal can now be set right from its own footer, instead of only from the separate Workshop page.",
      "Assorted toasts and menu labels that mixed SHOUTING CAPS with ordinary sentence case in the same breath, smoothed out.",
    ],
  },
  {
    version: "0.7275",
    date: "August 2026",
    type: "improvement",
    title: "Readability, continued",
    changes: [
      "A sitewide pass fixed the small-text, low-contrast, and hard-to-see-edge issues the first readability pass hadn't reached yet: worksheet tool pages, the writing surface, the wiki, the World Connections graph and Mind Map, and every simulator's control panel.",
      "Every button, input, and panel edge now meets accessibility contrast guidelines, checked against their real backgrounds rather than assumed.",
      "Text no longer renders smaller than a comfortable reading size anywhere on the site, with the one deliberate exception of faint background texture that was never meant to be read.",
    ],
  },
  {
    version: "0.7225",
    date: "August 2026",
    type: "feature",
    title: "Rogue and Solaris, sharper controls",
    changes: [
      "Rogue rebuilt as a native part of the site rather than an embedded page, on the same tested physics underneath: launch, pause, step frame by frame, rewind, and inspect or follow any body with the camera.",
      "Rogue and Solaris now share one keyboard: space to play or pause, number keys for camera views, and a few more, so learning one teaches you the other.",
      "Rogue gained gravity vectors, arrows showing the actual pull each body feels, alongside the existing gravity lines. Solaris gained drag-to-reorbit and real planet textures.",
      "Object labels in Rogue used to stop growing partway through the zoom range, so names became unreadable at high zoom even though everything else kept scaling. Fixed.",
      "Solaris now has its own science page, laying out the orbital mechanics and the habitable-zone math it actually runs on, with citations.",
    ],
  },
  {
    version: "0.7214",
    date: "August 2026",
    type: "fix",
    title: "Behind the scenes: reliability and security",
    changes: [
      "PDF export (Preview and Download) was crashing on every attempt over a font-embedding issue. It now uses a font built into the PDF format itself, so there's nothing to fail.",
      "The Check tab, which compares your prose against the numbers your tools recorded, could get confused in worlds with more than one planet and flag a contradiction that wasn't really there. Fixed.",
      "A routine security review tightened access on a few backend functions that had gaps, and confirmed the rest were already sound.",
    ],
  },
  {
    version: "0.7140",
    date: "August 2026",
    type: "feature",
    title: "More of your tools reach the page",
    changes: [
      "Nine more tools now send their numbers into the writing inspector: propulsion travel times, your world's one big lie, a conlang's drift over centuries, gravity and spin for a rotating habitat, an expansion's dominant force and story hooks, and more.",
      "Sensorium and Timeline join them. A timeline's events show up as individual, quotable facts now, not a single collapsed blob.",
      "Every worksheet, not just simulators, can now be attached to a world from the tool itself.",
      "The Check tab can compare your prose against a saved simulation too, not just your worksheets, so a described gravity that contradicts your own Tidelock or ExoForge save gets caught as well.",
    ],
  },
  {
    version: "0.7130",
    date: "August 2026",
    type: "fix",
    title: "Saving and publishing simulations, made reliable",
    changes: [
      "Publishing a simulation to a world used to arrive with just its name and nothing else, no matter what the simulator actually showed. It now arrives with everything the simulator recorded.",
      "The save toolbar could be gated behind the very thing it was meant to let you set, and a saved simulation could fail to reach the world it was saved to. Both fixed.",
    ],
  },
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
