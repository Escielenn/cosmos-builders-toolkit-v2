import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, PenTool, Plus, Archive, BookOpen } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import {
  useWritingEntries,
  useDeleteEntry,
  type WritingEntry,
  type WritingEntryWithWorld,
} from "@/hooks/use-writing-entries";
import { PromptCard } from "@/components/writing/PromptCard";
import { EntryCard } from "@/components/writing/EntryCard";
import { WriteSheet } from "@/components/writing/WriteSheet";
import { StatsPanel } from "@/components/writing/StatsPanel";
import { PromptBrowser } from "@/components/writing/PromptBrowser";
import { useWritingPreferences } from "@/hooks/use-writing-preferences";
import { useMetaTags } from "@/hooks/use-meta-tags";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { WritingPrompt } from "@/lib/writing/prompts";

type SortBy = "recent" | "alphabetical";

const WritingWorkshop = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { worlds } = useWorlds();
  const { entries, isLoading } = useWritingEntries();
  const deleteEntry = useDeleteEntry();
  const { preferences } = useWritingPreferences();

  useMetaTags({ title: "Writing Prompts" });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [worldFilter, setWorldFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("recent");

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<WritingEntry | null>(null);
  const [activePrompt, setActivePrompt] = useState<WritingPrompt | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  // ─── Filtering & Sorting ──────────────────────────────────────────

  const filteredEntries = useMemo(() => {
    let result: WritingEntryWithWorld[] = [...entries];

    // World filter
    if (worldFilter === "standalone") {
      result = result.filter((e) => !e.world_id);
    } else if (worldFilter !== "all") {
      result = result.filter((e) => e.world_id === worldFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          (e.content || "").toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === "alphabetical") {
      result.sort((a, b) =>
        (a.title || "Untitled").localeCompare(b.title || "Untitled")
      );
    }
    // "recent" is default from DB order

    return result;
  }, [entries, worldFilter, searchQuery, sortBy]);

  // Available worlds that have entries (for filter dropdown)
  const worldsWithEntries = useMemo(() => {
    const ids = new Set(entries.filter((e) => e.world_id).map((e) => e.world_id));
    return worlds.filter((w) => ids.has(w.id));
  }, [entries, worlds]);

  // ─── Handlers ─────────────────────────────────────────────────────

  const handleStartWriting = useCallback((prompt: WritingPrompt) => {
    setActiveEntry(null);
    setActivePrompt(prompt);
    setSheetOpen(true);
  }, []);

  const handleOpenEntry = useCallback((entry: WritingEntryWithWorld) => {
    setActiveEntry(entry);
    setActivePrompt(null);
    setSheetOpen(true);
  }, []);

  const handleNewEntry = useCallback(() => {
    setActiveEntry(null);
    setActivePrompt(null);
    setSheetOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteEntry.mutate(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteEntry]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-16">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-tier-3 hover:text-tier-1 transition-colors mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl tracking-sf-title text-tier-1 uppercase mb-2">
            Writing Prompts
          </h1>
          <p className="text-tier-2 max-w-2xl">
            Daily prompts, your entries, and writing practice.
          </p>
        </div>

        {/* Stats Panel */}
        <StatsPanel
          entries={entries}
          dailyGoalWords={preferences.dailyGoalWords}
        />

        {/* Today's Prompt */}
        <section className="mb-6">
          <PromptCard onStartWriting={handleStartWriting} />
        </section>

        {/* Browse All Prompts */}
        <PromptBrowser onStartWriting={handleStartWriting} />

        {/* Link to full Prompt Browser page */}
        <div className="mb-8">
          <Link
            to="/prompts"
            className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[1px] text-primary/70 hover:text-primary transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Browse All Weekly Prompts
          </Link>
        </div>

        {/* Your Entries */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-light uppercase tracking-[2px] text-tier-1">
              Your Entries
            </h2>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleNewEntry}
            >
              <Plus className="w-4 h-4" />
              New Entry
            </Button>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tier-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="pl-9 bg-transparent border-white/[0.08] rounded-xs"
              />
            </div>

            <Select value={worldFilter} onValueChange={setWorldFilter}>
              <SelectTrigger className="w-[160px] rounded-xs border-white/[0.08]">
                <SelectValue placeholder="All worlds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entries</SelectItem>
                <SelectItem value="standalone">Standalone</SelectItem>
                {worldsWithEntries.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.icon} {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              <SelectTrigger className="w-[140px] rounded-xs border-white/[0.08]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Entry grid */}
          {filteredEntries.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="relative group">
                  <EntryCard
                    entry={entry}
                    onClick={() => handleOpenEntry(entry)}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(entry.id);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-sm bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-tier-4 hover:text-amber-400"
                    aria-label="Archive entry"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <GlassPanel className="p-8 text-center">
              <PenTool className="w-8 h-8 text-tier-4 mx-auto mb-3" />
              <p className="text-tier-2 mb-1">No entries yet</p>
              <p className="text-tier-4 text-sm">
                Start writing from today's prompt or create a freeform entry.
              </p>
            </GlassPanel>
          )}
        </section>
      </main>

      <Footer />

      {/* Write Sheet */}
      <WriteSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        entry={activeEntry}
        prompt={activePrompt}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Entry</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the writing entry. It will no longer appear in
              your entries list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WritingWorkshop;
