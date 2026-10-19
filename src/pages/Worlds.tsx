/** Worlds index. Page chrome per docs/stellarforge/15-PAGE-CHROME.md. */
import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Upload, Globe } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { BranchesWorldPicker } from "@/components/world/chronicle/branches/BranchesWorldPicker";
import { useMetaTags } from "@/hooks/use-meta-tags";
const Worlds = () => {
  useMetaTags({ title: "Worlds" });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { worlds, isLoading, archivedCount, deleteWorld, archiveWorld, unarchiveWorld } =
    useWorlds(showArchived);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
        <main>
          <PageContainer variant="standalone" className="flex items-center justify-center">
            <Loader />
          </PageContainer>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />
      <main className="relative z-10">
        <PageContainer variant="standalone">
        <PageBursts bursts={WORLDS_BURSTS} />

        {/* Top-level page: no back link (the logo goes home). */}
        <PageHeader
          size="page"
          eyebrow="World index"
          title="Your worlds"
          lede="Each world is its own cascade: physics shapes environment, environment shapes biology, biology shapes culture. Pick one to continue, or begin a new survey."
          actions={
            <>
              <Button variant="sf-ghost" size="sf-md" onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4" aria-hidden />
                Import
              </Button>
              <ArchiveToggle
                showArchived={showArchived}
                onToggle={setShowArchived}
                archivedCount={archivedCount}
              />
              <Button asChild variant="sf-ghost" size="sf-md">
                <Link to="/community">
                  <Globe className="w-4 h-4" aria-hidden />
                  Community worlds
                </Link>
              </Button>
            </>
          }
        >
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
        </PageHeader>

        {/* Arrived from the Time Travel Timelines entry: pick a world first. */}
        {searchParams.get("open") === "chronicle-branches" && !isLoading && (
          <BranchesWorldPicker worlds={worlds} />
        )}

        {/* Example World Banner */}
        <ExampleWorldBanner />

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
                title={selectedTags.length > 0 ? "INDEX: NO MATCH" : "INDEX: EMPTY"}
                description={
                  selectedTags.length > 0
                    ? "NO WORLDS MATCH FILTER CRITERIA. ADJUST TAG SELECTION."
                    : "NO WORLDS ON FILE. BEGIN SURVEY WHEN READY."
                }
                {...(selectedTags.length === 0
                  ? { actionLabel: "BEGIN SURVEY", actionTo: "/worlds?create=true" }
                  : {})}
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
        </PageContainer>
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
