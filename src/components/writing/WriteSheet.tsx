import { lazy, Suspense, useState, useCallback, useRef, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Globe, ChevronDown, X, Loader2, Save, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorlds } from "@/hooks/use-worlds";
import {
  useCreateEntry,
  useUpdateEntry,
  useWritingEntries,
  type WritingEntry,
} from "@/hooks/use-writing-entries";
import { useWritingPreferences } from "@/hooks/use-writing-preferences";
import { useWritingStats } from "@/hooks/use-writing-stats";
import { GoalSetting } from "@/components/writing/GoalSetting";
import TagInput from "@/components/tags/TagInput";
import EntitySuggestionBar from "@/components/writing/EntitySuggestionBar";
import { useWritingEntityLinks } from "@/hooks/use-writing-entity-links";
import type { WritingPrompt } from "@/lib/writing/prompts";
import { CATEGORY_LABELS } from "@/lib/writing/prompts";
import { cn } from "@/lib/utils";

const RichTextEditor = lazy(() => import("@/components/ui/rich-text-editor"));

// ─── Types ──────────────────────────────────────────────────────────────

interface WriteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing entry to edit (null = create new) */
  entry: WritingEntry | null;
  /** Prompt context when starting from a prompt */
  prompt: WritingPrompt | null;
}

type SaveStatus = "idle" | "saving" | "saved";

// ─── Helpers ────────────────────────────────────────────────────────────

