/**
 * ToolPageLayout — Canonical layout wrapper for all 21 worksheet tool pages.
 *
 * Enforces consistent structure: back link → quote bar → action bar → title → intro → children.
 * Every tool page wraps its CollapsibleSections (and any tool-specific content) in this layout.
 *
 * Spec: StellarForge_Layout_Normalization_Spec_Apr2926.md
 */

import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { PageBursts } from "@/components/ui/data-burst";
import { TOOL_PAGE_BURSTS } from "@/lib/data-bursts";
import { ToolPageQuote } from "@/components/quotes/ToolPageQuote";
import ToolActionBar from "@/components/tools/ToolActionBar";
import ToolIntroSection from "@/components/tools/ToolIntroSection";
import { TOOL_INTROS } from "@/lib/tool-intros";
import { WorksheetTitle } from "@/components/tools/WorksheetTitle";
import { WorksheetTagsBar } from "@/components/tools/WorksheetTagsBar";
import { getToolIcon } from "@/components/icons/tool-icons";
import { getToolPageConfig } from "@/lib/tool-page-config";
import { useWorldId } from "@/hooks/use-world-id";

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
  /** Slot for QuickExportButton — rendered inside the action bar */
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
  const ToolIcon = getToolIcon(toolType);
  const introData = TOOL_INTROS[cfg.introKey];

  return (
    <PageShell className={pageShellClassName}>
      <main className="relative container mx-auto px-4 pt-24 pb-16">
        <PageBursts bursts={TOOL_PAGE_BURSTS[toolType]} />

        {/* ── Back Link (context-aware) ─────────────────────────── */}
        <Link
          to={worldId ? `/worlds/${worldId}` : "/"}
          className="inline-flex items-center gap-2 text-sm text-tier-3 hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {worldId ? "Back to World" : "Back to Tools"}
        </Link>

        {/* ── Quote Bar ─────────────────────────────────────────── */}
        <ToolPageQuote toolId={toolType} />

        {/* ── Action Bar ────────────────────────────────────────── */}
        <ToolActionBar
          onSave={onSave}
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

        {/* ── Title ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            {ToolIcon && <ToolIcon className="w-8 h-8 rounded-sm shrink-0" />}
            <h1 className="font-display text-3xl md:text-4xl tracking-sf-title">
              <span className="font-normal">{cfg.brandName}:</span>{" "}
              <span className="font-light">{cfg.fullName}</span>
            </h1>
            {cfg.isPro && (
              <span className="font-mono text-[9px] tracking-[0.1em] text-primary/40 uppercase self-start mt-2">
                PRO
              </span>
            )}
          </div>
          <p className="text-tier-2 mt-2 max-w-2xl">{cfg.subtitle}</p>

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

        {/* ── Tool-specific content ─────────────────────────────── */}
        {children}
      </main>
    </PageShell>
  );
}
