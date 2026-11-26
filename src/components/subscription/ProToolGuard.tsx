import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/use-subscription";
import {
  getToolAccess,
  getToolDisplayName,
  PRO_TOOL_COUNT,
  SIMULATOR_TOOL_IDS,
} from "@/lib/tools-config";
import { PRO_UNLOCK_SUMMARY } from "@/lib/plan-features";
import { TOOL_PAGE_CONFIGS } from "@/lib/tool-page-config";
import { TOOL_INTROS } from "@/lib/tool-intros";
import { CASCADE_META, getToolWiki, TYPE_META } from "@/lib/tool-wiki-data";
import { getToolAccent } from "@/lib/tool-accents";
import { useWorldLayoutContext } from "@/contexts/WorldLayoutContext";
import { ToolPreviewProvider } from "@/contexts/ToolPreviewContext";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/layout/page-chrome";
import ToolIntroSection from "@/components/tools/ToolIntroSection";
import { ProBadge } from "@/components/ui/pro-badge";
import { Sparkles } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";

interface ProToolGuardProps {
  toolId: string;
  children: ReactNode;
}

/**
 * Instruments previewed from a static sample instead of their live page.
 * The simulators and cartographers drive canvases, WebGL and iframes, and
 * Timeline does not use ToolPageLayout, so mounting them read-only could
 * still run side effects. Every other Pro tool previews its real page with
 * writes disabled (ToolPreviewContext).
 */
const STATIC_PREVIEW_IDS = new Set<string>([
  ...SIMULATOR_TOOL_IDS,
  "stellar-cartographer",
  "surface-cartographer",
  "timeline",
  "writing-workshop",
]);

/**
 * Page chrome for the gate screens. Standalone routes get the full page with
 * Header; inside WorldLayout (which already draws Header + Codex sidebar) the
 * content renders in the content column only, so the world stays in view.
 */
