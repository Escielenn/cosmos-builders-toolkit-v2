import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useWorldId } from "@/hooks/use-world-id";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));
import { useTags } from "@/hooks/use-tags";
import { useSearchParams } from "react-router-dom";
import {
  Copy,
  Crown,
  Swords,
  Coins,
  Dna,
  ScrollText,
  Zap,
  AlertTriangle,
} from "lucide-react";
import ToolPageLayout from "@/components/tools/ToolPageLayout";
import { GlassPanel } from "@/components/ui/glass-panel";
import { StatGrid } from "@/components/ui/stat-grid";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  useWorksheets,
  useWorksheet,
  useWorksheetsByType,
  useRenameWorksheet,
} from "@/hooks/use-worksheets";
import WorksheetSelectorDialog from "@/components/tools/WorksheetSelectorDialog";
import { useAuth } from "@/contexts/AuthContext";
import { MobileSectionNav } from "@/components/tools/SectionNavigation";
import ToolSidebar from "@/components/tools/ToolSidebar";
import SectionNavigation from "@/components/tools/SectionNavigation";
import CollapsibleSection from "@/components/tools/CollapsibleSection";
import KeyChoicesSidebar, {
  type KeyChoicesSection,
  MobileKeyChoices,
} from "@/components/tools/KeyChoicesSidebar";
import QuickExportButton from "@/components/tools/QuickExportButton";
import ExportDialog from "@/components/tools/ExportDialog";
import ShareDialog from "@/components/sharing/ShareDialog";
import {
  KardashevSummaryTemplate,
  KardashevFullReportTemplate,
} from "@/lib/pdf/templates";
import { useEntityMatch } from "@/hooks/use-entity-match";
import EntityMatchDialog from "@/components/tools/EntityMatchDialog";
import type { MoodboardImage } from "@/hooks/use-moodboard";
import { useWorlds } from "@/hooks/use-worlds";
import { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

import {
  CIVILIZATION_PRESETS,
  ENERGY_SOURCES,
  KARDASHEV_SECTIONS,
  SECTION_HELPERS,
  CASCADE_CONTENT,
  BUDGET_CATEGORIES,
  KARDASHEV_BANDS,
  GROWTH_RATES,
  type GrowthRateKey,
} from "@/lib/kardashev/data";
import {
  calculateKardashev,
  formatPower,
  formatKardashev,
  formatYears,
  formatMultiple,
  buildCopyText,
  type KardashevFormState,
} from "@/lib/kardashev/calculations";

// ─── FormState ───────────────────────────────────────────────────────

interface FormState {
  totalPowerWatts: number;
  powerLog10: number; // slider value (log10)
  growthRate: GrowthRateKey;
  civilizationPreset: string;
  budgetPercentages: Record<string, number>;
  cascade: {
    governance: string;
    warfare: string;
    economics: string;
    biology: string;
    culture: string;
  };
  storyNotes: {
    energySources: string;
    limitations: string;
    conflicts: string;
    dailyLife: string;
  };
  generalNotes: string;
  moodboard: MoodboardImage[];
}

const initialFormState: FormState = {
  totalPowerWatts: 1.8e13,
  powerLog10: 13.26,
  growthRate: "moderate",
  civilizationPreset: "earth-2025",
  budgetPercentages: Object.fromEntries(
    BUDGET_CATEGORIES.map((c) => [c.id, c.defaultPercent])
  ),
  cascade: {
    governance: "",
    warfare: "",
    economics: "",
    biology: "",
    culture: "",
  },
  storyNotes: {
    energySources: "",
    limitations: "",
    conflicts: "",
    dailyLife: "",
  },
  generalNotes: "",
  moodboard: [],
};

const TOOL_TYPE = "kardashev-scale";
const LOCAL_STORAGE_KEY = "kardashev-scale-v1";

const CASCADE_ICONS: Record<string, typeof Crown> = {
  Governance: Crown,
  Warfare: Swords,
  Economics: Coins,
  "Biology & Identity": Dna,
  "Culture & Mythology": ScrollText,
};

// ─── Log slider helpers (10^0 to 10^48) ──────────────────────────────

function powerToSlider(log10: number): number {
  return Math.round(((log10 - 0) / 48) * 1000);
}
function sliderToPower(slider: number): number {
  return (slider / 1000) * 48;
}

// ─── Component ───────────────────────────────────────────────────────

const KardashevScale = () => {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [currentWorksheetId, setCurrentWorksheetId] = useState<string | null>(null);
  const [currentWorksheetTitle, setCurrentWorksheetTitle] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [worksheetSelectorOpen, setWorksheetSelectorOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const worldId = useWorldId();
  const { user } = useAuth();
  const { toast } = useToast();
  const { worlds } = useWorlds();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tags
  const { tags: allTags } = useTags();
  const worksheetTags = currentWorksheetId
    ? allTags.filter((t) => t.worksheetIds?.includes(currentWorksheetId))
    : [];

  // Worksheets
  const entityMatch = useEntityMatch(worldId);
  const { createWorksheet, updateWorksheet, worksheets } = useWorksheets(
    worldId || undefined, false, {
      onDraftCreated: entityMatch.check,
    }
  );
  const renameWorksheet = useRenameWorksheet();
  const { data: worksheetsByType = [] } = useWorksheetsByType(worldId || undefined, TOOL_TYPE);
  // Load worksheet
  const requestedWorksheetId = searchParams.get("worksheetId");
  const { data: loadedWorksheet } = useWorksheet(requestedWorksheetId);

  // ─── Calculation ──────────────────────────────────────────────────

  const calcInput: KardashevFormState = useMemo(
    () => ({
      totalPowerWatts: formState.totalPowerWatts,
      growthRate: formState.growthRate,
      budgetPercentages: formState.budgetPercentages,
    }),
    [formState.totalPowerWatts, formState.growthRate, formState.budgetPercentages]
  );

  const results = useMemo(() => calculateKardashev(calcInput), [calcInput]);

  // ─── Worksheet persistence ────────────────────────────────────────

  const handleSave = useCallback(() => {
    const data = { ...formState } as unknown as Record<string, Json>;
    if (currentWorksheetId) {
      updateWorksheet.mutate(
        { worksheetId: currentWorksheetId, data },
        { onSuccess: () => toast({ title: "FILE SECURED." }) }
      );
    } else if (user) {
      createWorksheet.mutate(
        { data, worldId: worldId || undefined, toolType: TOOL_TYPE, title: currentWorksheetTitle || "K-Scale Analysis" },
        {
          onSuccess: (ws) => {
            setCurrentWorksheetId(ws.id);
            setSearchParams((p) => { p.set("worksheetId", ws.id); return p; });
            toast({ title: "FILE SECURED." });
          },
        }
      );
    }
  }, [formState, currentWorksheetId, currentWorksheetTitle, user, worldId, updateWorksheet, createWorksheet, toast, setSearchParams]);

  // Load worksheet data
  const handleLoadWorksheet = useCallback(
    (ws: { id: string; title: string | null; data: Record<string, Json> | null }) => {
      setCurrentWorksheetId(ws.id);
      setCurrentWorksheetTitle(ws.title);
      if (ws.data) {
        const d = ws.data as unknown as Partial<FormState>;
        setFormState((prev) => ({
          ...prev,
          ...d,
          budgetPercentages: d.budgetPercentages || prev.budgetPercentages,
          cascade: { ...prev.cascade, ...d.cascade },
          storyNotes: { ...prev.storyNotes, ...d.storyNotes },
          moodboard: d.moodboard || prev.moodboard,
        }));
      }
      setSearchParams((p) => { p.set("worksheetId", ws.id); return p; });
      setWorksheetSelectorOpen(false);
    },
    [setSearchParams]
  );

  // Auto-load requested worksheet
  useMemo(() => {
    if (loadedWorksheet && loadedWorksheet.id !== currentWorksheetId) {
      handleLoadWorksheet(loadedWorksheet);
    }
  }, [loadedWorksheet, currentWorksheetId, handleLoadWorksheet]);

  // ─── Handlers ─────────────────────────────────────────────────────

  const handlePreset = useCallback((presetId: string) => {
    const preset = CIVILIZATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const log10 = Math.log10(preset.powerWatts);
    setFormState((prev) => ({
      ...prev,
      civilizationPreset: presetId,
      totalPowerWatts: preset.powerWatts,
      powerLog10: log10,
    }));
  }, []);

  const handlePowerSlider = useCallback((value: number[]) => {
    const log10 = sliderToPower(value[0]);
    setFormState((prev) => ({
      ...prev,
      powerLog10: log10,
      totalPowerWatts: Math.pow(10, log10),
      civilizationPreset: "",
    }));
  }, []);

  const handleGrowthRate = useCallback((rate: GrowthRateKey) => {
    setFormState((prev) => ({ ...prev, growthRate: rate }));
  }, []);

  const handleBudget = useCallback((categoryId: string, percent: number) => {
    setFormState((prev) => ({
      ...prev,
      budgetPercentages: { ...prev.budgetPercentages, [categoryId]: percent },
    }));
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildCopyText(results, calcInput));
    toast({ title: "COPIED TO CLIPBOARD." });
  }, [results, calcInput, toast]);

  const handleNewWorksheet = useCallback(() => {
    setFormState(initialFormState);
    setCurrentWorksheetId(null);
    setCurrentWorksheetTitle(null);
    setSearchParams((p) => { p.delete("worksheetId"); return p; });
  }, [setSearchParams]);

  // ─── Key Choices ──────────────────────────────────────────────────

  const keyChoicesSections: KeyChoicesSection[] = useMemo(() => {
    if (!results.valid) return [];
    return [
      {
        id: "classification",
        title: "Classification",
        choices: [
          { label: "Level", value: results.band.label },
          { label: "K Number", value: formatKardashev(results.kardashevNumber) },
        ],
      },
      {
        id: "power",
        title: "Power Output",
        choices: [
          { label: "Total", value: formatPower(results.totalPowerWatts) },
          { label: "Log₁₀", value: `10^${results.log10Power.toFixed(1)} W` },
          { label: "Earth ×", value: formatMultiple(results.earthMultiple) },
        ],
      },
      {
        id: "growth",
        title: "Growth",
        choices: [
          { label: "Rate", value: GROWTH_RATES[formState.growthRate].label },
          { label: "Detail", value: GROWTH_RATES[formState.growthRate].description },
        ],
      },
    ];
  }, [results, formState.growthRate]);

  // ─── Render ───────────────────────────────────────────────────────

  const currentWorld = worlds.find((w) => w.id === worldId);

  return (
    <ToolPageLayout
      toolType={TOOL_TYPE}
      onSave={handleSave}
      onPrint={() => window.print()}
      onExport={() => setExportDialogOpen(true)}
      onOpen={worldId ? () => setWorksheetSelectorOpen(true) : undefined}
      onShare={currentWorksheetId ? () => setShareDialogOpen(true) : undefined}
      isSaving={updateWorksheet.isPending || createWorksheet.isPending}
      isCloudEnabled={!!(worldId && user)}
      extraActions={
        <QuickExportButton
          toolName="K-Scale"
          worldName={currentWorld?.name}
          formState={formState}
          summaryTemplate={<KardashevSummaryTemplate formState={formState} worldName={currentWorld?.name} />}
          fullTemplate={<KardashevFullReportTemplate formState={formState} worldName={currentWorld?.name} />}
        />
      }
      worksheetId={currentWorksheetId}
      worksheetTitle={currentWorksheetTitle}
      onRenameWorksheet={async (newTitle) => {
        if (!currentWorksheetId) return;
        await renameWorksheet.mutateAsync({ worksheetId: currentWorksheetId, title: newTitle });
        setCurrentWorksheetTitle(newTitle);
      }}
      worksheetIcon={<Zap className="w-5 h-5 text-primary" />}
      isLoggedIn={!!user}
    >

        {/* ─── Preset Section ────────────────────────────────────── */}
        <CollapsibleSection
          id="presets"
          title="CIVILIZATION PRESETS"
          levelNumber={1}
          helper={SECTION_HELPERS.presets}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {CIVILIZATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset.id)}
                className={cn(
                  "text-left p-3 border transition-all group",
                  formState.civilizationPreset === preset.id
                    ? "border-primary bg-primary/[0.06]"
                    : "border-sf-line bg-white/[0.02] hover:border-sf-line"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{preset.emoji}</span>
                  <span className="text-xs font-medium text-t2 truncate">
                    {preset.label}
                  </span>
                </div>
                <p className="text-[12px] text-t4 line-clamp-2">
                  {preset.description}
                </p>
                {preset.reference && (
                  <Badge variant="outline" className="mt-1 text-[12px] py-0">
                    {preset.reference}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* ─── Energy Input Section ──────────────────────────────── */}
        <CollapsibleSection
          id="energy-inputs"
          title="ENERGY CONFIGURATION"
          levelNumber={2}
          helper={SECTION_HELPERS["energy-inputs"]}
        >
          <div className="space-y-6">
            {/* Power slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[12px] uppercase tracking-[1.5px] text-t3">
                  Total Power Consumption
                </Label>
                <span className="font-mono text-sm text-t1">
                  {formatPower(formState.totalPowerWatts)}
                </span>
              </div>
              <Slider
                value={[powerToSlider(formState.powerLog10)]}
                onValueChange={handlePowerSlider}
                min={0}
                max={1000}
                step={1}
              />
              <div className="flex justify-between text-[12px] font-mono text-t4">
                <span>10^0 W</span>
                <span>10^16 W (Type I)</span>
                <span>10^26 W (Type II)</span>
                <span>10^36 W (III)</span>
                <span>10^48</span>
              </div>
            </div>

            {/* Kardashev number readout */}
            <div className="flex items-center gap-4 p-3 bg-white/[0.02] border border-sf-line">
              <div>
                <span className="text-[12px] uppercase tracking-[1.5px] text-t4">Kardashev Number</span>
                <div className="font-mono text-2xl text-t1">
                  {results.valid ? formatKardashev(results.kardashevNumber) : "-"}
                </div>
              </div>
              <div>
                <span className="text-[12px] uppercase tracking-[1.5px] text-t4">Log₁₀ Power</span>
                <div className="font-mono text-lg text-t2">
                  {formState.powerLog10.toFixed(1)} W
                </div>
              </div>
            </div>

            {/* Growth rate */}
            <div className="space-y-2">
              <Label className="text-[12px] uppercase tracking-[1.5px] text-t3">
                Annual Growth Rate
              </Label>
              <Select
                value={formState.growthRate}
                onValueChange={(v) => handleGrowthRate(v as GrowthRateKey)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GROWTH_RATES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}, {val.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick energy source reference */}
            <div className="space-y-2">
              <Label className="text-[12px] uppercase tracking-[1.5px] text-t3">
                Energy Source Reference
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[240px] overflow-y-auto">
                {ENERGY_SOURCES.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => {
                      const log10 = Math.log10(source.powerWatts);
                      setFormState((prev) => ({
                        ...prev,
                        totalPowerWatts: source.powerWatts,
                        powerLog10: log10,
                        civilizationPreset: "",
                      }));
                    }}
                    className="text-left p-2 border border-sf-line hover:border-sf-line bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] text-t2 truncate">
                        {source.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[12px] py-0 shrink-0",
                          source.category === "planetary" && "text-blue-400 border-sf-azure",
                          source.category === "stellar" && "text-sf-amber border-sf-amber",
                          source.category === "galactic" && "text-pink-400 border-sf-magenta",
                          source.category === "exotic" && "text-t1 border-sf-line"
                        )}
                      >
                        {source.category}
                      </Badge>
                    </div>
                    <span className="font-mono text-[12px] text-t4">
                      {formatPower(source.powerWatts)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ─── Results Section ───────────────────────────────────── */}
        {results.valid && (
          <CollapsibleSection
            id="results"
            title="CLASSIFICATION RESULTS"
            levelNumber={3}
            helper={SECTION_HELPERS.results}
            defaultOpen
          >
            <div className="space-y-6">
              {/* Classification banner */}
              <GlassPanel className="p-6 text-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${results.band.color}, transparent 70%)` }}
                />
                <p className="text-[12px] uppercase tracking-[2px] text-t4 mb-2">
                  Your Civilization Is
                </p>
                <h3
                  className="font-display text-2xl md:text-3xl tracking-sf-title mb-2"
                  style={{ color: results.band.color }}
                >
                  {results.band.label.toUpperCase()}
                </h3>
                <p className="font-mono text-sm text-t2 mb-3">
                  K = {formatKardashev(results.kardashevNumber)}
                </p>
                <p className="text-sm text-t3 max-w-lg mx-auto">
                  {results.band.description}
                </p>
              </GlassPanel>

              {/* Comparison stats, StatGrid primitive */}
              <StatGrid cols={4}>
                <StatGrid.Cell
                  label="TOTAL POWER"
                  value={formatPower(results.totalPowerWatts)}
                  accent="amber"
                />
                <StatGrid.Cell
                  label="vs EARTH"
                  value={formatMultiple(results.earthMultiple)}
                  accent="amber"
                />
                <StatGrid.Cell
                  label="vs SUN"
                  value={formatMultiple(results.solarMultiple)}
                  accent="amber"
                />
                <StatGrid.Cell
                  label="vs GALAXY"
                  value={formatMultiple(results.galaxyMultiple)}
                  accent="amber"
                />
              </StatGrid>

              {/* Characteristics */}
              <div className="space-y-2">
                <Label className="text-[12px] uppercase tracking-[1.5px] text-t3">
                  Civilization Characteristics
                </Label>
                <ul className="space-y-1.5">
                  {results.band.characteristics.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-t2">
                      <Zap className="w-3 h-3 text-primary/60 mt-1 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Projections */}
              {results.projections.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[12px] uppercase tracking-[1.5px] text-t3">
                    Growth Projections ({GROWTH_RATES[formState.growthRate].label})
                  </Label>
                  <div className="space-y-1.5">
                    {results.projections.map((p) => (
                      <div
                        key={p.level}
                        className="flex items-center justify-between p-2 bg-white/[0.02] border border-sf-line"
                      >
                        <span className="text-sm text-t2">{p.label}</span>
                        <div className="text-right">
                          <span className="font-mono text-sm text-t1">
                            {formatYears(p.yearsToReach)}
                          </span>
                          <span className="text-[12px] text-t4 ml-2">
                            ({formatPower(p.powerRequired)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scale visualization */}
              <div className="space-y-2">
                <Label className="text-[12px] uppercase tracking-[1.5px] text-t3">
                  Kardashev Scale Position
                </Label>
                <div className="relative h-10 bg-white/[0.02] border border-sf-line overflow-hidden">
                  {KARDASHEV_BANDS.map((band) => {
                    const left = (band.minPower / 48) * 100;
                    const width = ((band.maxPower - band.minPower) / 48) * 100;
                    return (
                      <div
                        key={band.level}
                        className="absolute top-0 bottom-0 border-r border-sf-line"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          background: `${band.color}08`,
                        }}
                        title={band.label}
                      />
                    );
                  })}
                  {/* Marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5"
                    style={{
                      left: `${(results.log10Power / 48) * 100}%`,
                      background: results.band.color,
                      boxShadow: `0 0 8px ${results.band.color}60`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[12px] font-mono text-t4">
                  <span>Sub-I</span>
                  <span>I</span>
                  <span>II</span>
                  <span>III</span>
                  <span>Ω</span>
                </div>
              </div>

              {/* Copy button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Results
              </Button>
            </div>
          </CollapsibleSection>
        )}

        {/* ─── Energy Budget Section ─────────────────────────────── */}
        {results.valid && (
          <CollapsibleSection
            id="energy-budget"
            title="ENERGY BUDGET BREAKDOWN"
            levelNumber={4}
            helper={SECTION_HELPERS["energy-budget"]}
          >
            <div className="space-y-4">
              {BUDGET_CATEGORIES.map((cat) => {
                const pct = formState.budgetPercentages[cat.id] ?? cat.defaultPercent;
                const allocated = results.totalPowerWatts * (pct / 100);
                return (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-t2">{cat.label}</span>
                        <span className="text-[12px] text-t4 ml-2">
                          ({cat.description})
                        </span>
                      </div>
                      <span className="font-mono text-xs text-t1">
                        {pct}%, {formatPower(allocated)}
                      </span>
                    </div>
                    <Slider
                      value={[pct]}
                      onValueChange={(v) => handleBudget(cat.id, v[0])}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                );
              })}

              {/* Budget total warning */}
              {(() => {
                const total = Object.values(formState.budgetPercentages).reduce((s, v) => s + v, 0);
                if (Math.abs(total - 100) > 1) {
                  return (
                    <div className="flex items-center gap-2 p-2 bg-amber-500/[0.06] border border-sf-amber text-sf-amber text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Budget total is {total}% (should be 100%)
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </CollapsibleSection>
        )}

        {/* ─── Cascade Section ───────────────────────────────────── */}
        {results.valid && (
          <CollapsibleSection
            id="cascade"
            title="CASCADE IMPLICATIONS"
            levelNumber={5}
            helper={SECTION_HELPERS.cascade}
          >
            <Tabs defaultValue={CASCADE_CONTENT[0]?.category}>
              <TabsList className="mb-4 flex flex-wrap gap-1 h-auto bg-transparent">
                {CASCADE_CONTENT.map((cat) => {
                  const Icon = CASCADE_ICONS[cat.category] || Zap;
                  return (
                    <TabsTrigger
                      key={cat.category}
                      value={cat.category}
                      className="gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                    >
                      <Icon className="w-3 h-3" />
                      {cat.category}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {CASCADE_CONTENT.map((cat) => (
                <TabsContent key={cat.category} value={cat.category}>
                  <div className="space-y-3">
                    {cat.implications
                      .filter((imp) => {
                        // Show implications at or below current level
                        const bandIndex = KARDASHEV_BANDS.findIndex(
                          (b) => b.level === imp.level
                        );
                        const currentIndex = KARDASHEV_BANDS.findIndex(
                          (b) => b.level === results.level
                        );
                        return bandIndex <= currentIndex + 1;
                      })
                      .map((imp) => {
                        const isCurrentLevel = imp.level === results.level;
                        return (
                          <div
                            key={imp.level}
                            className={cn(
                              "p-3 border transition-colors",
                              isCurrentLevel
                                ? "border-primary bg-primary/[0.04]"
                                : "border-sf-line bg-white/[0.01]"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className="text-[12px] py-0"
                                style={{
                                  color: KARDASHEV_BANDS.find(
                                    (b) => b.level === imp.level
                                  )?.color,
                                  borderColor: `${KARDASHEV_BANDS.find(
                                    (b) => b.level === imp.level
                                  )?.color}30`,
                                }}
                              >
                                {imp.level.toUpperCase()}
                              </Badge>
                              {isCurrentLevel && (
                                <Badge variant="glow" className="text-[12px] py-0">
                                  Current Level
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-t2">{imp.text}</p>
                          </div>
                        );
                      })}

                    {/* User notes for this cascade category */}
                    <div className="mt-4">
                      <Label className="text-[12px] uppercase tracking-[1.5px] text-t3 mb-2 block">
                        Your Notes, {cat.category}
                      </Label>
                      <Suspense
                        fallback={
                          <div className="rounded-xs border border-sf-line bg-white/[0.02] animate-pulse min-h-[100px]" />
                        }
                      >
                        <RichTextEditor
                          content={
                            formState.cascade[
                              cat.category.toLowerCase().split(" ")[0] as keyof typeof formState.cascade
                            ] || ""
                          }
                          onChange={(html) => {
                            const key = cat.category.toLowerCase().split(" ")[0] as keyof typeof formState.cascade;
                            setFormState((prev) => ({
                              ...prev,
                              cascade: { ...prev.cascade, [key]: html },
                            }));
                          }}
                          placeholder={`How does ${cat.category.toLowerCase()} work at this energy level?`}
                          minHeight="100px"
                          worldId={worldId || undefined}
                        />
                      </Suspense>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CollapsibleSection>
        )}

        {/* ─── Story Notes ───────────────────────────────────────── */}
        <CollapsibleSection
          id="story-notes"
          title="STORY NOTES"
          levelNumber={6}
          helper={SECTION_HELPERS["story-notes"]}
        >
          <div className="space-y-6">
            {[
              { key: "energySources" as const, label: "Energy Sources & Infrastructure", placeholder: "What powers your civilization? Where does the energy come from?" },
              { key: "limitations" as const, label: "Limitations & Constraints", placeholder: "What can't your civilization do? What are the bottlenecks?" },
              { key: "conflicts" as const, label: "Energy Conflicts", placeholder: "Who fights over energy? What are the political tensions?" },
              { key: "dailyLife" as const, label: "Daily Life Impact", placeholder: "How does this energy level affect ordinary people's lives?" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label className="text-[12px] uppercase tracking-[1.5px] text-t3 mb-2 block">
                  {label}
                </Label>
                <Suspense
                  fallback={
                    <div className="rounded-xs border border-sf-line bg-white/[0.02] animate-pulse min-h-[100px]" />
                  }
                >
                  <RichTextEditor
                    content={formState.storyNotes[key]}
                    onChange={(html) =>
                      setFormState((prev) => ({
                        ...prev,
                        storyNotes: { ...prev.storyNotes, [key]: html },
                      }))
                    }
                    placeholder={placeholder}
                    minHeight="100px"
                    worldId={worldId || undefined}
                  />
                </Suspense>
              </div>
            ))}
          </div>
        </CollapsibleSection>

      {/* Sidebar */}
      <ToolSidebar>
        <SectionNavigation sections={KARDASHEV_SECTIONS} mode="inline" />
        <KeyChoicesSidebar sections={keyChoicesSections} title="K-Scale Summary" mode="inline" />
      </ToolSidebar>

      <div className="fixed right-4 bottom-4 xl:hidden z-40 no-print flex flex-col gap-2">
        <MobileSectionNav sections={KARDASHEV_SECTIONS} />
        <MobileKeyChoices sections={keyChoicesSections} title="K-Scale Summary" />
      </div>

      {/* Dialogs */}
      {worldId && (
        <WorksheetSelectorDialog
          open={worksheetSelectorOpen}
          onOpenChange={setWorksheetSelectorOpen}
          worldId={worldId}
          worldName={currentWorld?.name}
          toolType={TOOL_TYPE}
          toolDisplayName="K-Scale"
          worksheets={worksheetsByType || []}
          isLoading={false}
          onSelect={(selectedId) => {
            setSearchParams({ worldId: worldId, worksheetId: selectedId });
            setWorksheetSelectorOpen(false);
          }}
          onCreate={async (name) => {
            const data = formState as unknown as Record<string, Json>;
            const result = await createWorksheet.mutateAsync({
              worldId,
              toolType: TOOL_TYPE,
              title: name,
              data,
            });
            setCurrentWorksheetId(result.id);
            setCurrentWorksheetTitle(result.title);
            setSearchParams({ worldId, worksheetId: result.id });
            return result.id;
          }}
        />
      )}

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        toolName="K-Scale"
        worldName={currentWorld?.name}
        formState={formState}
        summaryTemplate={<KardashevSummaryTemplate formState={formState} worldName={currentWorld?.name} />}
        fullTemplate={<KardashevFullReportTemplate formState={formState} worldName={currentWorld?.name} />}
        defaultFilename="kardashev-scale"
      />

      {currentWorksheetId && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          entityType="worksheet"
          entityId={currentWorksheetId}
          entityTitle={currentWorksheetTitle || "K-Scale Analysis"}
        />
      )}

      <EntityMatchDialog {...entityMatch.dialogProps} />
    </ToolPageLayout>
  );
};

export default KardashevScale;
