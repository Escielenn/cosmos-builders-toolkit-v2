import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";

const CreateWorldButton = () => {
  const { user } = useAuth();
  const { createWorld } = useWorlds();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [worldName, setWorldName] = useState("");
  const [worldDescription, setWorldDescription] = useState("");

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
    });

    setWorldName("");
    setWorldDescription("");
    setShowCreateDialog(false);
  };

  return (
    <>
      <button onClick={handleClick} className="w-full text-left">
        <GlassPanel
          hover
          className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center gap-3 border-dashed border-2 hover:border-primary/50 group"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="font-display font-semibold text-lg">Create New World</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start building your universe
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
            <DialogTitle className="font-display text-xl">Create New World</DialogTitle>
            <DialogDescription>
              Give your world a name and optional description to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="world-name">World Name</Label>
              <Input
                id="world-name"
                placeholder="e.g., Kepler-442b Colony"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="world-description">Description (optional)</Label>
              <Textarea
                id="world-description"
                placeholder="A brief description of your world..."
                value={worldDescription}
                onChange={(e) => setWorldDescription(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              className="w-full gap-2" 
              size="lg" 
              onClick={handleCreate}
              disabled={!worldName.trim() || createWorld.isPending}
            >
              {createWorld.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Create World
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateWorldButton;
