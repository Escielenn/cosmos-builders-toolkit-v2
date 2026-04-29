import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Globe } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import WorldCard from "@/components/dashboard/WorldCard";
import CreateWorldButton from "@/components/dashboard/CreateWorldButton";
import { TagFilter } from "@/components/dashboard/TagFilter";
import { ArchiveToggle } from "@/components/dashboard/ArchiveToggle";
import SharedWorldsSection from "@/components/dashboard/SharedWorldsSection";
import BackupStatusWidget from "@/components/dashboard/BackupStatusWidget";
import WorldImportDialog from "@/components/world/WorldImportDialog";
import { Button } from "@/components/ui/button";
import { useWorlds } from "@/hooks/use-worlds";
import { useAuth } from "@/contexts/AuthContext";
import { PageBursts } from "@/components/ui/data-burst";
import { WORLDS_BURSTS } from "@/lib/data-bursts";
import ExampleWorldBanner from "@/components/community/ExampleWorldBanner";
import { ParallaxStrips } from "@/components/ambient/ParallaxStrips";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHero } from "@/components/ui/section-hero";

const Worlds = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { worlds, isLoading, deleteWorld, archiveWorld, unarchiveWorld } =
    useWorlds(showArchived);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const archivedCount = useMemo(() => {
    return worlds.filter((w) => w.archived_at !== null).length;
  }, [worlds]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    worlds.forEach((w) => {
      (w.tags || []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [worlds]);

  const filteredWorlds = useMemo(() => {
    if (selectedTags.length === 0) return worlds;
    return worlds.filter((w) =>
      selectedTags.some((tag) => (w.tags || []).includes(tag))
    );
  }, [worlds, selectedTags]);

  const handleDeleteWorld = (worldId: string) => {
    deleteWorld.mutate(worldId);
  };

  const handleArchiveWorld = (worldId: string) => {
    archiveWorld.mutate(worldId);
  };

  const handleUnarchiveWorld = (worldId: string) => {
    unarchiveWorld.mutate(worldId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background sf-atmosphere">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-16 flex items-center justify-center">
          <Loader />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        <PageBursts bursts={WORLDS_BURSTS} />
        {/* Back Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-heading text-[11px] uppercase tracking-[0.2em] font-medium text-t3 hover:text-sf-teal-bright transition-colors duration-base mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          ← RETURN TO BRIDGE
        </Link>

        {/* Header — parallax telemetry backdrop */}
        <div className="relative overflow-hidden mb-12">
          <div className="absolute inset-0 opacity-40 pointer-events-none -z-0">
            <ParallaxStrips height={220} />
          </div>
          <div className="relative z-10 flex flex-col gap-6 py-10">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <SectionHero
                eyebrow="// WORLD INDEX"
                title={<>My <span className="text-sf-teal">worlds.</span></>}
                subtitle="Each world is its own cascade — physics shapes environment, environment shapes biology, biology shapes culture. Pick one to continue, or begin a new survey."
                className="flex-1 min-w-[280px]"
              />
            <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <ArchiveToggle
              showArchived={showArchived}
              onToggle={setShowArchived}
              archivedCount={
                showArchived
                  ? archivedCount
                  : worlds.filter((w) => w.archived_at).length
              }
            />
            </div>
          </div>
          {availableTags.length > 0 && (
            <TagFilter
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagSelect={(tag) =>
                setSelectedTags((prev) => [...prev, tag])
              }
              onTagRemove={(tag) =>
                setSelectedTags((prev) => prev.filter((t) => t !== tag))
              }
              onClear={() => setSelectedTags([])}
            />
          )}
          </div>
        </div>

        {/* Example World Banner */}
        <ExampleWorldBanner />

        {/* Browse Community Link */}
        <div className="flex items-center justify-end mb-4">
          <Link
            to="/community"
            className="inline-flex items-center gap-1.5 font-heading text-[11px] font-medium uppercase tracking-[0.2em] text-sf-teal hover:text-sf-teal-bright transition-colors duration-base"
          >
            <Globe className="w-3.5 h-3.5" />
            BROWSE COMMUNITY WORLDS
          </Link>
        </div>

        {/* Worlds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <CreateWorldButton />

          {isLoading && (
            <GlassPanel className="p-5 h-full min-h-[200px] flex flex-col items-center justify-center">
              <Loader size="sm" />
            </GlassPanel>
          )}

          {!isLoading && filteredWorlds.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                eyebrow="// WORLD INDEX"
                title="INDEX: EMPTY"
                description={
                  selectedTags.length > 0
                    ? "NO WORLDS MATCH FILTER CRITERIA. ADJUST TAG SELECTION."
                    : "NO WORLDS ON FILE. BEGIN SURVEY WHEN READY."
                }
              />
            </div>
          )}

          {filteredWorlds.map((world) => (
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
              snapshotAt={world.snapshot_at}
              updatedAt={world.updated_at}
              forkedFrom={world.forked_from}
              onDelete={handleDeleteWorld}
              onArchive={handleArchiveWorld}
              onUnarchive={handleUnarchiveWorld}
            />
          ))}
        </div>

        {/* Backup Status */}
        {!isLoading && worlds.filter((w) => !w.archived_at).length > 0 && (
          <div className="mb-16 max-w-sm">
            <BackupStatusWidget worlds={worlds.filter((w) => !w.archived_at)} />
          </div>
        )}

        {/* Shared with Me */}
        <SharedWorldsSection />
      </main>

      <Footer />

      <WorldImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
};

export default Worlds;
