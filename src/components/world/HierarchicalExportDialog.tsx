import { useState } from "react";
import { Download, Loader2, Globe, Dna, Crown, Rocket, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCategoryWorksheets, type CategoryWorksheets } from "@/hooks/use-category-worksheets";

// Map category icon names to Lucide components
const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Globe,
  Dna,
  Crown,
  Rocket,
  Sparkles,
};

// Map category IDs to template imports
const TEMPLATE_LOADERS: Record<string, () => Promise<{ default: React.FC<{ worldName: string; worksheets: Array<{ id: string; tool_type: string; title: string | null; data: Record<string, unknown> }>; date?: string }> }>> = {
  planet: () => import("@/lib/pdf/templates/views/PlanetViewTemplate"),
  species: () => import("@/lib/pdf/templates/views/SpeciesViewTemplate"),
  empire: () => import("@/lib/pdf/templates/views/EmpireViewTemplate"),
  spacecraft: () => import("@/lib/pdf/templates/views/SpacecraftViewTemplate"),
  culture: () => import("@/lib/pdf/templates/views/CultureViewTemplate"),
};

interface HierarchicalExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldName: string;
  worldId: string;
}

const HierarchicalExportDialog = ({
  open,
  onOpenChange,
  worldName,
  worldId,
}: HierarchicalExportDialogProps) => {
  const { toast } = useToast();
  const { data: categoryWorksheets, isLoading } = useCategoryWorksheets(worldId);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedCategory || !categoryWorksheets) return;

    const selected = categoryWorksheets.find(
      (cw) => cw.category.id === selectedCategory
    );
    if (!selected) return;

    setIsGenerating(true);
    try {
      // Dynamic import of react-pdf and template
      const [{ pdf }, templateModule] = await Promise.all([
        import("@react-pdf/renderer"),
        TEMPLATE_LOADERS[selectedCategory](),
      ]);

      const Template = templateModule.default;
      const worksheetData = selected.worksheets.map((ws) => ({
        id: ws.id,
        tool_type: ws.tool_type,
        title: ws.title,
        data: ws.data,
      }));

      const blob = await pdf(
        <Template worldName={worldName} worksheets={worksheetData} />
      ).toBlob();

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${worldName.toLowerCase().replace(/\s+/g, "-")}-${selectedCategory}-view.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "View exported",
        description: `${selected.category.label} exported with ${selected.worksheets.length} worksheet${selected.worksheets.length !== 1 ? "s" : ""}.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("View export error:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      toast({
        title: "Export failed",
        description: errMsg.length > 120 ? errMsg.slice(0, 120) + "..." : errMsg,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export View</DialogTitle>
          <DialogDescription>
            Select a category to generate a cross-worksheet PDF view for "{worldName}".
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !categoryWorksheets || categoryWorksheets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No worksheets found in this world to export.</p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {categoryWorksheets.map((cw) => {
              const Icon = CATEGORY_ICONS[cw.category.icon] || Globe;
              const isSelected = selectedCategory === cw.category.id;
              const hasTemplate = cw.category.id in TEMPLATE_LOADERS;

              return (
                <button
                  key={cw.category.id}
                  onClick={() => hasTemplate && setSelectedCategory(cw.category.id)}
                  disabled={!hasTemplate}
                  className={`w-full text-left transition-all ${
                    !hasTemplate ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <GlassPanel
                    className={`p-4 ${
                      isSelected
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{cw.category.label}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {cw.worksheets.length}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {cw.category.description}
                        </p>
                      </div>
                    </div>
                  </GlassPanel>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedCategory || isGenerating || isLoading}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HierarchicalExportDialog;
