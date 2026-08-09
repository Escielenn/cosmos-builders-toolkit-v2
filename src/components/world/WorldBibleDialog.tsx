import { useState, useEffect } from "react";
import { Download, BookOpen, Check } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useExportPreferences } from "@/hooks/use-export-preferences";
import { useSubscription } from "@/hooks/use-subscription";
import { setActiveTheme, resetActiveTheme } from "@/lib/pdf/styles";
import { EXPORT_THEMES } from "@/lib/export/themes";
import { cn } from "@/lib/utils";
import { htmlToPlainText, deepStripHtml } from "@/lib/html-utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UpgradeDialog from "@/components/subscription/UpgradeDialog";
import {
  CHAPTERS,
  groupWorksheetsByChapter,
  type WorksheetRecord,
  type ChapterWithWorksheets,
} from "@/lib/pdf/templates/world-bible/helpers";
import { compileWorldSnapshot } from "@/lib/export/world-snapshot";
import { formatWorldForExport } from "@/services/worldExportFormatter";

interface WorldBibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldName: string;
  worldDescription?: string;
  worldId: string;
}

const WorldBibleDialog = ({
  open,
  onOpenChange,
  worldName,
  worldDescription,
  worldId,
}: WorldBibleDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSubscribed } = useSubscription();
  const { preferences, updatePreferences } = useExportPreferences();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [allWorksheets, setAllWorksheets] = useState<WorksheetRecord[]>([]);
  const [chaptersWithWs, setChaptersWithWs] = useState<ChapterWithWorksheets[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [selectedWorksheets, setSelectedWorksheets] = useState<Set<string>>(new Set());
  const [includeWorldNotes, setIncludeWorldNotes] = useState(true);
  const [worldNotes, setWorldNotes] = useState<string>("");
  const [exportStructure, setExportStructure] = useState<"cascade" | "entity">("cascade");

  // Fetch worksheets and notes when dialog opens
  useEffect(() => {
    if (!open || !worldId) return;
    setIsLoading(true);

    Promise.all([
      supabase
        .from("worksheets")
        .select("*")
        .eq("world_id", worldId)
        .is("archived_at", null)
        .order("updated_at", { ascending: false }),
      supabase
        .from("world_notes")
        .select("content")
        .eq("world_id", worldId)
        .maybeSingle(),
    ]).then(([wsResult, notesResult]) => {
      const worksheets = (wsResult.data as WorksheetRecord[]) || [];
      setAllWorksheets(worksheets);

      const grouped = groupWorksheetsByChapter(worksheets);
      setChaptersWithWs(grouped);

      // Select all by default
      setSelectedChapters(new Set(grouped.map((cw) => cw.chapter.id)));
      setSelectedWorksheets(new Set(worksheets.map((ws) => ws.id)));

      if (notesResult.data?.content) {
        setWorldNotes(notesResult.data.content);
      }

      setIsLoading(false);
    });
  }, [open, worldId]);

  const toggleChapter = (chapterId: string) => {
    const newChapters = new Set(selectedChapters);
    const chapter = chaptersWithWs.find((cw) => cw.chapter.id === chapterId);
    if (!chapter) return;

    const newWs = new Set(selectedWorksheets);
    if (newChapters.has(chapterId)) {
      newChapters.delete(chapterId);
      chapter.worksheets.forEach((ws) => newWs.delete(ws.id));
    } else {
      newChapters.add(chapterId);
      chapter.worksheets.forEach((ws) => newWs.add(ws.id));
    }
    setSelectedChapters(newChapters);
    setSelectedWorksheets(newWs);
  };

  const toggleWorksheet = (wsId: string, chapterId: string) => {
    const newWs = new Set(selectedWorksheets);
    if (newWs.has(wsId)) {
      newWs.delete(wsId);
    } else {
      newWs.add(wsId);
    }
    setSelectedWorksheets(newWs);

    // Update chapter state based on whether all its worksheets are selected
    const chapter = chaptersWithWs.find((cw) => cw.chapter.id === chapterId);
    if (chapter) {
      const allSelected = chapter.worksheets.every((ws) => newWs.has(ws.id));
      const newChapters = new Set(selectedChapters);
      if (allSelected) {
        newChapters.add(chapterId);
      } else {
        newChapters.delete(chapterId);
      }
      setSelectedChapters(newChapters);
    }
  };

  const selectAll = () => {
    setSelectedChapters(new Set(chaptersWithWs.map((cw) => cw.chapter.id)));
    setSelectedWorksheets(new Set(allWorksheets.map((ws) => ws.id)));
  };

  const deselectAll = () => {
    setSelectedChapters(new Set());
    setSelectedWorksheets(new Set());
  };

  const selectedCount = selectedWorksheets.size;

  const handleGenerate = async () => {
    if (selectedCount === 0 && !includeWorldNotes) return;

    if (!isSubscribed) {
      setShowUpgrade(true);
      return;
    }

    setIsGenerating(true);
    setProgress(10);

    try {
      // Dynamic import
      setProgress(15);
      const [{ pdf }, { WorldBibleTemplate }] =
        await Promise.all([
          import("@react-pdf/renderer"),
          import("@/lib/pdf/templates/world-bible"),
        ]);

      setProgress(30);

      // Compile full world snapshot (entries, connections, chronicle)
      const snapshot = await compileWorldSnapshot(worldId);

      setProgress(50);

      // Filter snapshot worksheets to only selected ones
      const filteredSnapshot = {
        ...snapshot,
        worksheets: snapshot.worksheets.filter((ws) =>
          selectedWorksheets.has(ws.id)
        ),
      };

      // Format into ExportSections (prose, connections, timeline)
      const exportSections = formatWorldForExport(filteredSnapshot);

      setProgress(65);

      const cleanWorldNotes = includeWorldNotes && worldNotes ? htmlToPlainText(worldNotes) : undefined;

      setActiveTheme(preferences.themeId);
      let blob: Blob;
      try {
        blob = await pdf(
          <WorldBibleTemplate
            worldName={worldName}
            worldDescription={worldDescription}
            worldNotes={cleanWorldNotes}
            chapters={[]}
            exportSections={exportSections}
          />
        ).toBlob();
      } finally {
        resetActiveTheme();
      }

      setProgress(90);

      // Download with explicit PDF MIME type
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${worldName.toLowerCase().replace(/\s+/g, "-")}-world-bible.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);

      setProgress(100);

      const sectionCount = exportSections.filter(
        (s) => s.layer !== "overview" && s.layer !== "notes"
      ).length;

      toast({
        title: "World Bible exported",
        description: `Generated ${sectionCount} section${sectionCount !== 1 ? "s" : ""} with wiki prose, connections, and timeline.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("World Bible export error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Export failed",
        description: errMsg.length > 120 ? errMsg.slice(0, 120) + "..." : errMsg,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Export World Bible
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive PDF book for "{worldName}". Select which chapters and worksheets to include.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
            {/* Structure toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-muted/30 w-fit">
              <button
                onClick={() => setExportStructure("cascade")}
                className={cn(
                  "px-3 py-1.5 text-[10px] uppercase tracking-wider font-heading transition-colors",
                  exportStructure === "cascade"
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "text-t4 hover:text-t3"
                )}
              >
                Cascade
              </button>
              <button
                onClick={() => setExportStructure("entity")}
                className={cn(
                  "px-3 py-1.5 text-[10px] uppercase tracking-wider font-heading transition-colors",
                  exportStructure === "entity"
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "text-t4 hover:text-t3"
                )}
              >
                Entity
              </button>
            </div>
            <p className="text-[10px] text-t4">
              {exportStructure === "cascade"
                ? "Organized by cascade layer: Environment → Biology → Culture → Mythology. Reads like a textbook."
                : "Organized by entity: one chapter per major element, all data compiled per entity. Reads like an encyclopedia."}
            </p>

            {/* Select All / Deselect All */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-t3">
                {selectedCount} of {allWorksheets.length} worksheet{allWorksheets.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            {/* World Notes toggle */}
            {worldNotes && (
              <div className="flex items-center space-x-2 p-3 rounded-none border border-sf-border bg-accent/5">
                <Checkbox
                  id="include-notes"
                  checked={includeWorldNotes}
                  onCheckedChange={(checked) => setIncludeWorldNotes(!!checked)}
                />
                <Label htmlFor="include-notes" className="flex-1 cursor-pointer">
                  <span className="font-medium">Include World Notes</span>
                  <p className="text-xs text-t3 mt-0.5">
                    Add your world notes as the opening chapter
                  </p>
                </Label>
              </div>
            )}

            {/* Chapter tree */}
            {chaptersWithWs.length === 0 ? (
              <div className="text-center py-8 text-t3">
                <p>No worksheets found in this world.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chaptersWithWs.map((cw) => {
                  const chapterSelected = selectedChapters.has(cw.chapter.id);
                  const someSelected = cw.worksheets.some((ws) =>
                    selectedWorksheets.has(ws.id)
                  );

                  return (
                    <div
                      key={cw.chapter.id}
                      className="rounded-none border border-sf-border overflow-hidden"
                    >
                      {/* Chapter header */}
                      <div className="flex items-center space-x-2 p-3 bg-muted/30">
                        <Checkbox
                          checked={chapterSelected}
                          // indeterminate doesn't exist in shadcn, use visual cue
                          className={!chapterSelected && someSelected ? "opacity-60" : ""}
                          onCheckedChange={() => toggleChapter(cw.chapter.id)}
                        />
                        <div className="flex-1">
                          <span className="font-medium text-sm">
                            Ch. {cw.chapter.number}: {cw.chapter.title}
                          </span>
                          <span className="text-xs text-t3 ml-2">
                            ({cw.worksheets.length})
                          </span>
                        </div>
                      </div>

                      {/* Worksheets */}
                      <div className="divide-y divide-border">
                        {cw.worksheets.map((ws) => (
                          <div
                            key={ws.id}
                            className="flex items-center space-x-2 px-3 py-2 pl-8"
                          >
                            <Checkbox
                              checked={selectedWorksheets.has(ws.id)}
                              onCheckedChange={() =>
                                toggleWorksheet(ws.id, cw.chapter.id)
                              }
                            />
                            <span className="text-sm truncate">
                              {ws.title || "Untitled"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Progress bar during generation */}
        {isGenerating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-t3 text-center">
              Generating World Bible...
            </p>
          </div>
        )}

        {/* Inline theme picker */}
        <div className="pt-3 border-t border-sf-border">
          <Label className="text-xs text-t3 mb-2 block">PDF Theme</Label>
          <div className="flex gap-2 flex-wrap">
            {EXPORT_THEMES.map((theme) => {
              const isSelected = preferences.themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => updatePreferences({ themeId: theme.id })}
                  title={theme.name}
                  className={cn(
                    "flex gap-0.5 p-1.5 rounded-md border transition-all",
                    isSelected
                      ? "border-primary ring-1 ring-primary/50"
                      : "border-sf-border hover:border-primary/50"
                  )}
                >
                  {theme.swatch.map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-sm border border-sf-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  {isSelected && (
                    <Check className="w-3 h-3 text-primary ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              isLoading ||
              (selectedCount === 0 && !includeWorldNotes)
            }
          >
            {isGenerating ? (
              <>
                <Loader variant="inline" size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate World Bible
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        toolName="World Bible PDF Export"
      />
    </Dialog>
  );
};

export default WorldBibleDialog;