function countWords(html: string): number {
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = (div.textContent || div.innerText || "").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

// ─── Component ──────────────────────────────────────────────────────────

export function WriteSheet({
  open,
  onOpenChange,
  entry,
  prompt,
}: WriteSheetProps) {
  const { worlds } = useWorlds();
  const createEntry = useCreateEntry();
  const updateEntry = useUpdateEntry();
  const { entries } = useWritingEntries();
  const { preferences } = useWritingPreferences();
  const stats = useWritingStats(entries, preferences.dailyGoalWords);

  // Local state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [worldId, setWorldId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  // Entity linking — write first, suggest after
  const entityLinks = useWritingEntityLinks(entryId ?? undefined, worldId ?? undefined);

  // Timers
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "is writing" = has content
  const isWriting = wordCount > 0;

  // Reset state when dialog opens with new context
  useEffect(() => {
    if (!open) return;

    if (entry) {
      setTitle(entry.title || "");
      setContent(entry.content || "");
      setWordCount(entry.word_count);
      setWorldId(entry.world_id);
      setTags(entry.tags || []);
      setEntryId(entry.id);
    } else {
      setTitle(prompt?.title || "");
      setContent("");
      setWordCount(0);
      setWorldId(null);
      setTags([]);
      setEntryId(null);
    }
    setSaveStatus("idle");
  }, [open, entry, prompt]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // ─── Save logic ───────────────────────────────────────────────────────

  const performSave = useCallback(
    (saveContent: string, saveWordCount: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

      setSaveStatus("saving");

      if (entryId) {
        updateEntry.mutate(
          {
            entryId,
            content: saveContent,
            wordCount: saveWordCount,
            title,
            worldId,
            tags,
          },
          {
            onSuccess: () => {
              setSaveStatus("saved");
              savedTimerRef.current = setTimeout(
                () => setSaveStatus("idle"),
                2500
              );
              // Scan for entity mentions after save
              if (worldId) entityLinks.scanForEntities(saveContent);
            },
          }
        );
      } else if (saveContent.trim()) {
        createEntry.mutate(
          {
            promptId: prompt?.id,
            worldId: worldId || undefined,
            title,
            content: saveContent,
          },
          {
            onSuccess: (data) => {
              setEntryId(data.id);
              setSaveStatus("saved");
              savedTimerRef.current = setTimeout(
                () => setSaveStatus("idle"),
                2500
              );
              // Scan for entity mentions after first save
              if (worldId) entityLinks.scanForEntities(saveContent);
            },
          }
        );
      } else {
        setSaveStatus("idle");
      }
    },
    [entryId, title, worldId, tags, prompt, createEntry, updateEntry]
  );

  // Auto-save (debounced)
  const autoSave = useCallback(
    (newContent: string, newWordCount: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        performSave(newContent, newWordCount);
      }, 2000);
    },
    [performSave]
  );

  // Manual save — flush pending and save now
  const handleManualSave = useCallback(() => {
    performSave(content, wordCount);
  }, [content, wordCount, performSave]);

  // Ref for Ctrl+S handler (avoids stale closure)
  const manualSaveRef = useRef(handleManualSave);
  manualSaveRef.current = handleManualSave;

  // Ctrl+S / Cmd+S keyboard shortcut
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        manualSaveRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // ─── Content change ───────────────────────────────────────────────────

  const handleContentChange = useCallback(
    (html: string) => {
      setContent(html);
      const wc = countWords(html);
      setWordCount(wc);
      autoSave(html, wc);
    },
    [autoSave]
  );

  // ─── Field saves (title, world, tags) ─────────────────────────────────

  const handleTitleBlur = useCallback(() => {
    if (entryId) {
      updateEntry.mutate({ entryId, title });
    }
  }, [entryId, title, updateEntry]);

  const handleWorldChange = useCallback(
    (newWorldId: string | null) => {
      setWorldId(newWorldId);
      if (entryId) {
        updateEntry.mutate({ entryId, worldId: newWorldId });
      }
    },
    [entryId, updateEntry]
  );

  const handleTagsChange = useCallback(
    (newTags: string[]) => {
      setTags(newTags);
      if (entryId) {
        updateEntry.mutate({ entryId, tags: newTags });
      }
    },
    [entryId, updateEntry]
  );

  // ─── Derived values ───────────────────────────────────────────────────

  const selectedWorld = worlds.find((w) => w.id === worldId);
  // Compute progress directly from preferences to avoid stale memoized stats
  const goalProgress = preferences.dailyGoalWords > 0
    ? Math.min((stats.wordsToday / preferences.dailyGoalWords) * 100, 100)
    : 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300" />

        {/* Content — full viewport, scrollable */}
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 overflow-y-auto outline-none"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">
            Writing Prompts
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Write and edit your prompt entry.
          </DialogPrimitive.Description>

          {/* Close button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="fixed top-5 right-5 z-[60] p-2 rounded-sm text-t4 hover:text-t1 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Centered writing area */}
          <div
            className={cn(
              "w-full max-w-3xl mx-auto px-6 pb-28 transition-all duration-500 ease-out",
              isWriting ? "pt-8 md:pt-10" : "pt-16 md:pt-28"
            )}
          >
            {/* Title input — styled as display heading, shrinks when writing */}
            <div className="relative">
              {entryId && (
                <Pencil className={cn(
                  "absolute left-0 text-t5 transition-all duration-500",
                  isWriting ? "top-1 w-3.5 h-3.5 -translate-x-5" : "top-2.5 w-4 h-4 -translate-x-7"
                )} />
              )}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="Untitled Entry"
                className={cn(
                  "w-full bg-transparent border-0 border-b border-white/[0.06] focus:border-primary/30 outline-none font-display uppercase tracking-sf-title text-t1 placeholder:text-t5 transition-all duration-500 ease-out pb-3",
                  isWriting
                    ? "text-lg md:text-xl mb-2"
                    : "text-3xl md:text-5xl mb-3"
                )}
              />
              {prompt && (
                <p className={cn(
                  "text-t3 italic leading-relaxed transition-all duration-500 ease-out",
                  isWriting ? "text-xs mb-4" : "text-sm mb-8"
                )}>
                  {prompt.prompt}
                </p>
              )}
            </div>

            {/* Metadata row — world selector, prompt badge */}
            <div
              className={cn(
                "flex items-center gap-3 flex-wrap transition-all duration-300",
                isWriting ? "mb-3" : "mb-5"
              )}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs h-7"
                  >
                    <Globe className="w-3 h-3" />
                    {selectedWorld ? selectedWorld.name : "No world"}
                    <ChevronDown className="w-3 h-3 text-t4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleWorldChange(null)}>
                    <span className="text-t3">Standalone</span>
                  </DropdownMenuItem>
                  {worlds.map((w) => (
                    <DropdownMenuItem
                      key={w.id}
                      onClick={() => handleWorldChange(w.id)}
                    >
                      <span className="mr-2">{w.icon}</span>
                      {w.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {prompt && (
                <Badge variant="glow" className="text-[10px]">
                  {CATEGORY_LABELS[prompt.category]}
                </Badge>
              )}

              {/* Tags inline */}
              <div className="flex-1 min-w-[140px]">
                <TagInput
                  tags={tags}
                  onChange={handleTagsChange}
                  placeholder="Add tag..."
                  maxTags={5}
                />
              </div>
            </div>

            {/* Editor */}
            <Suspense
              fallback={
                <div className="rounded-xs border border-white/[0.06] bg-white/[0.02] animate-pulse min-h-[400px]" />
              }
            >
              <RichTextEditor
                content={content}
                onChange={handleContentChange}
                placeholder="Begin your story..."
                minHeight="400px"
                worldId={worldId || undefined}
              />
            </Suspense>

            {/* Entity suggestion bar — write first, suggest after */}
            {entityLinks.showSuggestions && (
              <EntitySuggestionBar
                suggestions={entityLinks.suggestions}
                onLink={(entityId) => entityLinks.createLink.mutate(entityId)}
                onDismiss={entityLinks.dismissSuggestions}
              />
            )}
          </div>

          {/* ─── Fixed footer ──────────────────────────────────────────── */}
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-background/95 backdrop-blur-md border-t border-white/[0.06]">
            <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
              {/* Left: word count + daily goal */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-t3">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>

                {prompt?.wordGoal && (
                  <>
                    <span className="text-t5">/</span>
                    <span className="font-mono text-xs text-t4">
                      {prompt.wordGoal} goal
                    </span>
                  </>
                )}

                <span className="text-t5 hidden sm:inline">|</span>

                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-16 h-1 rounded-xs bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-xs transition-all duration-500"
                      style={{ width: `${goalProgress}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-t4">
                    {stats.wordsToday}/{preferences.dailyGoalWords}
                  </span>
                  <GoalSetting compact />
                </div>
              </div>

              {/* Right: save status + save button */}
              <div className="flex items-center gap-3">
                {/* Auto-save status indicator */}
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1.5 text-xs text-t3">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Saving</span>
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1.5 text-xs text-primary">
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Saved</span>
                  </span>
                )}
                {saveStatus === "idle" && entryId && (
                  <span className="flex items-center gap-1 text-[10px] text-t5">
                    <Check className="w-3 h-3" />
                    <span className="hidden sm:inline">Auto-saved</span>
                  </span>
                )}

                {/* Manual save button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={handleManualSave}
                  disabled={
                    saveStatus === "saving" || (!content.trim() && !entryId)
                  }
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
