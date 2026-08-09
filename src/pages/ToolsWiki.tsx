import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Compass,
  ArrowRight,
  Layers,
  BarChart3,
  GraduationCap,
  Calendar,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  TOOL_WIKI,
  CATEGORY_META,
  COMPLEXITY_META,
  CASCADE_META,
  TYPE_META,
  WORKSHOP_WEEKS,
  getToolsByCategory,
  getToolsByCascade,
  getToolsByComplexity,
  getToolsByWorkshopWeek,
  type ToolCategory,
  type CascadePosition,
  type ComplexityLevel,
  type ToolWikiEntry,
} from "@/lib/tool-wiki-data";
import {
  getToolDisplayName,
  getToolRoute,
  isProTool,
} from "@/lib/tools-config";
import CubeLogo from "@/components/icons/CubeLogo";
import { GuideNav } from "@/components/layout/GuideNav";
import { CascadeRibbon } from "@/components/tools/CascadeRibbon";

// ── Tool Card ──────────────────────────────────────────────

function ToolWikiCard({
  tool,
  onSelect,
}: {
  tool: ToolWikiEntry;
  onSelect: (tool: ToolWikiEntry) => void;
}) {
  const displayName = getToolDisplayName(tool.id);
  const isPro = isProTool(tool.id);
  const catMeta = CATEGORY_META[tool.category];
  const compMeta = COMPLEXITY_META[tool.complexity];
  const typeMeta = TYPE_META[tool.type];

  return (
    <button
      type="button"
      onClick={() => onSelect(tool)}
      className="sf-card-hover block text-left w-full"
    >
      <GlassPanel className="p-4 h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-heading text-sm font-light uppercase tracking-[2px] text-t1 leading-tight">
            {displayName}
          </h3>
          <span className="text-t4 font-mono text-[12px] shrink-0">
            {compMeta.icon}
          </span>
        </div>

        <p className="text-t3 text-xs leading-relaxed mb-3 line-clamp-2">
          {tool.tagline}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className="text-[11px] border-transparent px-1.5 py-0"
            style={{ color: catMeta.color, borderColor: `${catMeta.color}30` }}
          >
            {catMeta.label}
          </Badge>
          <Badge variant="outline" className="text-[11px] text-t4 border-white/10 px-1.5 py-0">
            {typeMeta.label}
          </Badge>
          {isPro && (
            <Badge variant="outline" className="text-[11px] text-sf-violet border-violet-400/20 px-1.5 py-0">
              PRO
            </Badge>
          )}
        </div>
      </GlassPanel>
    </button>
  );
}

// ── Tool Detail Sheet ──────────────────────────────────────