function GuardShell({ embedded, centred = false, children }: { embedded: boolean; centred?: boolean; children: ReactNode }) {
  if (embedded) {
    return (
      <div className={centred ? "sf-tool-content flex items-center justify-center py-16" : "container mx-auto px-4 pt-2 pb-16"}>
        {children}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-sf-void">
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className={centred ? "container mx-auto px-4 pt-24 pb-16 flex items-center justify-center" : "container mx-auto px-4 pt-24 pb-16"}
      >
        {children}
      </main>
    </div>
  );
}

// ─── The clearance panel: the preview's one focal moment ─────────────

interface ClearanceProps {
  brand: string;
  lapsed: boolean;
  signedIn: boolean;
  signInTo: string;
  backTo: string;
  backLabel: string;
}

function ClearancePanel({ brand, lapsed, signedIn, signInTo, backTo, backLabel }: ClearanceProps) {
  const navigate = useNavigate();
  return (
    <GlassPanel layer="elevated" bracket className="p-5" aria-labelledby="sf-clearance-title">
      <p className="mb-3 font-mono text-sf-mono uppercase text-sf-primary-text">// Pro tool</p>
      <h2 id="sf-clearance-title" className="font-heading text-sf-h3 text-t1">
        {lapsed ? "Your Pro plan has ended" : "Read-only preview"}
      </h2>
      <p className="mt-2 text-sm text-t2">
        {lapsed
          ? "Your Pro access has ended. Your worlds and worksheets are exactly where you left them."
          : `${brand} is one of ${PRO_TOOL_COUNT} Pro instruments. You can read it here; Pro lets you use it.`}
      </p>

      <p className="mt-4 mb-1.5 font-heading text-sf-eyebrow uppercase text-t4">Pro includes</p>
      <ul className="space-y-1 text-sm text-t2">
        {PRO_UNLOCK_SUMMARY.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="text-t4">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-2">
        <Button variant="sf-primary" className="w-full" onClick={() => navigate("/pricing")}>
          {lapsed ? "Resubscribe" : "See Pro plans"}
        </Button>
        <Button variant="sf-ghost" className="w-full" asChild>
          <Link to={backTo}>{backLabel}</Link>
        </Button>
        {!signedIn && (
          <Link
            to={signInTo}
            className="inline-flex min-h-hit items-center justify-center font-sans text-sm text-sf-primary-text hover:underline"
          >
            Already cleared? Sign in
          </Link>
        )}
      </div>
    </GlassPanel>
  );
}

// ─── Static sample (simulators, cartographers, Timeline) ─────────────

function splitName(toolId: string): { brand: string; name: string } {
  const cfg = TOOL_PAGE_CONFIGS[toolId];
  if (cfg) return { brand: cfg.brandName, name: cfg.fullName };
  const full = getToolDisplayName(toolId);
  const i = full.indexOf(":");
  return i > 0 ? { brand: full.slice(0, i), name: full.slice(i + 1).trim() } : { brand: full, name: full };
}

function StaticPreview({
  toolId,
  embedded,
  worldId,
  worldName,
  clearance,
  backTo,
  backLabel,
}: {
  toolId: string;
  embedded: boolean;
  worldId?: string;
  worldName?: string;
  clearance: ReactNode;
  backTo: string;
  backLabel: string;
}) {
  const cfg = TOOL_PAGE_CONFIGS[toolId];
  const wiki = getToolWiki(toolId);
  const { brand, name } = splitName(toolId);
  const intro = TOOL_INTROS[cfg?.introKey ?? toolId];
  const accent = getToolAccent(toolId);
  const nameOf = (id: string) => splitName(id).brand;
  const rows: { label: string; value: string }[] = wiki
    ? [
        { label: "Type", value: TYPE_META[wiki.type].label },
        { label: "Cascade layer", value: CASCADE_META[wiki.cascade].label },
        { label: "Session", value: wiki.timeEstimate },
        ...(wiki.buildsOn.length ? [{ label: "Builds on", value: wiki.buildsOn.map((r) => nameOf(r.toolId)).join(", ") }] : []),
        ...(wiki.feedsInto.length ? [{ label: "Feeds into", value: wiki.feedsInto.map((r) => nameOf(r.toolId)).join(", ") }] : []),
      ]
    : [];

  return (
    <GuardShell embedded={embedded}>
      <PageHeader
        accent={accent}
        eyebrow="PRO PREVIEW"
        titleLead={`${brand}:`}
        title={name}
        badge={<ProBadge />}
        lede={cfg?.subtitle ?? wiki?.tagline}
        size={embedded ? "space" : "page"}
        breadcrumbs={
          embedded && worldId
            ? [
                { label: worldName ?? "World", to: `/worlds/${worldId}` },
                { label: "Instruments", to: `/worlds/${worldId}/tools` },
                { label: brand },
              ]
            : undefined
        }
        back={embedded ? undefined : { label: backLabel, to: backTo }}
      />
      <div className="flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_16rem] xl:items-start xl:gap-8">
        <div className="min-w-0">
          {intro && <ToolIntroSection data={intro} />}
          {rows.length > 0 && (
            <GlassPanel className="relative overflow-clip p-5 sf-scrim" aria-label="About this tool">
              <p className="relative mb-3 font-heading text-sf-eyebrow uppercase text-t4">About this tool</p>
              <dl className="relative space-y-2">
                {rows.map((r) => (
                  <div key={r.label} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b border-sf-line-hairline pb-2">
                    <dt className="font-mono text-[12px] uppercase text-t4">{r.label}</dt>
                    <dd className="text-sm text-t2">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </GlassPanel>
          )}
        </div>
        <div className="order-first mb-8 xl:order-none xl:mb-0 xl:sticky xl:top-24">{clearance}</div>
      </div>
    </GuardShell>
  );
}

// ─── The guard ───────────────────────────────────────────────────────

const ProToolGuard = ({ toolId, children }: ProToolGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, isLoading: subLoading, hasLapsedSubscription, isVanguard } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const world = useWorldLayoutContext();

  const access = getToolAccess(toolId);
  const isEarlyAccess = access === "early-access";
  const embedded = world !== null;
  // Spec 15: one back link to the real parent. In a world that is the Bridge
  // (the world dashboard, 13-THE-LIFT §1); outside one it is the tool catalog.
  const backTo = world ? `/worlds/${world.worldId}` : "/tools";
  const backLabel = world ? "Back to Bridge" : "Back to tools";
  const here = `${location.pathname}${location.search}`;
  const signInTo = `/auth?tab=login&redirect=${encodeURIComponent(here)}`;

  // Free tools render directly
  if (access === "free") {
    return <>{children}</>;
  }

  // Show loading state
  if (authLoading || subLoading) {
    return embedded ? (
      <div className="flex items-center justify-center h-64">
        <Loader size="sm" />
      </div>
    ) : (
      <div className="min-h-screen bg-sf-void flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Early access tools require Vanguard tier
  if (isEarlyAccess && !isVanguard) {
    return (
      <GuardShell embedded={embedded} centred>
        <GlassPanel className="max-w-md p-8 text-center">
          <PageHeader
            size="card"
            align="center"
            icon={
              <div className="w-16 h-16 rounded-none bg-sf-primary/[0.06] border border-sf-primary flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-sf-primary-text" aria-hidden />
              </div>
            }
            eyebrow="EARLY ACCESS"
            title="Vanguard early access"
            lede={
              <>
                <p className="mb-2">This instrument is in early access, available exclusively to Vanguard members.</p>
                <p>Vanguard members get new tools first, vote on the roadmap, and more.</p>
              </>
            }
          />
          <div className="space-y-3">
            <Button variant="sf-primary" size="lg" className="w-full" onClick={() => navigate("/pricing")}>
              Upgrade to Vanguard
            </Button>
            <div className="flex justify-center">
              <BackLink to={backTo} label={backLabel} />
            </div>
          </div>
        </GlassPanel>
      </GuardShell>
    );
  }

  // If subscribed (Pro or Vanguard), render children
  if (isSubscribed) {
    return <>{children}</>;
  }

  // Not cleared: a read-only preview with one clearance panel (finding 15).
  const clearance = (
    <ClearancePanel
      brand={splitName(toolId).brand}
      lapsed={hasLapsedSubscription && !!user}
      signedIn={!!user}
      signInTo={signInTo}
      backTo={backTo}
      backLabel={backLabel}
    />
  );

  if (STATIC_PREVIEW_IDS.has(toolId) || !TOOL_PAGE_CONFIGS[toolId]) {
    return (
      <StaticPreview
        toolId={toolId}
        embedded={embedded}
        worldId={world?.worldId}
        worldName={world?.worldName}
        clearance={clearance}
        backTo={backTo}
        backLabel={backLabel}
      />
    );
  }

  return <ToolPreviewProvider value={{ readOnly: true, clearance }}>{children}</ToolPreviewProvider>;
};

export default ProToolGuard;
