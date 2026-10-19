// ---------------------------------------------------------------------------
// ArchivePanel — archived worlds, with restore and delete. Was the /archive
// page (reachable only from the account menu); now the ARCHIVE tab of the
// profile (/profile?tab=archive), and /archive redirects there.
// ---------------------------------------------------------------------------
import { useMemo } from "react";
import { Archive as ArchiveIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import WorldCard from "@/components/dashboard/WorldCard";
import { useWorlds } from "@/hooks/use-worlds";

export default function ArchivePanel() {
  const { worlds, isLoading, deleteWorld, unarchiveWorld } = useWorlds(true);

  const archivedWorlds = useMemo(() => worlds.filter((w) => w.archived_at !== null), [worlds]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-heading text-sf-h3 text-t1 uppercase">Archived worlds</h2>
        {archivedWorlds.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {archivedWorlds.length}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader />
        </div>
      ) : archivedWorlds.length === 0 ? (
        <GlassPanel className="p-12 text-center">
          <ArchiveIcon className="w-12 h-12 mx-auto mb-4 text-t3" aria-hidden="true" />
          <h3 className="font-mono text-sf-mono uppercase text-t2 mb-2">ARCHIVE EMPTY.</h3>
          <p className="text-sm text-t2">
            Archived worlds appear here. Restore one at any time.
          </p>
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {archivedWorlds.map((world) => (
            <WorldCard
              key={world.id}
              id={world.id}
              name={world.name}
              description={world.description}
              headerImageUrl={world.header_image_url}
              headerImageFocusY={world.header_image_focus_y}
              icon={world.icon}
              tags={world.tags}
              archivedAt={world.archived_at}
              updatedAt={world.updated_at}
              onDelete={(id) => deleteWorld.mutate(id)}
              onUnarchive={(id) => unarchiveWorld.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
