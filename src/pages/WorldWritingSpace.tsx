// ---------------------------------------------------------------------------
// WorldWritingSpace — Dedicated writing environment for a world.
//
// Route: /worlds/:worldId/write
// Layout: collapsible entity sidebar (left) + full StellarForge editor (main)
// Features: document CRUD, auto-save, entity @mentions from sidebar
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useMetaTags } from "@/hooks/use-meta-tags";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  FileText,
  ChevronDown,
  Check,
  X,
  History,
  RotateCcw,
  Eye,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDocumentVersions,
  type DocumentSnapshot,
} from "@/hooks/use-document-versions";
import { useAuth } from "@/contexts/AuthContext";
import { useEntities } from "@/hooks/use-entity-graph";
import {
  useWritingDocuments,
  useCreateDocument,
  useUpdateDocumentContent,
  useRenameDocument,
  useDeleteDocument,
} from "@/hooks/use-writing-documents";
import { StellarForgeEditor } from "@/components/editor/StellarForgeEditor";
import {
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_LABELS,
} from "@/services/entity-graph-types";
import type { Entity } from "@/services/entity-graph-types";
import type { WorldEntry } from "@/services/world-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SIDEBAR_WIDTH = 260;
const COLLAPSED_WIDTH = 0;
const AUTOSAVE_DELAY = 5000; // 5 seconds of inactivity

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WorldWritingSpace = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { user } = useAuth();

  // Data
  const { data: entities } = useEntities(worldId);
  const { data: documents, isLoading: docsLoading } =
    useWritingDocuments(worldId);
  const createDoc = useCreateDocument(worldId);
  const updateContent = useUpdateDocumentContent(worldId);
  const renameDoc = useRenameDocument(worldId);
  const deleteDoc = useDeleteDocument(worldId);

  // Dynamic meta tags
  useMetaTags({ title: "Writing Space" });

  // UI state
  const [zenMode, setZenMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [docTitle, setDocTitle] = useState("");

  // Version history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] =
    useState<DocumentSnapshot | null>(null);

  const {
    snapshots,
    createSnapshot,
    restoreVersion,
  } = useDocumentVersions(selectedDocId, docTitle, editorContent);

  // Auto-save refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const pendingContentRef = useRef<string>("");

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

  // Save on blur (the editor also fires onBlur internally)
  const handleEditorBlur = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    flushSave();
  }, [flushSave]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Final flush
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Document actions
  // ---------------------------------------------------------------------------

  const handleCreateDocument = useCallback(async () => {
    if (!worldId || !user) return;
    const result = await createDoc.mutateAsync("Untitled Document");
    setSelectedDocId(result.id);
    setEditorContent("");
    setDocTitle(result.title || "Untitled Document");
    lastSavedContentRef.current = "";
    pendingContentRef.current = "";
    setDocDropdownOpen(false);
  }, [worldId, user, createDoc]);

  const handleSelectDocument = useCallback(
    (doc: WorldEntry) => {
      // Flush current before switching
      flushSave();
      setSelectedDocId(doc.id);
      setEditorContent(doc.content || "");
      setDocTitle(doc.title || "");
      lastSavedContentRef.current = doc.content || "";
      pendingContentRef.current = doc.content || "";
      setDocDropdownOpen(false);
    },
    [flushSave]
  );

  const handleDeleteDocument = useCallback(
    (docId: string) => {
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
        updateContent.mutate({ docId: selectedDocId, content: snapshot.content });
        lastSavedContentRef.current = snapshot.content;
      }

      setPreviewSnapshot(null);
      setHistoryOpen(false);
    },
    [restoreVersion, selectedDocId, updateContent]
  );

  // Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
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
  // Entity sidebar — insert @mention
  // ---------------------------------------------------------------------------

  const handleEntityClick = useCallback((_entity: Entity) => {
    // Dispatch a custom event that the editor can listen for,
    // or insert @trigger text. We use the toolbar @ button approach:
    // The StellarForgeEditor already supports entity mentions via worldId.
    // We insert an @ + entity name prefix to trigger the autocomplete.
    const editorEl = document.querySelector(".tiptap");
    if (editorEl) {
      // Focus the editor and insert @EntityName to trigger mention
      (editorEl as HTMLElement).focus();
      // Use a small delay to ensure focus is settled
      setTimeout(() => {
        document.execCommand("insertText", false, `@${_entity.name} `);
      }, 50);
    }
  }, []);

  // Filtered entities
  const filteredEntities = (entities ?? []).filter((e) =>
    entityFilter
      ? e.name.toLowerCase().includes(entityFilter.toLowerCase()) ||
        e.entity_type.toLowerCase().includes(entityFilter.toLowerCase())
      : true
  );

  // Group entities by type
  const groupedEntities = filteredEntities.reduce<Record<string, Entity[]>>(
    (acc, entity) => {
      const type = entity.entity_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(entity);
      return acc;
    },
    {}
  );

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
          className="fixed top-4 right-4 z-[10000] flex items-center gap-2 px-3 py-2 text-[10px] font-heading uppercase tracking-[1.5px] text-tier-4 hover:text-tier-2 border border-white/[0.08] hover:border-white/[0.15] bg-[#0E1320]/80 backdrop-blur-md rounded-xs transition-all opacity-40 hover:opacity-100"
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
            className="w-full font-heading text-2xl font-light tracking-wide text-tier-1 bg-transparent border-0 border-b border-white/[0.06] outline-none focus:border-[#15C17B]/20 rounded-none px-0 py-2 mb-6"
            placeholder="Document title..."
          />

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
    );
  }

  // ---------------------------------------------------------------------------
  // Normal Mode
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ----------------------------------------------------------------- */}
      {/* Entity Sidebar */}
      {/* ----------------------------------------------------------------- */}
      <aside
        className={cn(
          "h-full flex-shrink-0 border-r border-white/[0.06] bg-[#0E1320]/90 backdrop-blur-md transition-all duration-300 ease-out overflow-hidden",
          sidebarOpen ? "w-[260px]" : "w-0"
        )}
        style={{ width: sidebarOpen ? SIDEBAR_WIDTH : COLLAPSED_WIDTH }}
      >
        <div className="flex h-full flex-col" style={{ width: SIDEBAR_WIDTH }}>
          {/* Sidebar header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
            <span className="font-heading text-[11px] font-light uppercase tracking-[2px] text-tier-3">
              World Entities
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-tier-4 hover:text-tier-2 transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Entity filter */}
          <div className="px-3 py-2">
            <input
              type="text"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              placeholder="Filter entities..."
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xs px-2.5 py-1.5 text-xs text-tier-2 placeholder:text-tier-5 focus:border-[#15C17B]/35 focus:outline-none"
            />
          </div>

          {/* Entity list */}
          <div className="flex-1 overflow-y-auto px-1 pb-4 sf-custom-scrollbar">
            {Object.entries(groupedEntities).map(([type, entities]) => (
              <div key={type} className="mb-3">
                <div className="px-2 py-1">
                  <span className="text-[9px] font-medium uppercase tracking-[1.5px] text-tier-4">
                    {ENTITY_TYPE_LABELS[type as keyof typeof ENTITY_TYPE_LABELS] ?? type}
                  </span>
                </div>
                {entities.map((entity) => (
                  <button
                    key={entity.id}
                    onClick={() => handleEntityClick(entity)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-sm hover:bg-white/[0.04] transition-colors group"
                    title={`Insert @${entity.name}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          entity.color ||
                          ENTITY_TYPE_COLORS[entity.entity_type] ||
                          "#15C17B",
                      }}
                    />
                    <span className="text-xs text-tier-2 truncate group-hover:text-tier-1 transition-colors">
                      {entity.name}
                    </span>
                  </button>
                ))}
              </div>
            ))}

            {filteredEntities.length === 0 && (
              <div className="px-3 py-6 text-center">
                <span className="text-[10px] uppercase tracking-[1.5px] text-tier-5">
                  {entityFilter ? "No matches" : "No entities yet"}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ----------------------------------------------------------------- */}
      {/* Main Editor Area */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top bar: sidebar toggle + document selector */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0E1320]/60 px-3 py-2">
          {/* Sidebar toggle (shown when collapsed) */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-tier-4 hover:text-tier-2 transition-colors border border-white/[0.08] rounded-sm"
              title="Show entity sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Document dropdown */}
          <div className="relative flex-1 max-w-md">
            <button
              onClick={() => setDocDropdownOpen((p) => !p)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xs hover:border-white/[0.15] transition-colors w-full min-w-0"
            >
              <FileText className="w-3.5 h-3.5 text-tier-4 flex-shrink-0" />
              <span className="text-sm text-tier-2 truncate">
                {selectedDoc?.title || "Select a document..."}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-tier-4 ml-auto flex-shrink-0" />
            </button>

            {/* Dropdown panel */}
            {docDropdownOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDocDropdownOpen(false)}
                />
                <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[280px] bg-[#161C2B] border border-white/[0.08] rounded-xs shadow-xl overflow-hidden">
                  {/* Create new */}
                  <button
                    onClick={handleCreateDocument}
                    disabled={createDoc.isPending}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#15C17B] hover:bg-[#15C17B]/[0.06] transition-colors border-b border-white/[0.06]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="font-sans text-xs font-medium uppercase tracking-[1px]">
                      New Document
                    </span>
                  </button>

                  {/* Document list */}
                  <div className="max-h-[240px] overflow-y-auto sf-custom-scrollbar">
                    {docsLoading && (
                      <div className="px-3 py-4 text-center">
                        <span className="text-[10px] uppercase tracking-[1.5px] text-tier-5">
                          Loading...
                        </span>
                      </div>
                    )}
                    {documents?.map((doc) => (
                      <div
                        key={doc.id}
                        className={cn(
                          "flex items-center group px-3 py-2 hover:bg-white/[0.04] transition-colors cursor-pointer",
                          doc.id === selectedDocId && "bg-white/[0.04]"
                        )}
                      >
                        {renamingDocId === doc.id ? (
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirmRename();
                                if (e.key === "Escape") handleCancelRename();
                              }}
                              autoFocus
                              className="flex-1 min-w-0 bg-white/[0.06] border border-white/[0.15] rounded-xs px-2 py-0.5 text-xs text-tier-1 focus:outline-none focus:border-[#15C17B]/35"
                            />
                            <button
                              onClick={handleConfirmRename}
                              className="p-0.5 text-[#15C17B] hover:text-[#3DFFCD]"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className="p-0.5 text-tier-4 hover:text-tier-2"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div
                              className="flex-1 min-w-0"
                              onClick={() => handleSelectDocument(doc)}
                            >
                              <span className="text-xs text-tier-2 truncate block">
                                {doc.title}
                              </span>
                              <span className="text-[9px] text-tier-5 font-mono">
                                {new Date(doc.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRename(doc);
                                }}
                                className="p-1 text-tier-4 hover:text-tier-2"
                                title="Rename"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDocument(doc.id);
                                }}
                                className="p-1 text-tier-4 hover:text-[#FF3366]"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    {!docsLoading && (!documents || documents.length === 0) && (
                      <div className="px-3 py-4 text-center">
                        <span className="text-[10px] uppercase tracking-[1.5px] text-tier-5">
                          No documents yet
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Auto-save indicator */}
          {updateContent.isPending && (
            <span className="text-[9px] font-mono uppercase tracking-[1.5px] text-tier-4 flex-shrink-0">
              Saving...
            </span>
          )}

          {/* Zen Mode toggle */}
          {selectedDoc && (
            <button
              onClick={() => setZenMode(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-heading uppercase tracking-[1.5px] border border-white/[0.08] text-tier-4 hover:text-tier-2 hover:border-white/[0.15] rounded-xs transition-colors flex-shrink-0"
              title="Enter Zen Mode (distraction-free)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zen</span>
            </button>
          )}

          {/* History button */}
          {selectedDoc && (
            <button
              onClick={() => setHistoryOpen((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-heading uppercase tracking-[1.5px] border rounded-xs transition-colors flex-shrink-0",
                historyOpen
                  ? "border-[#5B8DEF]/30 text-[#5B8DEF] bg-[#5B8DEF]/[0.06]"
                  : "border-white/[0.08] text-tier-4 hover:text-tier-2 hover:border-white/[0.15]"
              )}
              title="Version History"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
              {snapshots.length > 0 && (
                <span className="font-mono text-[9px] text-tier-5">
                  {snapshots.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Editor area + history panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main editor */}
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
                  className="w-full font-heading text-xl font-light tracking-wide text-tier-1 bg-transparent border-0 border-b border-white/[0.08] outline-none focus:border-[#15C17B]/30 rounded-none px-0 py-2 mb-4"
                  placeholder="Document title..."
                />
                <StellarForgeEditor
                  key={selectedDocId}
                  content={editorContent}
                  onChange={handleEditorChange}
                  worldId={worldId}
                  preset="full"
                  placeholder="Begin writing. Use @ to mention entities, [[ to link wiki pages..."
                  minHeight="calc(100vh - 280px)"
                />
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

          {/* Version History Panel */}
          {historyOpen && (
            <aside className="w-[300px] flex-shrink-0 border-l border-white/[0.06] bg-[#0E1320]/90 backdrop-blur-md overflow-hidden flex flex-col">
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
                <span className="font-heading text-[11px] font-light uppercase tracking-[2px] text-tier-3">
                  Version History
                </span>
                <button
                  onClick={() => {
                    setHistoryOpen(false);
                    setPreviewSnapshot(null);
                  }}
                  className="p-1 text-tier-4 hover:text-tier-2 transition-colors"
                  title="Close history"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Snapshot preview */}
              {previewSnapshot && (
                <div className="border-b border-white/[0.06] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-heading uppercase tracking-[1.5px] text-[#5B8DEF]">
                      Preview
                    </span>
                    <button
                      onClick={() => setPreviewSnapshot(null)}
                      className="text-[9px] text-tier-4 hover:text-tier-2 uppercase tracking-wider"
                    >
                      Close
                    </button>
                  </div>
                  <div
                    className="text-xs text-tier-2 max-h-[200px] overflow-y-auto sf-custom-scrollbar prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs"
                    dangerouslySetInnerHTML={{ __html: previewSnapshot.content }}
                  />
                  <button
                    onClick={() => handleRestoreVersion(previewSnapshot.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#5B8DEF]/[0.08] border border-[#5B8DEF]/20 text-[#5B8DEF] text-[10px] font-sans font-medium uppercase tracking-[1px] hover:bg-[#5B8DEF]/[0.15] transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore This Version
                  </button>
                </div>
              )}

              {/* Snapshot list */}
              <div className="flex-1 overflow-y-auto sf-custom-scrollbar">
                {snapshots.length === 0 ? (
                  <div className="px-3 py-8 text-center">
                    <History className="w-6 h-6 text-tier-5 mx-auto mb-2" />
                    <p className="text-[10px] uppercase tracking-[1.5px] text-tier-5">
                      No snapshots yet
                    </p>
                    <p className="text-[9px] text-tier-5 mt-1">
                      Press Ctrl+S to save a snapshot, or wait for auto-save every 5 min.
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {snapshots.map((snapshot, idx) => (
                      <div
                        key={snapshot.id}
                        className={cn(
                          "flex items-start gap-2 px-3 py-2 hover:bg-white/[0.04] transition-colors group cursor-pointer border-b border-white/[0.03]",
                          previewSnapshot?.id === snapshot.id && "bg-[#5B8DEF]/[0.04]"
                        )}
                        onClick={() => setPreviewSnapshot(snapshot)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-tier-3">
                              {new Date(snapshot.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {idx === 0 && (
                              <span className="text-[8px] font-mono uppercase tracking-wider text-[#15C17B]/60 bg-[#15C17B]/[0.06] border border-[#15C17B]/[0.12] px-1 py-px">
                                Latest
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-tier-5 font-mono block mt-0.5">
                            {new Date(snapshot.timestamp).toLocaleDateString()} &middot;{" "}
                            {snapshot.wordCount.toLocaleString()} words
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewSnapshot(snapshot);
                            }}
                            className="p-1 text-tier-4 hover:text-[#5B8DEF]"
                            title="Preview"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreVersion(snapshot.id);
                            }}
                            className="p-1 text-tier-4 hover:text-[#5B8DEF]"
                            title="Restore"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorldWritingSpace;
