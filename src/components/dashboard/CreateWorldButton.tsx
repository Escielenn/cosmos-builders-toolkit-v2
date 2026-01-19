import { Plus } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";

interface CreateWorldButtonProps {
  onClick?: () => void;
}

const CreateWorldButton = ({ onClick }: CreateWorldButtonProps) => {
  return (
    <button onClick={onClick} className="w-full text-left">
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
  );
};

export default CreateWorldButton;
