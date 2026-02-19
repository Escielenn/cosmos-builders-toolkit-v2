import { Loader2 } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass-panel";
import SharedWorldCard from "@/components/dashboard/SharedWorldCard";
import { useSharedWorlds } from "@/hooks/use-shared-worlds";
import { useLeaveWorld } from "@/hooks/use-collaborators";

const SharedWorldsSection = () => {
  const { data: sharedWorlds = [], isLoading } = useSharedWorlds();
  const leaveWorld = useLeaveWorld();

  // Don't render section at all if empty and not loading
  if (!isLoading && sharedWorlds.length === 0) return null;

  return (
    <section className="mb-16 scroll-mt-24">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-heading font-light text-2xl uppercase tracking-sf-wide">
          Shared with Me
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && (
          <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </GlassPanel>
        )}

        {sharedWorlds.map((world) => (
          <SharedWorldCard
            key={world.id}
            id={world.id}
            name={world.name}
            description={world.description}
            headerImageUrl={world.header_image_url}
            headerImageFocusY={world.header_image_focus_y}
            icon={world.icon}
            tags={world.tags}
            updatedAt={world.updated_at}
            ownerDisplayName={world.ownerDisplayName}
            myRole={world.myRole}
            onLeave={(worldId) => leaveWorld.mutate(worldId)}
          />
        ))}
      </div>
    </section>
  );
};

export default SharedWorldsSection;
