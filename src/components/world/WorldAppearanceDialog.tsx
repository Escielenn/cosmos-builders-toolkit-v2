import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap } from "lucide-react";
import { useWorlds } from "@/hooks/use-worlds";
import { useSubscription } from "@/hooks/use-subscription";
import UpgradeDialog from "@/components/subscription/UpgradeDialog";
import HeaderImageUpload from "@/components/world/HeaderImageUpload";
import SoundtrackPicker from "@/components/audio/SoundtrackPicker";
import { useToast } from "@/hooks/use-toast";
import type { WorldTheme } from "@/hooks/use-world";

const PRESET_COLORS = [
  { name: "Cyan", hex: "#3DFFCD" },
  { name: "Magenta", hex: "#FF3D8E" },
  { name: "Amber", hex: "#FFB347" },
  { name: "Green", hex: "#4ADE80" },
  { name: "Blue", hex: "#5B8DEF" },
  { name: "White", hex: "#E0E4E8" },
  { name: "Coral", hex: "#FF6B6B" },
  { name: "Violet", hex: "#A78BFA" },
];

interface WorldAppearanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  currentTheme: WorldTheme | undefined;
}

export default function WorldAppearanceDialog({
  open,
  onOpenChange,
  worldId,
  currentTheme,
}: WorldAppearanceDialogProps) {
  const { isSubscribed } = useSubscription();
  const { updateWorld } = useWorlds();
  const { toast } = useToast();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [accentColor, setAccentColor] = useState("#3DFFCD");
  const [hexInput, setHexInput] = useState("#3DFFCD");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [soundtrackId, setSoundtrackId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && currentTheme) {
      const color = currentTheme.accent_color || "#3DFFCD";
      setAccentColor(color);
      setHexInput(color);
      setCoverImageUrl(currentTheme.cover_image_url || null);
      setSoundtrackId(currentTheme.soundtrack_playlist_id || null);
    }
  }, [open, currentTheme]);

  const handleColorChange = (hex: string) => {
    setAccentColor(hex);
    setHexInput(hex);
  };

  const handleHexInput = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setAccentColor(value);
    }
  };

  const handleSave = async () => {
    if (!isSubscribed) {
      setUpgradeOpen(true);
      return;
    }

    setSaving(true);
    try {
      const theme: WorldTheme = {
        ...currentTheme,
        accent_color: accentColor === "#3DFFCD" ? undefined : accentColor,
        cover_image_url: coverImageUrl || undefined,
        soundtrack_playlist_id: soundtrackId || undefined,
      };
      await updateWorld.mutateAsync({ worldId, theme });
      toast({ title: "APPEARANCE UPDATED." });
      onOpenChange(false);
    } catch {
      toast({ title: "UPDATE FAILED. RETRY.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isSubscribed) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-wider flex items-center gap-2">
                <Zap className="w-5 h-5 text-sf-amber" />
                WORLD APPEARANCE
              </DialogTitle>
              <DialogDescription>
                Customize your world's visual identity with accent colors, icons, and cover images.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
              <p className="text-sm text-t3 mb-4">
                Pro includes custom theming, all export formats, 365-day version history, and unlimited worlds.
              </p>
              <Button onClick={() => setUpgradeOpen(true)}>
                <Zap className="w-4 h-4 mr-2" />
                UPGRADE TO PRO
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-sf-amber" />
              WORLD APPEARANCE
            </DialogTitle>
            <DialogDescription>
              Customize this world's accent color. Changes apply to the Codex, wiki pages, and Chronicle.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Accent Color */}
            <div className="space-y-3">
              <label className="font-mono text-[12px] uppercase tracking-[2px] text-t3">
                // ACCENT COLOR
              </label>

              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 border border-white/15 shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <Input
                  value={hexInput}
                  onChange={(e) => handleHexInput(e.target.value)}
                  className="font-mono text-sm h-8 w-28"
                  maxLength={7}
                  placeholder="#3DFFCD"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    className={`w-6 h-6 border cursor-pointer transition-all hover:scale-110 ${
                      accentColor === c.hex
                        ? "border-white border-2"
                        : "border-white/10"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => handleColorChange(c.hex)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-3">
              <label className="font-mono text-[12px] uppercase tracking-[2px] text-t3">
                // COVER IMAGE
              </label>
              <HeaderImageUpload
                currentImageUrl={coverImageUrl}
                onImageChange={setCoverImageUrl}
                showMoodboardPicker={false}
              />
            </div>

            {/* Soundtrack */}
            <div className="space-y-3">
              <label className="font-mono text-[12px] uppercase tracking-[2px] text-t3">
                // SOUNDTRACK
              </label>
              <SoundtrackPicker value={soundtrackId} onChange={setSoundtrackId} />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <label className="font-mono text-[12px] uppercase tracking-[2px] text-t3">
                // PREVIEW
              </label>
              <div className="bg-sf-surface border border-white/6 p-4 space-y-3">
                {/* Mock section header */}
                <div className="flex items-center gap-2">
                  <span
                    className="font-heading text-[12px] uppercase tracking-[3px]"
                    style={{ color: accentColor, opacity: 0.6 }}
                  >
                    // ENVIRONMENT
                  </span>
                </div>
                {/* Mock element rows */}
                <div className="space-y-1 pl-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-[5px] h-[5px] rounded-full"
                      style={{ backgroundColor: accentColor, opacity: 0.7 }}
                    />
                    <span className="text-xs text-t2">Kepler-442b</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-[5px] h-[5px] rounded-full border"
                      style={{ borderColor: accentColor, opacity: 0.5 }}
                    />
                    <span className="text-xs text-t1/50">Draft Entry</span>
                    <span className="text-[12px] uppercase tracking-wider text-t3/50">DRAFT</span>
                  </div>
                </div>
                {/* Mock infobox border */}
                <div
                  className="border-t-2 border border-white/6 p-3 mt-2"
                  style={{ borderTopColor: `${accentColor}80` }}
                >
                  <span
                    className="font-mono text-[12px] uppercase tracking-[3px]"
                    style={{ color: accentColor, opacity: 0.5 }}
                  >
                    INFOBOX
                  </span>
                </div>
                {/* Mock completion bar */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] uppercase tracking-wider text-t3/40">
                    SURVEY:
                  </span>
                  <div className="flex-1 h-1 bg-white/5 relative">
                    <div
                      className="h-full"
                      style={{ backgroundColor: accentColor, width: "68%", opacity: 0.8 }}
                    />
                  </div>
                  <span className="font-mono text-[12px] text-t3/40">68%</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "SAVING..." : "SAVE APPEARANCE"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}
