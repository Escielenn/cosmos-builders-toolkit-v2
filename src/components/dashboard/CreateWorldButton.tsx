import { useState } from "react";
import { Plus } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AuthRequiredDialog from "@/components/auth/AuthRequiredDialog";
import IconPicker from "@/components/world/IconPicker";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";

const CreateWorldButton = () => {
  const { user } = useAuth();
  const { createWorld } = useWorlds();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [worldName, setWorldName] = useState("");
  const [worldDescription, setWorldDescription] = useState("");
  const [worldIcon, setWorldIcon] = useState("globe");

  const handleClick = () => {
    if (user) {
      setShowCreateDialog(true);
    } else {
      setShowAuthDialog(true);
    }
  };

  const handleCreate = async () => {
    if (!worldName.trim()) return;

    await createWorld.mutateAsync({
      name: worldName.trim(),
      description: worldDescription.trim() || undefined,
      icon: worldIcon,
    });

    setWorldName("");
    setWorldDescription("");
    setWorldIcon("globe");
    setShowCreateDialog(false);
  };

  return (
    <>
      <button onClick={handleClick} className="w-full text-left">
        <GlassPanel
          hover
          className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center gap-3 border-dashed border-2 border-[#5B8DEF]/15 hover:border-[#5B8DEF]/40 group"
        >
          <div className="w-14 h-14 rounded-sm bg-gradient-to-br from-[#5B8DEF]/10 to-[#5B8DEF]/5 border border-[#5B8DEF]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-7 h-7 text-[#5B8DEF]" />
          </div>
          <div className="text-center">
            <h3 className="font-heading font-semibold text-lg">INITIALIZE NEW WORLD</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Begin survey.
            </p>
          </div>
        </GlassPanel>
      </button>

      {/* Auth Dialog for unauthenticated users */}
      <AuthRequiredDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />

      {/* Create World Dialog for authenticated users */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">INITIALIZE NEW WORLD</DialogTitle>
            <DialogDescription>
              Assign a designation, icon, and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Icon and Name Row */}
            <div className="space-y-2">
              <div className="flex gap-4">
                <Label className="w-12 shrink-0 text-center">Icon</Label>
                <Label htmlFor="world-name">World Name</Label>
              </div>
              <div className="flex items-end gap-4">
                <IconPicker value={worldIcon} onChange={setWorldIcon} />
                <div className="flex-1 sf-input-bracketed">
                  <Input
                    id="world-name"
                    placeholder="e.g., Kepler-442b Colony"
                    value={worldName}
                    onChange={(e) => setWorldName(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="world-description">Description (optional)</Label>
              <div className="sf-input-bracketed">
                <Textarea
                  id="world-description"
                  placeholder="World survey notes..."
                  value={worldDescription}
                  onChange={(e) => setWorldDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleCreate}
              disabled={!worldName.trim() || createWorld.isPending}
            >
              {createWorld.isPending ? (
                <Loader variant="inline" size="sm" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Initialize
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateWorldButton;
