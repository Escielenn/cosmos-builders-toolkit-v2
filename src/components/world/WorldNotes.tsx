import { useState, useEffect, lazy, Suspense } from "react";
import { ChevronDown, ChevronUp, FileText, Plus, Trash2 } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
import {
  useWorldNotes,
  useCreateWorldNote,
  useDeleteWorldNote,
  useUpdateNoteTitle,
  useUpdateNoteTags,
  useNoteContent,
  type WorldNote,
} from "@/hooks/use-world-notes";
import TagInput from "@/components/tags/TagInput";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog";

const StellarForgeEditorLazy = lazy(() =>
  import("@/components/editor/StellarForgeEditor").then((m) => ({
    default: m.StellarForgeEditor,
  }))
);

interface WorldNotesProps {
  worldId: string;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Single note card
// ---------------------------------------------------------------------------

function NoteCard({
  note,
  worldId,
  readOnly,
  defaultOpen,
}: {
  note: WorldNote;
  worldId: string;
  readOnly?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
  const [editingTitle, setEditingTitle] = useState(note.title);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateTitle = useUpdateNoteTitle(worldId);
  const updateTags = useUpdateNoteTags(worldId);
  const deleteNote = useDeleteWorldNote(worldId);
  const { localContent, setLocalContent, updateContent, isSaving } =
    useNoteContent(note.id, worldId);

  // Sync content when note loads
  useEffect(() => {
    setLocalContent(note.content ?? "");
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync title when note changes externally
  useEffect(() => {
    setEditingTitle(note.title);
  }, [note.title]);

  const handleTitleBlur = () => {
    const trimmed = editingTitle.trim();
    if (trimmed && trimmed !== note.title) {
      updateTitle.mutate({ noteId: note.id, title: trimmed });
    } else if (!trimmed) {
      setEditingTitle(note.title);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleTagsChange = (tags: string[]) => {
    updateTags.mutate({ noteId: note.id, tags });
  };

  return (
    <>
      <div className="border border-sf-line-interactive bg-white/[0.01]">
        {/* Note header */}
        <div className="flex items-center gap-2 px-4 py-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="shrink-0 text-t3 hover:text-t3 transition-colors"
          >
            {isOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {readOnly ? (
            <span className="font-heading text-lg font-light text-t1 flex-1 truncate">
              {note.title}
            </span>
          ) : (
            <input
              type="text"
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="font-heading text-lg font-light text-t1 flex-1 bg-transparent border-0 border-b border-sf-line outline-none focus:border-primary rounded-none px-0 py-0.5 truncate"
              placeholder="Note title..."
            />
          )}

          {isSaving && (
            <span className="font-mono text-[12px] uppercase tracking-wider text-t4 shrink-0">
              Saving...
            </span>
          )}

          {!readOnly && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="shrink-0 text-t4 hover:text-sf-crimson-text transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tags */}
        {isOpen && !readOnly && (
          <div className="px-4 pb-2">
            <TagInput
              tags={note.tags ?? []}
              onChange={handleTagsChange}
              placeholder="Add tags..."
            />
          </div>
        )}
        {isOpen && readOnly && (note.tags ?? []).length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[12px] bg-sf-primary/8 border border-sf-primary text-sf-primary-text tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        {isOpen && (
          <div className="px-4 pb-4">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <Loader size="sm" />
                </div>
              }
            >
              <div
                className="sf-note-resize-wrapper"
                style={{
                  resize: "vertical",
                  overflow: "hidden",
                  minHeight: "200px",
                  maxHeight: "80vh",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <StellarForgeEditorLazy
                  content={localContent}
                  onChange={updateContent}
                  readOnly={!!readOnly}
                  worldId={worldId}
                  preset="rich"
                  placeholder="Write your note here..."
                  minHeight="160px"
                />
              </div>
            </Suspense>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => deleteNote.mutate(note.id)}
        itemName={note.title}
        itemType="note"
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main WorldNotes component
// ---------------------------------------------------------------------------

const WorldNotes = ({ worldId, readOnly }: WorldNotesProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { notes, isLoading } = useWorldNotes(worldId);
  const createNote = useCreateWorldNote(worldId);

  return (
    <GlassPanel className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 h-auto rounded-none hover:bg-accent/50"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-heading font-medium">World Notes</span>
              {notes.length > 0 && (
                <span className="font-mono text-[12px] text-t3">
                  {notes.length}
                </span>
              )}
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader size="sm" />
              </div>
            ) : (
              <>
                {notes.length === 0 && (
                  <p className="text-[12px] text-t4 italic py-2">
                    No notes yet. Add one to start capturing ideas about your world.
                  </p>
                )}

                {notes.map((note, idx) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    worldId={worldId}
                    readOnly={readOnly}
                    defaultOpen={idx === 0 && notes.length === 1}
                  />
                ))}

                {/* Add note button */}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => createNote.mutate()}
                    disabled={createNote.isPending}
                    className="sf-fill-sweep sf-fill-sweep--secondary w-full flex items-center justify-center gap-2 px-3 py-2 border border-sf-line-interactive text-[12px] font-heading uppercase tracking-wider text-t3 hover:text-primary hover:border-primary transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Note
                  </button>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </GlassPanel>
  );
};

export default WorldNotes;