function ToolDetail({
  tool,
  onNavigate,
}: {
  tool: ToolWikiEntry;
  onNavigate: (toolId: string) => void;
}) {
  const displayName = getToolDisplayName(tool.id);
  const isPro = isProTool(tool.id);
  const catMeta = CATEGORY_META[tool.category];
  const compMeta = COMPLEXITY_META[tool.complexity];
  const cascMeta = CASCADE_META[tool.cascade];
  const typeMeta = TYPE_META[tool.type];
  const navigate = useNavigate();

  const toolPath = getToolRoute(tool.id) ?? `/tools/${tool.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl tracking-sf-title text-t1 mb-2">
          {displayName}
        </h2>
        <p className="text-t2 text-sm leading-relaxed">{tool.tagline}</p>
      </div>

      {/* Tags row */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="text-[12px] px-2 py-0.5"
          style={{ color: catMeta.color, borderColor: `${catMeta.color}30` }}
        >
          {catMeta.label}
        </Badge>
        <Badge variant="outline" className="text-[12px] text-t3 border-white/10 px-2 py-0.5">
          {compMeta.icon} {compMeta.label}
        </Badge>
        <Badge variant="outline" className="text-[12px] text-t3 border-white/10 px-2 py-0.5">
          {typeMeta.label}
        </Badge>
        {isPro && (
          <Badge variant="outline" className="text-[12px] text-sf-violet border-violet-400/20 px-2 py-0.5">
            PRO
          </Badge>
        )}
      </div>

      {/* Cascade position */}
      <GlassPanel className="p-3">
        <h4 className="font-mono text-[11px] tracking-[2px] uppercase text-t3/60 mb-2">
          // CASCADE POSITION
        </h4>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {(Object.keys(CASCADE_META) as CascadePosition[])
            .filter((k) => k !== "meta")
            .sort((a, b) => CASCADE_META[a].order - CASCADE_META[b].order)
            .map((pos) => {
              const isActive = tool.cascade === pos || (tool.cascade === "meta" && pos === "culture");
              return (
                <div
                  key={pos}
                  className={`text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm shrink-0 transition-colors ${
                    isActive
                      ? "bg-primary/10 border border-primary/30 text-primary"
                      : "text-t5 border border-transparent"
                  }`}
                >
                  {CASCADE_META[pos].label}
                </div>
              );
            })}
          {tool.cascade === "meta" && (
            <div className="text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded-sm bg-primary/10 border border-primary/30 text-primary shrink-0">
              Meta
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-3">
        <GlassPanel className="p-3">
          <span className="text-t4 text-[12px] uppercase tracking-wider block mb-1">
            Time Estimate
          </span>
          <span className="font-mono text-t2 text-sm">{tool.timeEstimate}</span>
        </GlassPanel>
        <GlassPanel className="p-3">
          <span className="text-t4 text-[12px] uppercase tracking-wider block mb-1">
            Workshop
          </span>
          <span className="font-mono text-t2 text-sm">
            {WORKSHOP_WEEKS[tool.workshopWeek]?.theme ?? `Week ${tool.workshopWeek}`}
          </span>
        </GlassPanel>
      </div>

      {/* Relationships */}
      {tool.buildsOn.length > 0 && (
        <div>
          <h4 className="font-mono text-[11px] tracking-[2px] uppercase text-t3/60 mb-2">
            // BUILDS ON
          </h4>
          <div className="space-y-1.5">
            {tool.buildsOn.map((rel) => (
              <button
                key={rel.toolId}
                type="button"
                onClick={() => onNavigate(rel.toolId)}
                className="flex items-start gap-2 w-full text-left group"
              >
                <Badge
                  variant="outline"
                  className={`text-[11px] shrink-0 mt-0.5 px-1.5 py-0 ${
                    rel.strength === "required"
                      ? "text-sf-amber border-amber-400/20"
                      : rel.strength === "recommended"
                      ? "text-t3 border-white/10"
                      : "text-t4 border-white/5"
                  }`}
                >
                  {rel.strength}
                </Badge>
                <span className="text-t2 text-xs group-hover:text-primary transition-colors">
                  {getToolDisplayName(rel.toolId)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {tool.feedsInto.length > 0 && (
        <div>
          <h4 className="font-mono text-[11px] tracking-[2px] uppercase text-t3/60 mb-2">
            // FEEDS INTO
          </h4>
          <div className="space-y-1.5">
            {tool.feedsInto.map((rel) => (
              <button
                key={rel.toolId}
                type="button"
                onClick={() => onNavigate(rel.toolId)}
                className="flex items-start gap-2 w-full text-left group"
              >
                <Badge
                  variant="outline"
                  className={`text-[11px] shrink-0 mt-0.5 px-1.5 py-0 ${
                    rel.strength === "required"
                      ? "text-sf-amber border-amber-400/20"
                      : rel.strength === "recommended"
                      ? "text-t3 border-white/10"
                      : "text-t4 border-white/5"
                  }`}
                >
                  {rel.strength}
                </Badge>
                <span className="text-t2 text-xs group-hover:text-primary transition-colors">
                  {getToolDisplayName(rel.toolId)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Open tool button */}
      <Button
        className="w-full rounded-none"
        onClick={() => navigate(toolPath)}
      >
        Open Tool
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

// ── Section helper ─────────────────────────────────────────

function SectionGroup({
  title,
  color,
  description,
  tools,
  onSelect,
}: {
  title: string;
  color?: string;
  description?: string;
  tools: ToolWikiEntry[];
  onSelect: (tool: ToolWikiEntry) => void;
}) {
  if (tools.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-1">
        {color && (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        )}
        <h3 className="font-heading text-sm font-light uppercase tracking-[3px] text-[hsl(var(--sf-section-green))]">
          {title}
        </h3>
      </div>
      {description && (
        <p className="text-t4 text-xs ml-5 mb-3">{description}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        {tools.map((tool) => (
          <ToolWikiCard key={tool.id} tool={tool} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────

const ToolsWiki = () => {
  const [selectedTool, setSelectedTool] = useState<ToolWikiEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const allTools = useMemo(() => Object.values(TOOL_WIKI), []);

  const handleSelect = (tool: ToolWikiEntry) => {
    setSelectedTool(tool);
    setSheetOpen(true);
  };

  const handleNavigateRelationship = (toolId: string) => {
    const t = TOOL_WIKI[toolId];
    if (t) {
      setSelectedTool(t);
    }
  };

  // Category view data
  const categoryGroups = useMemo(
    () =>
      (Object.keys(CATEGORY_META) as ToolCategory[]).map((cat) => ({
        category: cat,
        meta: CATEGORY_META[cat],
        tools: getToolsByCategory(cat),
      })),
    [],
  );

  // Cascade view data
  const cascadeGroups = useMemo(
    () =>
      (Object.keys(CASCADE_META) as CascadePosition[])
        .sort((a, b) => CASCADE_META[a].order - CASCADE_META[b].order)
        .map((pos) => ({
          position: pos,
          meta: CASCADE_META[pos],
          tools: getToolsByCascade(pos),
        })),
    [],
  );

  // Complexity view data
  const complexityGroups = useMemo(
    () =>
      (["entry", "intermediate", "advanced"] as ComplexityLevel[]).map((lvl) => ({
        level: lvl,
        meta: COMPLEXITY_META[lvl],
        tools: getToolsByComplexity(lvl),
      })),
    [],
  );

  // Workshop view data
  const workshopGroups = useMemo(
    () =>
      Object.entries(WORKSHOP_WEEKS).map(([weekStr, meta]) => {
        const week = Number(weekStr);
        return { week, meta, tools: getToolsByWorkshopWeek(week) };
      }),
    [],
  );

  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 md:px-6 pt-24 pb-16">
        <GuideNav />

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CubeLogo size={36} />
            <div>
              <span className="font-display text-xs tracking-[4px] uppercase text-t3 block leading-none">
                STELLARFORGE
              </span>
              <h1 className="font-display text-3xl md:text-4xl tracking-sf-title text-t1 leading-tight">
                TOOL REFERENCE
              </h1>
            </div>
          </div>
          <p className="text-t2 text-sm max-w-2xl leading-relaxed mt-3">
            {allTools.length} tools organized by the Environmental Cascade.
            Each tool builds on what comes before, each output becomes input for what follows.
          </p>
          <div className="mt-4">
            <Link to="/getting-started">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                New here? Start with the Cascade Tutorial
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* View tabs */}
        <Tabs defaultValue="category" className="w-full">
          <TabsList className="bg-transparent border-b border-white/5 rounded-none w-full justify-start gap-0 h-auto p-0 mb-6">
            <TabsTrigger
              value="category"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-t3 text-xs uppercase tracking-[1.5px] font-heading px-4 py-2.5"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Category
            </TabsTrigger>
            <TabsTrigger
              value="cascade"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-t3 text-xs uppercase tracking-[1.5px] font-heading px-4 py-2.5"
            >
              <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
              Cascade
            </TabsTrigger>
            <TabsTrigger
              value="complexity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-t3 text-xs uppercase tracking-[1.5px] font-heading px-4 py-2.5"
            >
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Complexity
            </TabsTrigger>
            <TabsTrigger
              value="workshop"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent text-t3 text-xs uppercase tracking-[1.5px] font-heading px-4 py-2.5"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Workshop
            </TabsTrigger>
          </TabsList>

          {/* Category View */}
          <TabsContent value="category">
            {categoryGroups.map(({ category, meta, tools }) => (
              <SectionGroup
                key={category}
                title={meta.label}
                color={meta.color}
                description={meta.description}
                tools={tools}
                onSelect={handleSelect}
              />
            ))}
          </TabsContent>

          {/* Cascade View */}
          <TabsContent value="cascade">
            <CascadeRibbon />
            <p className="text-t3 text-xs mb-6 max-w-xl">
              Tools arranged along the Environmental Cascade. Change something upstream and everything downstream shifts.
            </p>
            {cascadeGroups.map(({ position, meta, tools }) => (
              <SectionGroup
                key={position}
                title={`${meta.order}. ${meta.label}`}
                color={meta.color}
                tools={tools}
                onSelect={handleSelect}
              />
            ))}
          </TabsContent>

          {/* Complexity View */}
          <TabsContent value="complexity">
            {complexityGroups.map(({ level, meta, tools }) => (
              <SectionGroup
                key={level}
                title={`${meta.icon} ${meta.label}`}
                description={meta.description}
                tools={tools}
                onSelect={handleSelect}
              />
            ))}
          </TabsContent>

          {/* Workshop View */}
          <TabsContent value="workshop">
            <p className="text-t3 text-xs mb-6 max-w-xl">
              Tools organized by the 6-week workshop curriculum. Each week builds on the previous.
            </p>
            {workshopGroups.map(({ week, meta, tools }) => (
              <SectionGroup
                key={week}
                title={`${meta.title}: ${meta.theme}`}
                tools={tools}
                onSelect={handleSelect}
              />
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[380px] sm:w-[420px] bg-background/95 backdrop-blur-lg overflow-y-auto">
          <div className="pt-4">
            {selectedTool && (
              <ToolDetail
                tool={selectedTool}
                onNavigate={handleNavigateRelationship}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Footer />
    </div>
  );
};

export default ToolsWiki;
