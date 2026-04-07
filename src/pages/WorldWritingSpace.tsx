// ---------------------------------------------------------------------------
// WorldWritingSpace — Dedicated writing environment for a world.
//
// Route: /worlds/:worldId/write
// Layout:
//   ┌─────────────────────────────────────────────────┐
//   │ Moodboard Strip (collapsible)                    │
//   ├──────────┬───────────────────────┬──────────────┤
//   │ Entity   │ Top Bar               │ Reference    │
//   │ Panel    ├───────────────────────┤ Panel        │
//   │ 280px    │ Editor (72ch)         │ 320px        │
//   │          │                       │              │
//   └──────────┴───────────────────────┴──────────────┘
//
// Features: document CRUD, auto-save, entity @mentions, wiki links,
//           version history, world notes, pinned items, moodboard
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { Plus, FileText, X } from "lucide-react";
import {
  useDocumentVersions,
  type DocumentSnapshot,
} from "@/hooks/use-document-versions";
import { useAuth } from "@/contexts/AuthContext";
import {
  useWritingDocuments,
  useCreateDocument,
  useUpdateDocumentContent,
  useRenameDocument,
  useDeleteDocument,
  useCreateFolder,
  useMoveDocument,
  useRenameFolder,
  useDeleteFolder,
} from "@/hooks/use-writing-documents";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import { WritingEntityPanel } from "@/components/writing/WritingEntityPanel";
import { WritingReferencePanel } from "@/components/writing/WritingReferencePanel";
import { WritingMoodboardStrip } from "@/components/writing/WritingMoodboardStrip";
import type { MoodboardImage } from "@/components/writing/WritingMoodboardStrip";
import { WritingTopBar } from "@/components/writing/WritingTopBar";
import type { WorldEntry } from "@/services/world-data";
import type { Entity } from "@/services/entity-graph-types";
import { useWritingPins } from "@/hooks/use-writing-pins";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUTOSAVE_DELAY = 5000; // 5 seconds of inactivity

// ---------------------------------------------------------------------------
// Hook — fetch moodboard images for a world (from worksheet data.moodboard)
// ---------------------------------------------------------------------------

