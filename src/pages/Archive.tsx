import { useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Archive as ArchiveIcon } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import WorldCard from "@/components/dashboard/WorldCard";
import { useWorlds } from "@/hooks/use-worlds";
import { useAuth } from "@/contexts/AuthContext";
import { PageBursts } from "@/components/ui/data-burst";
import { ARCHIVE_BURSTS } from "@/lib/data-bursts";

const Archive = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { worlds, isLoading, deleteWorld, unarchiveWorld } = useWorlds(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const archivedWorlds = useMemo(() => {
    return worlds.filter((w) => w.archived_at !== null);
  }, [worlds]);

  const handleDelete = (worldId: string) => {
    deleteWorld.mutate(worldId);
  };

  const handleUnarchive = (worldId: string) => {
    unarchiveWorld.mutate(worldId);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background sf-atmosphere">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <Loader />
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background sf-atmosphere">
      <Header />
      <PageBursts bursts={ARCHIVE_BURSTS} />
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="font-heading font-light text-2xl uppercase tracking-sf-wide">
            Archive
          </h1>
          {archivedWorlds.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {archivedWorlds.length}
            </Badge>
          )}
        </div>

        {/* Archived Worlds */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader />
          </div>
        ) : archivedWorlds.length === 0 ? (
          <GlassPanel className="p-12 text-center">
            <ArchiveIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">Your archive is empty</h3>
            <p className="text-sm text-muted-foreground">
              When you archive a world, it will appear here. You can restore it
              at any time.
            </p>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                onDelete={handleDelete}
                onUnarchive={handleUnarchive}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Archive;
