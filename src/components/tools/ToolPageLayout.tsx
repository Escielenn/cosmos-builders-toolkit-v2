/**
 * ToolPageLayout, Canonical layout wrapper for all 21 worksheet tool pages.
 *
 * Enforces consistent structure: header → sticky action bar → [content | rail].
 * The content column holds quote → intro → children → cascade footer; the one
 * right rail (tool-rail.tsx, "Sections | Readout") is sticky at xl and a
 * drawer below it. Under ProToolGuard's preview the page is read-only, cut
 * after its first section, with the clearance panel in the rail's place.
 *
 * Spec: StellarForge_Layout_Normalization_Spec_Apr2926.md
 */

import { type CSSProperties, type ReactNode, useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import SubjectEntityBanner from "@/components/tools/SubjectEntityBanner";
import { useSearchParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-chrome";
import { useWorld } from "@/hooks/use-world";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { getToolAccent } from "@/lib/tool-accents";
import CascadeSuggestionToast from "@/components/tools/CascadeSuggestionToast";
import UpstreamCallout from "@/components/tools/UpstreamCallout";
import PageShell from "@/components/layout/PageShell";
import { MainLandmark } from "@/components/layout/MainLandmark";
import { PageBursts } from "@/components/ui/data-burst";
import { TOOL_PAGE_BURSTS } from "@/lib/data-bursts";
import { ToolPageQuote } from "@/components/quotes/ToolPageQuote";
import ToolActionBar from "@/components/tools/ToolActionBar";
import { CascadeFooter } from "@/components/tools/CascadeFooter";
import ToolIntroSection from "@/components/tools/ToolIntroSection";
import { TOOL_INTROS } from "@/lib/tool-intros";
import { WorksheetTitle } from "@/components/tools/WorksheetTitle";
import { WorksheetTagsBar } from "@/components/tools/WorksheetTagsBar";
import { getToolIcon } from "@/components/icons/tool-icons";
import { getToolPageConfig } from "@/lib/tool-page-config";
import { useWorldId } from "@/hooks/use-world-id";
import { useAuth } from "@/contexts/AuthContext";
import SaveToWorldDialog from "@/components/tools/SaveToWorldDialog";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { PinToWritingButton } from "@/components/tools/PinToWritingButton";
import { useWorksheets } from "@/hooks/use-worksheets";
import { extractWorksheetFacts, summarizeFacts } from "@/lib/worksheet-facts";
import { ProBadge } from "@/components/ui/pro-badge";
import { ToolWorldBar } from "@/components/tools/ToolWorldBar";
import { useIsWorldLayout } from "@/contexts/WorldLayoutContext";
import { useToolPreview } from "@/contexts/ToolPreviewContext";
import { ToolRail, ToolRailProvider, ToolRailTrigger, useToolRailState } from "@/components/tools/tool-rail";

// ─── Props ───────────────────────────────────────────────────────────

interface ToolPageLayoutProps {
  /** Tool slug, e.g. "planetary-profile". Config is looked up from tool-page-config.ts. */
  toolType: string;

  // ── Action bar callbacks (tool-specific) ─────────────────────────
  onSave: () => void;
  onPrint: () => void;
  onExport: () => void;
  onShare?: () => void;
  onOpen?: () => void;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  isShared?: boolean;
  isCloudEnabled?: boolean;
  /** Slot for QuickExportButton, rendered inside the action bar */
  extraActions?: ReactNode;
  onNotesClick?: () => void;
  onMoodboardClick?: () => void;
  moodboardCount?: number;

  // ── Worksheet context (optional) ─────────────────────────────────
  worksheetId?: string | null;
  worksheetTitle?: string | null;
  onRenameWorksheet?: (title: string) => Promise<void>;
  worksheetLoading?: boolean;
  worksheetTags?: string[];
  onTagsChange?: (tags: string[]) => void;
  /** Custom icon for the worksheet title (defaults to FileText) */
  worksheetIcon?: ReactNode;

  /** Whether the user is logged in (used for worksheet rename disabled state) */
  isLoggedIn?: boolean;

  /**
   * The "no world open" bar, shown above the tool's content whenever no world
   * is bound (one way to bind a world, in every instrument). Pass a reason to
   * say why this tool wants one, or false where the page places its own.
   */
  worldBar?: false | { reason?: string; accent?: WorldBarAccent };

  /** Optional className on the PageShell */
  pageShellClassName?: string;

  /** Everything below the intro section: CollapsibleSections, sidebars, etc. */
  children: ReactNode;
}

type WorldBarAccent = NonNullable<Parameters<typeof ToolWorldBar>[0]["accent"]>;

const DEFAULT_WORLD_BAR_REASON = "WORKSHEETS ARE FILED TO A WORLD. CHOOSE ONE.";

// ─── Component ───────────────────────────────────────────────────────

/**
 * Chooses a world when Save is pressed on a tool that has none.
 *
 * Every tool page's own handleSave reads `if (worldId && user)` and otherwise
 * falls back to localStorage with a "saved locally" toast. That is a dead end:
 * the work never reaches a world, so the writing surface cannot see it and it
 * dies with the browser cache.
 *
 * Fixed here rather than in 21 tool pages. The layout owns the Save button, and
 * every page already resolves its world from the `worldId` search param, so
 * setting that param is enough to turn the page's own save into a cloud save.
 * The pending flag then fires the real save once the world is live, because
 * `onSave` closes over the old world id and calling it immediately would still
 * take the local path.
 */
function useSaveWorldGate(
  onSave: () => void,
  isCloudEnabled: boolean | undefined,
  hasWorld: boolean,
) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [chosenWorld, setChosenWorld] = useState<string | undefined>(undefined);
  const [pendingSave, setPendingSave] = useState(false);

  useEffect(() => {
    if (!pendingSave || !isCloudEnabled) return;
    setPendingSave(false);
    onSave();
  }, [pendingSave, isCloudEnabled, onSave]);

  const requestSave = () => {
    // Signed out, or already attached to a world: nothing to ask.
    if (hasWorld || !user) {
      onSave();
      return;
    }
    setPickerOpen(true);
  };

  const confirm = () => {
    if (!chosenWorld) return;
    setPickerOpen(false);
    setPendingSave(true);
    const next = new URLSearchParams(searchParams);
    next.set("worldId", chosenWorld);
    setSearchParams(next, { replace: true });
  };

  return { requestSave, pickerOpen, setPickerOpen, chosenWorld, setChosenWorld, confirm };
}

export default function ToolPageLayout({
  toolType,
  onSave,
  onPrint,
  onExport,
  onShare,
  onOpen,
  hasUnsavedChanges,
  isSaving,
  isShared,
  isCloudEnabled,
  extraActions,
  onNotesClick,
  onMoodboardClick,
  moodboardCount,
  worksheetId,
  worksheetTitle,
  onRenameWorksheet,
  worksheetLoading,
  worksheetTags,
  onTagsChange,
  worksheetIcon,
  isLoggedIn = false,
  worldBar,
  pageShellClassName,
  children,
}: ToolPageLayoutProps) {
  const cfg = getToolPageConfig(toolType);
  const worldId = useWorldId();
  const saveGate = useSaveWorldGate(onSave, isCloudEnabled, !!worldId);
  // Inside WorldLayout the frame already clears the site header and world
  // nav (and .sf-tool-content pads 24px), so the 96px header offset would
  // push the H1 a screen down (15-PAGE-CHROME §1).
  const inWorldLayout = useIsWorldLayout();
  // Pro preview (ProToolGuard, finding 15): read-only, nothing saves.
  const { readOnly, clearance } = useToolPreview();
  // The one right rail (finding 14): Sections | Readout.
  const rail = useToolRailState();

  // QoL: warn before closing the tab on unsaved work, and Ctrl/Cmd+S saves
  // from anywhere on a tool page (it used to open the browser's save dialog).
  useUnsavedChangesGuard(!readOnly && !!hasUnsavedChanges);
  const requestSaveRef = useRef(saveGate.requestSave);
  requestSaveRef.current = saveGate.requestSave;
  useEffect(() => {
    if (readOnly) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        requestSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readOnly]);
  const ToolIcon = getToolIcon(toolType);
  const introData = TOOL_INTROS[cfg.introKey];
  const accent = getToolAccent(toolType);
  const { data: world } = useWorld(worldId ?? undefined);

  // Pin preview from the saved worksheet's real values, not the tool's
  // marketing subtitle — pinning "Genesis: Planetary Profile" used to show a
  // product blurb in the writing space instead of the planet's gravity.
  const { worksheets } = useWorksheets(worldId);
  const pinSummary = useMemo(() => {
    if (!worksheetId) return "";
    const sheet = (worksheets ?? []).find((w) => w.id === worksheetId);
    if (!sheet) return "";
    return summarizeFacts(extractWorksheetFacts(sheet.tool_type, sheet.data));
  }, [worksheets, worksheetId]);

  useMetaTags({
    title: `${cfg.brandName}: ${cfg.fullName}`,
    description: cfg.subtitle,
  });

  // Track save completion to show cascade suggestions
  const [showCascadeSuggestion, setShowCascadeSuggestion] = useState(false);
  const prevSaving = useRef(false);
  useEffect(() => {
    // Detect save completion: isSaving went from true → false
    if (prevSaving.current && !isSaving) {
      setShowCascadeSuggestion(true);
    }
    prevSaving.current = !!isSaving;
  }, [isSaving]);

  const showAside = readOnly || rail.hasRail;

  return (
    <ToolRailProvider state={rail}>
    <PageShell className={pageShellClassName}>
      <MainLandmark
        className={`relative container mx-auto px-4 pb-16 ${inWorldLayout ? "pt-2" : "pt-24"}`}
        style={inWorldLayout ? WORLD_STICKY_VARS : STANDALONE_STICKY_VARS}
      >
        <PageBursts bursts={TOOL_PAGE_BURSTS[toolType]} />

        {/* ── Header (15-PAGE-CHROME): breadcrumbs in a world, back to Tools outside ── */}
        <PageHeader
          accent={accent}
          eyebrow={`${accent.toUpperCase()} · ${cfg.brandName.toUpperCase()}`}
          titleLead={`${cfg.brandName}:`}
          title={cfg.fullName}
          icon={ToolIcon ? <ToolIcon className="h-10 w-10 rounded-none" /> : undefined}
          badge={cfg.isPro ? <ProBadge /> : undefined}
          lede={cfg.subtitle}
          size={worldId ? "space" : "page"}
          breadcrumbs={
            worldId
              ? [
                  { label: world?.name ?? "World", to: `/worlds/${worldId}` },
                  { label: "Instruments", to: `/worlds/${worldId}/tools` },
                  { label: cfg.brandName },
                ]
              : undefined
          }
          back={worldId ? undefined : { label: "Back to tools", to: "/tools" }}
        >
          {/* Worksheet title + tags (shown when a worksheet is loaded) */}
          {worksheetId && onRenameWorksheet && (
            <WorksheetTitle
              title={worksheetTitle ?? null}
              onRename={onRenameWorksheet}
              icon={worksheetIcon ?? <FileText className="w-4 h-4 text-primary" />}
              disabled={!isLoggedIn || worksheetLoading}
            />
          )}
          {worksheetId && onTagsChange && (
            <WorksheetTagsBar
              worksheetId={worksheetId}
              tags={worksheetTags ?? []}
              onChange={onTagsChange}
            />
          )}
        </PageHeader>

        {!readOnly && (
        <>
        {/* ── Subject (Brief F4): the entity this instrument is open on ── */}
        <SubjectEntityBanner worldId={worldId} />

        {/* ── Action Bar (sticky; carries the rail button below xl) ── */}
        <ToolActionBar
          onSave={saveGate.requestSave}
          onOpen={onOpen}
          onPrint={onPrint}
          onExport={onExport}
          onShare={onShare}
          exportLabel={cfg.exportLabel}
          className="mb-6"
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          isShared={isShared}
          isCloudEnabled={isCloudEnabled}
          extraActions={extraActions}
          onNotesClick={onNotesClick}
          onMoodboardClick={onMoodboardClick}
          moodboardCount={moodboardCount}
          worldId={worldId}
          worksheetId={worksheetId ?? undefined}
          railTrigger={<ToolRailTrigger state={rail} />}
        />

        {/* ── Pin to Writing Space (only when inside a world with a saved worksheet) */}
        {worldId && worksheetId && (
          <PinToWritingButton
            worldId={worldId}
            itemId={worksheetId}
            itemType="worksheet"
            title={`${cfg.brandName}: ${cfg.fullName}`}
            content={pinSummary || cfg.subtitle}
            className="mb-2 -mt-3"
          />
        )}
        </>
        )}

        {/* ── Content + the one right rail (sticky at xl, drawer below) ── */}
        <div
          className={
            showAside
              ? "flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:items-start xl:gap-8"
              : undefined
          }
        >
          <div className="min-w-0">
            {/* ── Quote Bar ─────────────────────────────────────── */}
            {!readOnly && <ToolPageQuote toolId={toolType} />}

            {/* ── Intro Section (standard for all tools) ────────── */}
            {introData && <ToolIntroSection data={introData} />}

            {/* ── Upstream Context Callouts (only when inside a world) */}
            {!readOnly && worldId && <UpstreamCallout toolType={toolType} worldId={worldId} />}

            {/* ── No world bound: the one place to bind one ─────── */}
            {!readOnly && !worldId && worldBar !== false && (
              <ToolWorldBar
                accent={worldBar?.accent ?? (accent === "crimson" ? "teal" : accent)}
                reason={worldBar?.reason ?? DEFAULT_WORLD_BAR_REASON}
              />
            )}

            {/* ── Tool-specific content ─────────────────────────── */}
            {readOnly ? <PreviewClip>{children}</PreviewClip> : children}

            {/* ── The cascade: what this tool builds on / feeds into ── */}
            {!readOnly && <CascadeFooter toolType={toolType} />}
          </div>

          {readOnly ? (
            // Phones: the clearance panel comes first, then the preview.
            <div className="order-first mb-8 xl:order-none xl:mb-0 xl:sticky xl:top-[var(--sf-rail-top)] xl:max-h-[var(--sf-rail-max)] xl:overflow-y-auto sf-sb">
              {clearance}
              <ToolRail state={rail} variant="preview" />
            </div>
          ) : (
            <ToolRail state={rail} />
          )}
        </div>
      </MainLandmark>

      {/* ── Cascade Suggestion (after save) ──────────────────── */}
      <CascadeSuggestionToast
        toolType={toolType}
        worldId={worldId}
        visible={showCascadeSuggestion}
        onDismiss={() => setShowCascadeSuggestion(false)}
      />

      {/* ── Which world does this belong to? ──────────────────── */}
      <SaveToWorldDialog
        open={saveGate.pickerOpen}
        onOpenChange={saveGate.setPickerOpen}
        value={saveGate.chosenWorld}
        onChange={saveGate.setChosenWorld}
        onConfirm={saveGate.confirm}
        toolName={cfg.fullName}
      />
    </PageShell>
    </ToolRailProvider>
  );
}

// ─── Sticky offsets ──────────────────────────────────────────────────
// Standalone pages scroll the window under the 64px site header; inside a
// world the page scrolls in .sf-world-main, below the header and world nav.
// The action bar sticks at --sf-tool-sticky-top, the rail one bar lower.
const STANDALONE_STICKY_VARS = {
  "--sf-tool-sticky-top": "4rem",
  "--sf-rail-top": "8.5rem",
  "--sf-rail-max": "calc(100dvh - 10rem)",
} as CSSProperties;

const WORLD_STICKY_VARS = {
  "--sf-tool-sticky-top": "0px",
  "--sf-rail-top": "4.5rem",
  "--sf-rail-max": "calc(100dvh - 13rem)",
} as CSSProperties;

// ─── Pro preview ─────────────────────────────────────────────────────

const INERT = { inert: "" } as Record<string, string>;

/**
 * The tool's own page, read-only and cut after its first section. The
 * fieldset disables every native control (the global :disabled rule paints
 * them in the sf-disabled tokens, never opacity); `inert` takes the rest
 * (sliders, custom widgets) out of focus and pointer reach. overflow-clip,
 * not overflow-hidden, so nothing can scroll the hidden sections into view.
 */
function PreviewClip({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(720);

  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const measure = () => {
      const first = box.querySelector<HTMLElement>("[data-sf-section]");
      if (!first) return;
      const top = first.getBoundingClientRect().top - box.getBoundingClientRect().top;
      const next = Math.max(320, Math.round(top + first.offsetHeight + 96));
      setHeight((h) => (Math.abs(h - next) > 4 ? next : h));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(box.firstElementChild ?? box);
    return () => ro.disconnect();
  }, []);

  return (
    // content-visibility:auto (CollapsibleSection) never paints inside an
    // inert, clipped box, so the preview forces it visible.
    <div
      ref={ref}
      className="relative overflow-clip [&_*]:[content-visibility:visible]"
      style={{ maxHeight: height }}
      data-sf-preview
    >
      <fieldset disabled aria-label="Instrument preview, read only" className="m-0 min-w-0 border-0 p-0" {...INERT}>
        {children}
      </fieldset>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-sf-void" />
    </div>
  );
}
