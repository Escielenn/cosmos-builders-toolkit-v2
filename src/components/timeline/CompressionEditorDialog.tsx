import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Plus, Trash2, Minus } from "lucide-react";
import type { TimeCompression, CompressionStyle } from "@/lib/timeline/types";
import { useTimeline } from "@/lib/timeline/context";
import { cn } from "@/lib/utils";

interface CompressionEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCompression?: TimeCompression | null;
}

const STYLE_OPTIONS: { id: CompressionStyle; label: string; desc: string }[] = [
  { id: "break", label: "Break Lines", desc: "Angled parallel lines" },
  { id: "fade", label: "Fade", desc: "Gradient edges" },
  { id: "spiral", label: "Spiral", desc: "Infinity symbol" },
];

const CompressionEditorDialog = ({
  open,
  onOpenChange,
  editingCompression,
}: CompressionEditorDialogProps) => {
  const { state, dispatch } = useTimeline();

  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [style, setStyle] = useState<CompressionStyle>("break");
  const [displayWidth, setDisplayWidth] = useState(40);
  const [label, setLabel] = useState("");
  const [showList, setShowList] = useState(!editingCompression);

  useEffect(() => {
    if (open) {
      if (editingCompression) {
        setStartYear(String(editingCompression.startYear));
        setEndYear(String(editingCompression.endYear));
        setStyle(editingCompression.style);
        setDisplayWidth(editingCompression.displayWidth);
        setLabel(editingCompression.label || "");
        setShowList(false);
      } else {
        setStartYear("");
        setEndYear("");
        setStyle("break");
        setDisplayWidth(40);
        setLabel("");
        setShowList(state.compressions.length > 0);
      }
    }
  }, [open, editingCompression, state.compressions.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startYear || !endYear) return;

    const start = Number(startYear);
    const end = Number(endYear);
    if (isNaN(start) || isNaN(end) || end <= start) return;

    if (editingCompression) {
      dispatch({
        type: "UPDATE_COMPRESSION",
        payload: {
          ...editingCompression,
          startYear: start,
          endYear: end,
          style,
          displayWidth,
          label: label.trim() || undefined,
        },
      });
    } else {
      dispatch({
        type: "CREATE_COMPRESSION",
        payload: {
          startYear: start,
          endYear: end,
          style,
          displayWidth,
          isExpanded: false,
          label: label.trim() || undefined,
        },
      });
    }
    onOpenChange(false);
  };

  const handleDelete = (id: string) => {
    dispatch({ type: "DELETE_COMPRESSION", payload: id });
  };

  const handleEdit = (comp: TimeCompression) => {
    setStartYear(String(comp.startYear));
    setEndYear(String(comp.endYear));
    setStyle(comp.style);
    setDisplayWidth(comp.displayWidth);
    setLabel(comp.label || "");
    setShowList(false);
  };

  // ─── List view ─────────────────────────────────────────────────────

  if (showList && !editingCompression) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Time Compressions</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {state.compressions.length === 0 && (
              <p className="text-sm text-t3 text-center py-4">
                No compressions yet. Create one to collapse long stretches of uneventful time.
              </p>
            )}
            {state.compressions.map((comp) => (
              <GlassPanel key={comp.id} className="p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {comp.label || `${comp.startYear.toLocaleString()} — ${comp.endYear.toLocaleString()}`}
                  </p>
                  <p className="text-xs text-t3">
                    {(comp.endYear - comp.startYear).toLocaleString()} years, {comp.style} style
                    {comp.isExpanded ? " (expanded)" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7"
                    onClick={() => handleEdit(comp)}
                    aria-label="Edit compression range"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-sf-crimson hover:text-sf-crimson"
                    onClick={() => handleDelete(comp.id)}
                    aria-label="Delete compression range"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </GlassPanel>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => setShowList(false)}>
              <Plus className="w-4 h-4 mr-2" />
              New Compression
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ─── Editor view ───────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCompression ? "Edit Compression" : "Create Compression"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Year Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start Year</Label>
              <Input
                type="number"
                placeholder="e.g., 3000"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>End Year</Label>
              <Input
                type="number"
                placeholder="e.g., 13000"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value)}
              />
            </div>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label>Visual Style</Label>
            <div className="grid grid-cols-3 gap-2">
              {STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStyle(opt.id)}
                  className={cn(
                    "px-3 py-2 rounded-md border text-xs font-medium transition-colors text-center",
                    style === opt.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-sf-border text-t3 hover:border-border"
                  )}
                >
                  {opt.label}
                  <span className="block text-[10px] font-normal mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display Width */}
          <div className="space-y-2">
            <Label>Display Width: {displayWidth}px</Label>
            <Slider
              value={[displayWidth]}
              onValueChange={(v) => setDisplayWidth(v[0])}
              min={20}
              max={120}
              step={4}
            />
            <p className="text-[10px] text-t3">
              How wide the compressed region appears on the timeline.
            </p>
          </div>

          {/* Label */}
          <div className="space-y-2">
            <Label>Label (optional)</Label>
            <Input
              placeholder="e.g., 10,000 years of peace"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (state.compressions.length > 0 && !editingCompression) {
                  setShowList(true);
                } else {
                  onOpenChange(false);
                }
              }}
            >
              {state.compressions.length > 0 && !editingCompression ? "Back" : "Cancel"}
            </Button>
            <Button
              type="submit"
              disabled={!startYear || !endYear || Number(endYear) <= Number(startYear)}
            >
              {editingCompression ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CompressionEditorDialog;
