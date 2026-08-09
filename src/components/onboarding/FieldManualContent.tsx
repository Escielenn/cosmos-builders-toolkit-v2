import { createContext, useContext } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { resetAllHints } from "@/lib/onboarding/hints";

// ---------------------------------------------------------------------------
// Scale variant
//
// The same content serves two surfaces: a narrow slide-over sheet, where
// compact 12px type is right, and the full /guide/field-manual page, where
// that same type would render a whole reference document at overlay scale
// (with headers smaller than their own body copy). "page" reads at document
// scale per the CLAUDE.md type ramp; "sheet" keeps the compact treatment.
// ---------------------------------------------------------------------------

type ManualScale = "sheet" | "page";

const ManualScaleContext = createContext<ManualScale>("sheet");

const useManualScale = () => useContext(ManualScaleContext);

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

export function ManualSection({ title, children }: { title: string; children: React.ReactNode }) {
  const scale = useManualScale();
  const isPage = scale === "page";

  return (
    <div className={isPage ? "mb-8" : "mb-5"}>
      <h3
        className={
          isPage
            ? "font-heading text-sm font-light uppercase tracking-[3px] text-sf-emerald mb-3"
            : "font-heading text-[11px] uppercase tracking-[2px] text-t1 mb-1.5"
        }
      >
        {title}
      </h3>
      <div
        className={
          isPage
            ? "text-sm text-t2 leading-relaxed space-y-2"
            : "text-[12px] text-t3 leading-relaxed space-y-1.5 pl-0.5"
        }
      >
        {children}
      </div>
    </div>
  );
}

export function ManualDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-6 pb-3">
      <div className="h-px flex-1 bg-border/20" />
      <span className="font-mono text-[8px] uppercase tracking-[3px] text-primary/40 whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-border/20" />
    </div>
  );
}

export function ManualKeyLine({ keys, description }: { keys: string; description: string }) {
  const isPage = useManualScale() === "page";

  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-mono text-primary/70 w-40 shrink-0 ${
          isPage ? "text-xs" : "text-[11px]"
        }`}
      >
        {keys}
      </span>
      <span className={isPage ? "text-sm" : "text-[12px]"}>{description}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full content, used by both FieldManualSheet and Guide.tsx
// ---------------------------------------------------------------------------

export function FieldManualContent({ scale = "sheet" }: { scale?: ManualScale } = {}) {
  const { toast } = useToast();

  const handleResetHints = () => {
    resetAllHints();
    toast({
      title: "HINTS RESET.",
      description: "All onboarding hints will appear again on next encounter.",
    });
  };

  return (
    <ManualScaleContext.Provider value={scale}>
      <ManualDivider label="Navigation Systems" />

      <ManualSection title="Registry">
        <p>
          Primary world index. Tracks all elements across seven cascade
          layers: environment, biology, psychology, culture, mythology,
          technology, and narrative. Click entries to navigate between
          tools and wiki pages.
        </p>
        <p className="font-mono text-[10px] text-t3/50">
          Completion indicators: ● surveyed&ensp;◐ partial&ensp;○ pending
        </p>
      </ManualSection>

      <ManualSection title="Default View">
        <p>
          Registry footer toggle. TOOL mode opens the worksheet editor.
          WIKI mode opens the encyclopedia page. Setting persists per world.
          Custom entries without a tool source default to wiki.
        </p>
      </ManualSection>

      <ManualDivider label="Survey Instruments" />

      <ManualSection title="Wiki Pages">
        <p>
          Each survey instrument generates an encyclopedia entry. Content
          editor supports freeform prose below the Data Profile.
        </p>
        <p>
          Type <span className="font-mono text-primary/50">{`[[`}</span> to
          cross-reference other elements. Links become navigable connections
          in the world graph.
        </p>
        <p>
          Dead links render as strikethrough when referenced entries are
          deleted. The "Referenced By" section tracks backlinks automatically.
        </p>
      </ManualSection>

      <ManualSection title="Data Profiles">
        <p>
          Auto-generated parameter summary from instrument data. Edit the
          source worksheet to update. Wiki page and tool data remain
          synchronized.
        </p>
      </ManualSection>

      <ManualSection title="Chronicle">
        <p>
          Vertical timeline. Log events, eras, and sub-events with dates
          and descriptions. Events can be categorized by type (event, era,
          war, discovery, founding, death, custom).
        </p>
        <p>
          Gap detection flags temporal lacunae: unusually large stretches
          between events. Sub-events nest under parent events for
          hierarchical organization.
        </p>
      </ManualSection>

      <ManualSection title="Tagging">
        <p>
          Classification tags span all worlds. Shared across your archive.
          Auto-assigned colors. Type in any tag input to search existing
          tags or create new ones.
        </p>
      </ManualSection>

      <ManualDivider label="Communications" />

      <ManualSection title="Link Sharing">
        <p>
          Toggle to generate a read-only link for any worksheet or world.
          Regenerate token to invalidate previous links. View count tracked
          per share.
        </p>
      </ManualSection>

      <ManualSection title="Collaborator Access (Pro)">
        <p>
          Invite editors or viewers by email. Three access tiers enforce
          permissions: Owner (full control), Editor (create and modify),
          Viewer (read-only). Invites expire. Resend or cancel from the
          share panel.
        </p>
      </ManualSection>

      <ManualSection title="Connections & Graph">
        <p>
          Wiki-links generate connection suggestions with typed relationships
          (lives_on, evolved_from, governs, etc.). Accept to register a
          formal link. The World Graph visualizes all registered connections
          as an interactive node map.
        </p>
      </ManualSection>

      <ManualDivider label="Ship Configuration" />

      <ManualSection title="World Appearance">
        <p>
          Accent colors, cover images, world icons. Pro users can set custom
          themes per world, including background images and gradients.
        </p>
      </ManualSection>

      <ManualSection title="Keyboard Shortcuts">
        <div className="mt-1 space-y-0.5">
          <ManualKeyLine keys="Ctrl / Cmd + K" description="Global search" />
          <ManualKeyLine keys="Ctrl / Cmd + Z" description="Undo (in editors)" />
          <ManualKeyLine keys="Ctrl / Cmd + Shift + Z" description="Redo (in editors)" />
          <ManualKeyLine keys="[[" description="Wiki-link autocomplete" />
        </div>
      </ManualSection>

      <ManualDivider label="System Operations" />

      <ManualSection title="Hint System">
        <p>
          First-encounter hints appear once per feature. Dismiss individually
          via the X control, or reset all below to re-enable.
        </p>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-[10px] uppercase tracking-wider"
            onClick={handleResetHints}
          >
            <RotateCcw className="w-3 h-3" />
            Reset All Hints
          </Button>
        </div>
      </ManualSection>
    </ManualScaleContext.Provider>
  );
}
