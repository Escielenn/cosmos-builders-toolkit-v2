/**
 * ToolPageLayout, Canonical layout wrapper for all 21 worksheet tool pages.
 *
 * Enforces consistent structure: back link → quote bar → action bar → title → intro → children.
 * Every tool page wraps its CollapsibleSections (and any tool-specific content) in this layout.
 *
 * Spec: StellarForge_Layout_Normalization_Spec_Apr2926.md
 */

import { type ReactNode, useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { getToolAccent, accentTextClass, accentArcClass, accentBgClass } from "@/lib/tool-accents";
import CascadeSuggestionToast from "@/components/tools/CascadeSuggestionToast";
import UpstreamCallout from "@/components/tools/UpstreamCallout";
import PageShell from "@/components/layout/PageShell";
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

  /** Optional className on the PageShell */
  pageShellClassName?: string;

  /** Everything below the intro section: CollapsibleSections, sidebars, etc. */
  children: ReactNode;
}

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
  pageShellClassName,
  children,
}: ToolPageLayoutProps) {
  const cfg = getToolPageConfig(toolType);
  const worldId = useWorldId();
  const saveGate = useSaveWorldGate(onSave, isCloudEnabled, !!worldId);
  const ToolIcon = getToolIcon(toolType);
  const introData = TOOL_INTROS[cfg.introKey];
  const accent = getToolAccent(toolType);

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

  return (
    <PageShell className={pageShellClassName}>
      <main className="relative container mx-auto px-4 xl:pr-[280px] pt-24 pb-16">
        <PageBursts bursts={TOOL_PAGE_BURSTS[toolType]} />

        {/* ── Back Link (context-aware) ─────────────────────────── */}
        <Link
          to={worldId ? `/worlds/${worldId}` : "/"}
          className="inline-flex items-center gap-2 font-heading text-[12px] uppercase tracking-[0.2em] font-medium text-t3 hover:text-sf-teal-bright transition-colors duration-base mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {worldId ? "Return to World" : "Return to Tools"}
        </Link>

        {/* ── Quote Bar ─────────────────────────────────────────── */}
        <ToolPageQuote toolId={toolType} />

        {/* ── Action Bar ────────────────────────────────────────── */}
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

        {/* ── Title, section-header pattern with per-tool cascade accent ── */}
        <div className="mb-10">
          {/* Mono eyebrow with cascade-color hairline rule */}
          <div className={`inline-flex items-center gap-3.5 font-mono uppercase ${accentTextClass(accent)} text-[12px] tracking-[2.5px] mb-7`}>
            <span aria-hidden className={`block w-12 h-px ${accentBgClass(accent)}`} />
            <span>// {accent.toUpperCase()} · {cfg.brandName.toUpperCase()}</span>
          </div>
          <div className="flex items-start gap-4 flex-wrap">
            {ToolIcon && <ToolIcon className="w-10 h-10 rounded-none shrink-0 mt-1" />}
            <h1 className="font-display font-light text-sf-h1 leading-[1] text-t1 flex-1 min-w-[280px]">
              <span className="font-normal">{cfg.brandName}:</span>{" "}
              <span className="font-light">{cfg.fullName}</span>
            </h1>
            {cfg.isPro && (
              <span className="font-mono text-[12px] tracking-[0.18em] uppercase self-start mt-2 px-2 py-0.5 rounded-sf-tag border border-sf-violet/[0.15] bg-sf-violet/[0.06] text-sf-violet shrink-0">
                PRO
              </span>
            )}
          </div>
          <p className="font-sans text-sf-body text-t2 mt-7 max-w-[780px] leading-[1.55]">{cfg.subtitle}</p>
          {/* Accent light arc under the title */}
          <div className={`mt-7 h-px w-24 bg-gradient-to-r ${accentArcClass(accent)}`} aria-hidden />

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
        </div>

        {/* ── Intro Section (standard for all tools) ────────────── */}
        {introData && <ToolIntroSection data={introData} />}

        {/* ── Upstream Context Callouts (only when inside a world) */}
        {worldId && <UpstreamCallout toolType={toolType} worldId={worldId} />}

        {/* ── Tool-specific content ─────────────────────────────── */}
        {children}

        {/* ── The cascade: what this tool builds on / feeds into ── */}
        <CascadeFooter toolType={toolType} />
      </main>

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
  );
}