function useWorldMoodboardImages(worldId: string | undefined) {
  const { user } = useAuth();

  return useQuery<MoodboardImage[]>({
    queryKey: ["world-moodboard-images", worldId],
    queryFn: async () => {
      if (!worldId || !user) return [];

      const { data, error } = await supabase
        .from("worksheets")
        .select("data")
        .eq("world_id", worldId)
        .eq("user_id", user.id);

      if (error) throw error;

      const images: MoodboardImage[] = [];
      for (const ws of data || []) {
        const wsData = ws.data as Record<string, unknown> | null;
        const moodboard = (wsData?.moodboard || []) as Array<{
          id: string;
          url: string;
          caption?: string;
        }>;
        for (const img of moodboard) {
          // Deduplicate by id
          if (!images.some((existing) => existing.id === img.id)) {
            images.push({ id: img.id, url: img.url, caption: img.caption });
          }
        }
      }
      return images;
    },
    enabled: !!worldId && !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WorldWritingSpace = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { user } = useAuth();

  // Data
  const {
    data: documents,
    isLoading: docsLoading,
    folders,
    unfiledDocs,
  } = useWritingDocuments(worldId);
  const createDoc = useCreateDocument(worldId);
  const updateContent = useUpdateDocumentContent(worldId);
  const renameDoc = useRenameDocument(worldId);
  const deleteDoc = useDeleteDocument(worldId);
  const createFolder = useCreateFolder(worldId);
  const moveDocument = useMoveDocument(worldId);
  const renameFolderMutation = useRenameFolder(worldId);
  const deleteFolderMutation = useDeleteFolder(worldId);
  const { data: moodboardImages } = useWorldMoodboardImages(worldId);
  const resolvedWorldId = worldId || "";
  const { addPin } = useWritingPins(resolvedWorldId);
  const { toast } = useToast();

  // Dynamic meta tags
  useMetaTags({ title: "Writing Space" });

  // UI state
  const [zenMode, setZenMode] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [moodboardOpen, setMoodboardOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [docTitle, setDocTitle] = useState("");

  // Writing preferences (line spacing + font)
  type LineSpacing = "1" | "1.5" | "2";
  type WritingFont = "DM Sans" | "Georgia" | "Merriweather" | "Times New Roman" | "Courier New" | "Lora";

  const writingPrefsKey = `sf-writing-prefs-${worldId}`;
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(writingPrefsKey) || "{}");
      return saved.lineSpacing ?? "1.5";
    } catch { return "1.5"; }
  });
  const [writingFont, setWritingFont] = useState<WritingFont>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(writingPrefsKey) || "{}");
      return saved.writingFont ?? "DM Sans";
    } catch { return "DM Sans"; }
  });

  // Persist writing prefs
  useEffect(() => {
    try {
      localStorage.setItem(writingPrefsKey, JSON.stringify({ lineSpacing, writingFont }));
    } catch { /* ignore */ }
  }, [lineSpacing, writingFont, writingPrefsKey]);

  const editorStyle: CSSProperties = {
    lineHeight: lineSpacing === "2" ? 2 : lineSpacing === "1.5" ? 1.625 : 1.5,
    fontFamily:
      writingFont === "Georgia" ? "Georgia, serif" :
      writingFont === "Merriweather" ? "'Merriweather', Georgia, serif" :
      writingFont === "Times New Roman" ? "'Times New Roman', Times, serif" :
      writingFont === "Courier New" ? "'Courier New', Courier, monospace" :
      writingFont === "Lora" ? "'Lora', Georgia, serif" :
      undefined,
  };

  // Version history
  const [previewSnapshot, setPreviewSnapshot] =
    useState<DocumentSnapshot | null>(null);

  const { snapshots, createSnapshot, restoreVersion } = useDocumentVersions(
    selectedDocId,
    docTitle,
    editorContent
  );

  // Auto-save refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const pendingContentRef = useRef<string>("");

  // Moodboard images (safe fallback)
  const moodImages = useMemo(() => moodboardImages ?? [], [moodboardImages]);

  // Select first document when docs load
  useEffect(() => {
    if (documents && documents.length > 0 && !selectedDocId) {
      const first = documents[0];
      setSelectedDocId(first.id);
      setEditorContent(first.content || "");
      setDocTitle(first.title || "");
      lastSavedContentRef.current = first.content || "";
      pendingContentRef.current = first.content || "";
    }
  }, [documents, selectedDocId]);

  // Get currently selected document
  const selectedDoc = documents?.find((d) => d.id === selectedDocId) ?? null;

  // ---------------------------------------------------------------------------
  // Auto-save logic
  // ---------------------------------------------------------------------------

  const flushSave = useCallback(() => {
    if (!selectedDocId) return;
    const content = pendingContentRef.current;
    if (content !== lastSavedContentRef.current) {
      lastSavedContentRef.current = content;
      updateContent.mutate({ docId: selectedDocId, content });
    }
  }, [selectedDocId, updateContent]);

  const handleEditorChange = useCallback(
    (html: string) => {
      pendingContentRef.current = html;

      // Clear existing timer
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      // Set new 5-second inactivity timer
      saveTimerRef.current = setTimeout(() => {
        flushSave();
      }, AUTOSAVE_DELAY);
    },
    [flushSave]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Document actions
  // ---------------------------------------------------------------------------

  const handleCreateDocument = useCallback(
    async (folderId?: string | null) => {
      if (!worldId || !user) return;
      const result = await createDoc.mutateAsync({
        title: "Untitled Document",
        parentId: folderId ?? null,
      });
      setSelectedDocId(result.id);
      setEditorContent("");
      setDocTitle(result.title || "Untitled Document");
      lastSavedContentRef.current = "";
      pendingContentRef.current = "";
    },
    [worldId, user, createDoc]
  );

  const handleSelectDocument = useCallback(
    (doc: WorldEntry) => {
      // Flush current before switching
      flushSave();
      setSelectedDocId(doc.id);
      setEditorContent(doc.content || "");
      setDocTitle(doc.title || "");
      lastSavedContentRef.current = doc.content || "";
      pendingContentRef.current = doc.content || "";
    },
    [flushSave]
  );

  const handleDeleteDocument = useCallback(
    (docId: string) => {
      const doc = documents?.find((d) => d.id === docId);
      const docName = doc?.title || "this document";
      if (!window.confirm(`Delete "${docName}"? This cannot be undone.`)) return;
      deleteDoc.mutate(docId);
      if (selectedDocId === docId) {
        const remaining = documents?.filter((d) => d.id !== docId) ?? [];
        if (remaining.length > 0) {
          handleSelectDocument(remaining[0]);
        } else {
          setSelectedDocId(null);
          setEditorContent("");
          lastSavedContentRef.current = "";
          pendingContentRef.current = "";
        }
      }
    },
    [deleteDoc, selectedDocId, documents, handleSelectDocument]
  );

  const handleStartRename = useCallback((doc: WorldEntry) => {
    setRenamingDocId(doc.id);
    setRenameValue(doc.title);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (renamingDocId && renameValue.trim()) {
      renameDoc.mutate({ docId: renamingDocId, title: renameValue.trim() });
    }
    setRenamingDocId(null);
    setRenameValue("");
  }, [renamingDocId, renameValue, renameDoc]);

  const handleCancelRename = useCallback(() => {
    setRenamingDocId(null);
    setRenameValue("");
  }, []);

  // ---------------------------------------------------------------------------
  // Folder/chapter actions
  // ---------------------------------------------------------------------------

  const handleCreateFolder = useCallback(
    (title: string) => {
      if (!worldId || !user) return;
      createFolder.mutate(title);
    },
    [worldId, user, createFolder]
  );

  const handleMoveDocument = useCallback(
    (docId: string, folderId: string | null) => {
      moveDocument.mutate({ docId, folderId });
    },
    [moveDocument]
  );

  const handleRenameFolder = useCallback(
    (folderId: string, title: string) => {
      renameFolderMutation.mutate({ folderId, title });
    },
    [renameFolderMutation]
  );

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      deleteFolderMutation.mutate(folderId);
    },
    [deleteFolderMutation]
  );

  // ---------------------------------------------------------------------------
  // Version history actions
  // ---------------------------------------------------------------------------

  const handleManualSave = useCallback(() => {
    flushSave();
    createSnapshot();
  }, [flushSave, createSnapshot]);

  const handleRestoreVersion = useCallback(
    (snapshotId: string) => {
      const snapshot = restoreVersion(snapshotId);
      if (!snapshot) return;

      // Apply restored content
      setEditorContent(snapshot.content);
      pendingContentRef.current = snapshot.content;
      lastSavedContentRef.current = ""; // Force next save to persist

      // Trigger a save immediately
      if (selectedDocId) {
        updateContent.mutate({
          docId: selectedDocId,
          content: snapshot.content,
        });
        lastSavedContentRef.current = snapshot.content;
      }

      setPreviewSnapshot(null);
    },
    [restoreVersion, selectedDocId, updateContent]
  );

  // ---------------------------------------------------------------------------
  // Entity panel — insert helpers
  // ---------------------------------------------------------------------------

  const handleInsertMention = useCallback((name: string) => {
    const editorEl = document.querySelector(".tiptap");
    if (editorEl) {
      (editorEl as HTMLElement).focus();
      setTimeout(() => {
        document.execCommand("insertText", false, `@${name} `);
      }, 50);
    }
  }, []);

  const handleInsertWikiLink = useCallback((name: string) => {
    const editorEl = document.querySelector(".tiptap");
    if (editorEl) {
      (editorEl as HTMLElement).focus();
      setTimeout(() => {
        document.execCommand("insertText", false, `[[${name}]]`);
      }, 50);
    }
  }, []);

  const handlePinEntity = useCallback(
    (entity: Entity) => {
      addPin({
        id: entity.id,
        type: "entity",
        title: entity.name,
        content: entity.summary || entity.description || "",
      });
      toast({ title: "Pinned to References" });
    },
    [addPin, toast]
  );

  // ---------------------------------------------------------------------------
  // Insert shortcut helpers (for top bar [[ and @ buttons)
  // ---------------------------------------------------------------------------

  const handleInsertBracketShortcut = useCallback(() => {
    const editorEl = document.querySelector(".tiptap");
    if (editorEl) {
      (editorEl as HTMLElement).focus();
      setTimeout(() => {
        document.execCommand("insertText", false, "[[");
      }, 50);
    }
  }, []);

  const handleInsertMentionShortcut = useCallback(() => {
    const editorEl = document.querySelector(".tiptap");
    if (editorEl) {
      (editorEl as HTMLElement).focus();
      setTimeout(() => {
        document.execCommand("insertText", false, "@");
      }, 50);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Keyboard shortcuts
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S — manual save / snapshot
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
        return;
      }

      // Ctrl+\ — toggle left panel
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "\\") {
        e.preventDefault();
        setLeftPanelOpen((p) => !p);
        return;
      }

      // Ctrl+Shift+\ — toggle right panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "\\") {
        e.preventDefault();
        setRightPanelOpen((p) => !p);
        return;
      }

      // Ctrl+M — toggle moodboard
      if ((e.ctrlKey || e.metaKey) && e.key === "m") {
        e.preventDefault();
        setMoodboardOpen((p) => !p);
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleManualSave]);

  // Escape key exits zen mode
  useEffect(() => {
    if (!zenMode) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setZenMode(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [zenMode]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!worldId) return null;

  // ---------------------------------------------------------------------------
  // Zen Mode — full-viewport distraction-free overlay
  // ---------------------------------------------------------------------------

  if (zenMode && selectedDoc) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0A0E17] flex flex-col items-center overflow-hidden">
        {/* Exit button — top-right corner */}
        <button
          onClick={() => setZenMode(false)}
          className="fixed top-4 right-4 z-[10000] flex items-center gap-2 px-3 py-2 text-[10px] font-heading uppercase tracking-[1.5px] text-tier-4 hover:text-tier-2 border border-white/[0.08] hover:border-white/[0.15] bg-[#0E1320]/80 backdrop-blur-md rounded-xs transition-all opacity-60 hover:opacity-100"
          title="Exit Zen Mode (Esc)"
        >
          <X className="w-3.5 h-3.5" />
          <span>Exit Zen</span>
        </button>

        {/* Centered editor area */}
        <div className="flex-1 w-full max-w-[72ch] overflow-y-auto px-6 py-12 md:py-16">
          {/* Document title */}
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            onBlur={() => {
              const trimmed = docTitle.trim();
              if (trimmed && trimmed !== selectedDoc.title) {
                renameDoc.mutate({ docId: selectedDoc.id, title: trimmed });
              } else if (!trimmed) {
                setDocTitle(selectedDoc.title);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-full font-heading text-lg font-light tracking-wide text-tier-1 bg-transparent border-0 border-b border-white/[0.06] outline-none focus:border-[#15C17B]/20 rounded-none px-0 py-2 mb-6"
            placeholder="Document title..."
          />

          <div style={editorStyle}>
            <StellarForgeEditor
              key={`zen-${selectedDocId}`}
              content={editorContent}
              onChange={handleEditorChange}
              worldId={worldId}
              preset="full"
              placeholder="Begin writing..."
              minHeight="calc(100vh - 200px)"
            />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Normal Mode
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Moodboard Strip — above everything */}
      <WritingMoodboardStrip
        images={moodImages}
        open={moodboardOpen}
        onToggle={() => setMoodboardOpen((p) => !p)}
      />

      {/* Main row: left panel + center + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* ----------------------------------------------------------------- */}
        {/* Entity Panel (Left) */}
        {/* ----------------------------------------------------------------- */}
        <WritingEntityPanel
          worldId={worldId}
          open={leftPanelOpen}
          onToggle={() => setLeftPanelOpen((p) => !p)}
          onInsertMention={handleInsertMention}
          onInsertWikiLink={handleInsertWikiLink}
          onPinEntity={handlePinEntity}
        />

        {/* ----------------------------------------------------------------- */}
        {/* Center: Top Bar + Editor */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0A0E17]">
          {/* Top Bar */}
          <WritingTopBar
            documents={documents}
            docsLoading={docsLoading}
            selectedDoc={selectedDoc}
            selectedDocId={selectedDocId}
            onCreateDocument={handleCreateDocument}
            isCreating={createDoc.isPending}
            onSelectDocument={handleSelectDocument}
            onStartRename={handleStartRename}
            onDeleteDocument={handleDeleteDocument}
            renamingDocId={renamingDocId}
            renameValue={renameValue}
            onRenameValueChange={setRenameValue}
            onConfirmRename={handleConfirmRename}
            onCancelRename={handleCancelRename}
            isSaving={updateContent.isPending}
            leftPanelOpen={leftPanelOpen}
            onToggleLeftPanel={() => setLeftPanelOpen((p) => !p)}
            rightPanelOpen={rightPanelOpen}
            onToggleRightPanel={() => setRightPanelOpen((p) => !p)}
            moodboardOpen={moodboardOpen}
            onToggleMoodboard={() => setMoodboardOpen((p) => !p)}
            hasMoodboardImages={moodImages.length > 0}
            onEnterZen={() => setZenMode(true)}
            onInsertBracket={handleInsertBracketShortcut}
            onInsertMention={handleInsertMentionShortcut}
            folders={folders}
            unfiledDocs={unfiledDocs}
            onCreateFolder={handleCreateFolder}
            onMoveDocument={handleMoveDocument}
            onRenameFolder={handleRenameFolder}
            onDeleteFolder={handleDeleteFolder}
          />

          {/* Formatting bar */}
          {selectedDoc && (
            <div className="flex items-center gap-4 px-4 md:px-8 py-1.5 border-b border-white/[0.04] bg-[#0A0E17]">
              {/* Line spacing */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-sans font-medium uppercase tracking-[1.2px] text-tier-4">Spacing</span>
                <div className="flex">
                  {(["1", "1.5", "2"] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => setLineSpacing(val)}
                      className={`px-2 py-0.5 text-[10px] font-mono border border-white/[0.08] transition-colors ${
                        lineSpacing === val
                          ? "bg-[#15C17B]/[0.08] border-[#15C17B]/20 text-[#15C17B]"
                          : "text-tier-4 hover:text-tier-2 hover:border-white/[0.15]"
                      } ${val === "1" ? "rounded-l-xs" : val === "2" ? "rounded-r-xs" : ""} ${val !== "1" ? "-ml-px" : ""}`}
                    >
                      {val === "1" ? "1x" : val === "1.5" ? "1.5x" : "2x"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-sans font-medium uppercase tracking-[1.2px] text-tier-4">Font</span>
                <select
                  value={writingFont}
                  onChange={(e) => setWritingFont(e.target.value as WritingFont)}
                  className="text-[10px] font-sans bg-white/[0.04] border border-white/[0.08] text-tier-2 rounded-xs px-2 py-0.5 outline-none focus:border-[#15C17B]/30 cursor-pointer"
                >
                  <option value="DM Sans">DM Sans</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Merriweather">Merriweather</option>
                  <option value="Lora">Lora</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>
            </div>
          )}

          {/* Editor area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
            {selectedDoc ? (
              <div className="max-w-4xl mx-auto">
                {/* Editable document title */}
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  onBlur={() => {
                    const trimmed = docTitle.trim();
                    if (trimmed && trimmed !== selectedDoc.title) {
                      renameDoc.mutate({
                        docId: selectedDoc.id,
                        title: trimmed,
                      });
                    } else if (!trimmed) {
                      setDocTitle(selectedDoc.title);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-full font-heading text-xl font-light tracking-wide text-tier-1 bg-transparent border-0 border-b border-white/[0.08] outline-none focus:border-[#15C17B]/30 rounded-none px-0 py-2 mb-4"
                  placeholder="Document title..."
                />
                <div style={editorStyle}>
                  <StellarForgeEditor
                    key={selectedDocId}
                    content={editorContent}
                    onChange={handleEditorChange}
                    worldId={worldId}
                    preset="full"
                    placeholder="Begin writing. Use @ to mention entities, [[ to link wiki pages..."
                    minHeight="calc(100vh - 320px)"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <FileText className="w-10 h-10 text-tier-5" />
                <p className="text-sm text-tier-4 text-center max-w-xs">
                  Create a new document to start writing in this world.
                </p>
                <button
                  onClick={handleCreateDocument}
                  disabled={createDoc.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-[#15C17B] text-white font-sans text-sm font-medium rounded-none hover:shadow-[0_0_20px_rgba(61,255,205,0.2)] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Reference Panel (Right) */}
        {/* ----------------------------------------------------------------- */}
        <WritingReferencePanel
          worldId={resolvedWorldId}
          open={rightPanelOpen}
          onToggle={() => setRightPanelOpen((p) => !p)}
          snapshots={snapshots}
          onCreateSnapshot={handleManualSave}
          onRestoreVersion={handleRestoreVersion}
          previewSnapshot={previewSnapshot}
          onPreviewSnapshot={setPreviewSnapshot}
        />
      </div>
    </div>
  );
};

export default WorldWritingSpace;
