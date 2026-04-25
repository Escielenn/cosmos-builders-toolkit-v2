// ---------------------------------------------------------------------------
// WritingTopBar — Extracted top bar for the Writing Space.
//
// Layout: left panel toggle | document dropdown + rename | save indicator |
//         moodboard toggle | right panel toggle | zen button
//
// The document dropdown now supports a hierarchical folder/chapter structure.
// Folders are expandable groups; documents can be dragged between folders.
// ---------------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Pencil,
  FileText,
  ChevronDown,
  Check,
  X,
  Maximize2,
  StretchHorizontal,
  ImageIcon,
  PanelRight,
  AtSign,
  FolderOpen,
  FolderClosed,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorldEntry } from "@/services/world-data";
import type { WritingFolder, WritingDocument } from "@/hooks/use-writing-documents";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WritingTopBarProps {
  // Document state
  documents: WorldEntry[] | undefined;
  docsLoading: boolean;
  selectedDoc: WorldEntry | null;
  selectedDocId: string | null;

  // Document CRUD handlers
  onCreateDocument: (folderId?: string | null) => void;
  isCreating: boolean;
  onSelectDocument: (doc: WorldEntry) => void;
  onStartRename: (doc: WorldEntry) => void;
  onDeleteDocument: (docId: string) => void;

  // Rename state
  renamingDocId: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onConfirmRename: () => void;
  onCancelRename: () => void;

  // Save indicator
  isSaving: boolean;

  // Panel toggles
  leftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  moodboardOpen: boolean;
  onToggleMoodboard: () => void;
  hasMoodboardImages: boolean;

  // Zen mode
  onEnterZen: () => void;

  // Edge-to-edge / wide mode — expands editor from max-w-4xl to full width
  wideMode: boolean;
  onToggleWideMode: () => void;

  // Insert shortcut callbacks
  onInsertBracket?: () => void;
  onInsertMention?: () => void;

  // Folder/chapter system
  folders?: WritingFolder[];
  unfiledDocs?: WritingDocument[];
  onCreateFolder?: (title: string) => void;
  onMoveDocument?: (docId: string, folderId: string | null) => void;
  onRenameFolder?: (folderId: string, title: string) => void;
  onDeleteFolder?: (folderId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WritingTopBar({
  documents,
  docsLoading,
  selectedDoc,
  selectedDocId,
  onCreateDocument,
  isCreating,
  onSelectDocument,
  onStartRename,
  onDeleteDocument,
  renamingDocId,
  renameValue,
  onRenameValueChange,
  onConfirmRename,
  onCancelRename,
  isSaving,
  leftPanelOpen,
  onToggleLeftPanel,
  rightPanelOpen,
  onToggleRightPanel,
  moodboardOpen,
  onToggleMoodboard,
  hasMoodboardImages,
  onEnterZen,
  wideMode,
  onToggleWideMode,
  onInsertBracket,
  onInsertMention,
  folders = [],
  unfiledDocs = [],
  onCreateFolder,
  onMoveDocument,
  onRenameFolder,
  onDeleteFolder,
}: WritingTopBarProps) {
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [creatingChapter, setCreatingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverUnfiled, setDragOverUnfiled] = useState(false);
  const [folderContextMenu, setFolderContextMenu] = useState<{
    folderId: string;
    x: number;
    y: number;
  } | null>(null);
  const newChapterInputRef = useRef<HTMLInputElement>(null);

  const hasFolders = folders.length > 0;
  const useHierarchy = hasFolders || onCreateFolder;

  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }, []);

  const handleCreateDocument = useCallback(
    (folderId?: string | null) => {
      onCreateDocument(folderId);
      setDocDropdownOpen(false);
    },
    [onCreateDocument]
  );

  const handleSelectDocument = useCallback(
    (doc: WorldEntry) => {
      onSelectDocument(doc);
      setDocDropdownOpen(false);
    },
    [onSelectDocument]
  );

  const handleCreateChapter = useCallback(() => {
    const title = newChapterTitle.trim();
    if (title && onCreateFolder) {
      onCreateFolder(title);
      setNewChapterTitle("");
      setCreatingChapter(false);
    }
  }, [newChapterTitle, onCreateFolder]);

  const handleConfirmFolderRename = useCallback(() => {
    if (renamingFolderId && renameFolderValue.trim() && onRenameFolder) {
      onRenameFolder(renamingFolderId, renameFolderValue.trim());
    }
    setRenamingFolderId(null);
    setRenameFolderValue("");
  }, [renamingFolderId, renameFolderValue, onRenameFolder]);

  const handleCancelFolderRename = useCallback(() => {
    setRenamingFolderId(null);
    setRenameFolderValue("");
  }, []);

  // Drag-and-drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, docId: string) => {
      e.dataTransfer.setData("text/plain", docId);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragOverFolder = useCallback(
    (e: React.DragEvent, folderId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverFolderId(folderId);
      setDragOverUnfiled(false);
    },
    []
  );

  const handleDragOverUnfiled = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverFolderId(null);
    setDragOverUnfiled(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverFolderId(null);
    setDragOverUnfiled(false);
  }, []);

  const handleDropOnFolder = useCallback(
    (e: React.DragEvent, folderId: string) => {
      e.preventDefault();
      const docId = e.dataTransfer.getData("text/plain");
      if (docId && onMoveDocument) {
        onMoveDocument(docId, folderId);
      }
      setDragOverFolderId(null);
    },
    [onMoveDocument]
  );

  const handleDropOnUnfiled = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const docId = e.dataTransfer.getData("text/plain");
      if (docId && onMoveDocument) {
        onMoveDocument(docId, null);
      }
      setDragOverUnfiled(false);
    },
    [onMoveDocument]
  );

  const handleFolderContextMenu = useCallback(
    (e: React.MouseEvent, folderId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setFolderContextMenu({ folderId, x: e.clientX, y: e.clientY });
    },
    []
  );

  // ----- Render a single document row -----
  const renderDocRow = (doc: WorldEntry, indented: boolean = false) => (
    <div
      key={doc.id}
      draggable={!!onMoveDocument}
      onDragStart={(e) => handleDragStart(e, doc.id)}
      className={cn(
        "flex items-center group py-1.5 hover:bg-white/[0.04] transition-colors cursor-pointer",
        indented ? "pl-8 pr-3" : "pl-3 pr-3",
        doc.id === selectedDocId && "bg-white/[0.04]"
      )}
    >
      {renamingDocId === doc.id ? (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="text"
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirmRename();
              if (e.key === "Escape") onCancelRename();
            }}
            autoFocus
            className="flex-1 min-w-0 bg-white/[0.06] border border-white/[0.15] rounded-xs px-2 py-0.5 text-xs text-t1 focus:outline-none focus:border-[#15C17B]/35"
          />
          <button
            onClick={onConfirmRename}
            className="p-0.5 text-sf-teal hover:text-[#3DFFCD]"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onCancelRename}
            className="p-0.5 text-t4 hover:text-t2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          {onMoveDocument && (
            <GripVertical className="w-3 h-3 text-t5 mr-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 cursor-grab" />
          )}
          <FileText className="w-3 h-3 text-t4 mr-1.5 flex-shrink-0" />
          <div
            className="flex-1 min-w-0"
            onClick={() => handleSelectDocument(doc)}
          >
            <span className="text-xs text-t2 truncate block font-sans">
              {doc.title}
            </span>
            <span className="text-[9px] text-t5 font-mono">
              {new Date(doc.updated_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartRename(doc);
              }}
              className="p-1 text-t4 hover:text-t2"
              title="Rename"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDocument(doc.id);
              }}
              className="p-1 text-t4 hover:text-sf-crimson"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] bg-sf-surface/60 px-3 py-2">
      {/* Page label */}
      <span className="font-heading text-[11px] font-light uppercase tracking-[2px] text-t2 flex-shrink-0">
        Writing Space
      </span>

      {/* Left panel toggle */}
      <button
        onClick={onToggleLeftPanel}
        className={cn(
          "p-1.5 transition-colors border rounded-sm flex-shrink-0",
          leftPanelOpen
            ? "border-[#15C17B]/20 text-sf-teal bg-sf-teal/[0.06]"
            : "border-white/[0.08] text-t4 hover:text-t2 hover:border-white/[0.15]"
        )}
        title="Toggle entity panel (Ctrl+\\)"
      >
        {leftPanelOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Document dropdown */}
      <div className="relative flex-1 max-w-md">
        <button
          onClick={() => setDocDropdownOpen((p) => !p)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-xs hover:border-white/[0.15] transition-colors w-full min-w-0"
        >
          <FileText className="w-3.5 h-3.5 text-t4 flex-shrink-0" />
          <span className="text-sm text-t2 truncate">
            {selectedDoc?.title || "Select a document..."}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-t4 ml-auto flex-shrink-0" />
        </button>

        {/* Dropdown panel */}
        {docDropdownOpen && (
          <>
            {/* Backdrop — closes dropdown and context menu */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setDocDropdownOpen(false);
                setFolderContextMenu(null);
              }}
            />
            <div className="absolute left-0 top-full mt-1 z-50 w-full min-w-[300px] bg-sf-surface-elevated border border-white/[0.08] rounded-xs shadow-xl overflow-hidden">
              {/* Action bar: New Chapter + New Document */}
              <div className="flex items-center border-b border-white/[0.06]">
                {onCreateFolder && (
                  <button
                    onClick={() => {
                      setCreatingChapter(true);
                      setTimeout(() => newChapterInputRef.current?.focus(), 50);
                    }}
                    className="flex items-center gap-1.5 flex-1 px-3 py-2 text-sf-amber hover:bg-sf-amber/[0.06] transition-colors"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span className="font-sans text-[10px] font-medium uppercase tracking-[1px]">
                      New Chapter
                    </span>
                  </button>
                )}
                <button
                  onClick={() => handleCreateDocument(null)}
                  disabled={isCreating}
                  className="flex items-center gap-1.5 flex-1 px-3 py-2 text-sf-teal hover:bg-sf-teal/[0.06] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="font-sans text-[10px] font-medium uppercase tracking-[1px]">
                    New Document
                  </span>
                </button>
              </div>

              {/* New chapter inline input */}
              {creatingChapter && (
                <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.06] bg-[#FFB800]/[0.03]">
                  <FolderOpen className="w-3.5 h-3.5 text-sf-amber flex-shrink-0" />
                  <input
                    ref={newChapterInputRef}
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateChapter();
                      if (e.key === "Escape") {
                        setCreatingChapter(false);
                        setNewChapterTitle("");
                      }
                    }}
                    placeholder="Chapter title..."
                    className="flex-1 min-w-0 bg-white/[0.06] border border-white/[0.15] rounded-xs px-2 py-0.5 text-xs text-t1 focus:outline-none focus:border-[#FFB800]/35 placeholder:text-t5"
                  />
                  <button
                    onClick={handleCreateChapter}
                    className="p-0.5 text-sf-amber hover:text-sf-amber/80"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setCreatingChapter(false);
                      setNewChapterTitle("");
                    }}
                    className="p-0.5 text-t4 hover:text-t2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Hierarchical document list */}
              <div className="max-h-[320px] overflow-y-auto sf-custom-scrollbar">
                {docsLoading && (
                  <div className="px-3 py-4 text-center">
                    <span className="text-[10px] uppercase tracking-[1.5px] text-t5">
                      Loading...
                    </span>
                  </div>
                )}

                {!docsLoading && useHierarchy && (
                  <>
                    {/* Folders */}
                    {folders.map((folder) => {
                      const isExpanded = expandedFolders.has(folder.id);
                      const isRenaming = renamingFolderId === folder.id;
                      const isDragOver = dragOverFolderId === folder.id;

                      return (
                        <div key={folder.id}>
                          {/* Folder header */}
                          <div
                            className={cn(
                              "flex items-center group px-3 py-1.5 transition-colors cursor-pointer select-none",
                              isDragOver
                                ? "bg-[#FFB800]/[0.1] border-l-2 border-[#FFB800]"
                                : "hover:bg-white/[0.04]"
                            )}
                            onClick={() => toggleFolder(folder.id)}
                            onContextMenu={(e) =>
                              handleFolderContextMenu(e, folder.id)
                            }
                            onDragOver={(e) =>
                              handleDragOverFolder(e, folder.id)
                            }
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDropOnFolder(e, folder.id)}
                          >
                            <ChevronRight
                              className={cn(
                                "w-3 h-3 text-t4 mr-1 flex-shrink-0 transition-transform",
                                isExpanded && "rotate-90"
                              )}
                            />
                            {isExpanded ? (
                              <FolderOpen className="w-3.5 h-3.5 text-sf-amber mr-1.5 flex-shrink-0" />
                            ) : (
                              <FolderClosed className="w-3.5 h-3.5 text-sf-amber/60 mr-1.5 flex-shrink-0" />
                            )}

                            {isRenaming ? (
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={renameFolderValue}
                                  onChange={(e) =>
                                    setRenameFolderValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === "Enter")
                                      handleConfirmFolderRename();
                                    if (e.key === "Escape")
                                      handleCancelFolderRename();
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                  className="flex-1 min-w-0 bg-white/[0.06] border border-white/[0.15] rounded-xs px-2 py-0.5 text-xs text-t1 focus:outline-none focus:border-[#FFB800]/35"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmFolderRename();
                                  }}
                                  className="p-0.5 text-sf-amber hover:text-sf-amber/80"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelFolderRename();
                                  }}
                                  className="p-0.5 text-t4 hover:text-t2"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 min-w-0 text-[11px] font-heading font-light uppercase tracking-[1.5px] text-t2 truncate">
                                  {folder.title}
                                </span>
                                <span className="text-[9px] font-mono text-t5 mr-1">
                                  {folder.documents.length}
                                </span>
                                {/* Add doc to this folder */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateDocument(folder.id);
                                  }}
                                  className="p-0.5 text-t5 hover:text-sf-teal opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="New document in this chapter"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Folder children */}
                          {isExpanded && (
                            <div>
                              {folder.documents.length === 0 && (
                                <div className="pl-8 pr-3 py-2">
                                  <span className="text-[9px] uppercase tracking-[1px] text-t5 italic">
                                    Empty chapter
                                  </span>
                                </div>
                              )}
                              {folder.documents.map((doc) =>
                                renderDocRow(doc, true)
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Unfiled documents */}
                    {unfiledDocs.length > 0 && (
                      <div
                        className={cn(
                          folders.length > 0 &&
                            "border-t border-white/[0.06] mt-1 pt-1"
                        )}
                        onDragOver={handleDragOverUnfiled}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDropOnUnfiled}
                      >
                        {folders.length > 0 && (
                          <div
                            className={cn(
                              "px-3 py-1 transition-colors",
                              dragOverUnfiled && "bg-white/[0.04]"
                            )}
                          >
                            <span className="text-[9px] font-heading font-light uppercase tracking-[1.5px] text-t4">
                              Unfiled
                            </span>
                          </div>
                        )}
                        {unfiledDocs.map((doc) =>
                          renderDocRow(doc, false)
                        )}
                      </div>
                    )}

                    {/* Empty state */}
                    {!docsLoading &&
                      folders.length === 0 &&
                      unfiledDocs.length === 0 && (
                        <div className="px-3 py-4 text-center">
                          <span className="text-[10px] uppercase tracking-[1.5px] text-t5">
                            No documents yet
                          </span>
                        </div>
                      )}
                  </>
                )}

                {/* Flat list fallback (no folder system) */}
                {!docsLoading && !useHierarchy && (
                  <>
                    {documents?.map((doc) => renderDocRow(doc, false))}
                    {(!documents || documents.length === 0) && (
                      <div className="px-3 py-4 text-center">
                        <span className="text-[10px] uppercase tracking-[1.5px] text-t5">
                          No documents yet
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Folder context menu */}
            {folderContextMenu && (
              <>
                <div
                  className="fixed inset-0 z-[60]"
                  onClick={() => setFolderContextMenu(null)}
                />
                <div
                  className="fixed z-[61] bg-sf-surface-elevated border border-white/[0.1] rounded-xs shadow-xl overflow-hidden min-w-[140px]"
                  style={{
                    left: folderContextMenu.x,
                    top: folderContextMenu.y,
                  }}
                >
                  <button
                    onClick={() => {
                      const folder = folders.find(
                        (f) => f.id === folderContextMenu.folderId
                      );
                      if (folder) {
                        setRenamingFolderId(folder.id);
                        setRenameFolderValue(folder.title);
                      }
                      setFolderContextMenu(null);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-t2 hover:bg-white/[0.06] transition-colors"
                  >
                    <Pencil className="w-3 h-3 text-t4" />
                    <span className="font-sans">Rename</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onDeleteFolder) {
                        const folder = folders.find(
                          (f) => f.id === folderContextMenu.folderId
                        );
                        const name = folder?.title || "this chapter";
                        if (
                          window.confirm(
                            `Delete "${name}"? Documents inside will be moved to Unfiled.`
                          )
                        ) {
                          onDeleteFolder(folderContextMenu.folderId);
                        }
                      }
                      setFolderContextMenu(null);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-sf-crimson hover:bg-[#FF3366]/[0.06] transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="font-sans">Delete</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Save indicator */}
      {isSaving && (
        <span className="text-[9px] font-mono uppercase tracking-[1.5px] text-t4 flex-shrink-0">
          Saving...
        </span>
      )}

      {/* Insert shortcut buttons */}
      {onInsertBracket && (
        <button
          onClick={onInsertBracket}
          className="flex items-center justify-center px-2 py-1.5 font-mono text-xs text-sf-stellar bg-sf-stellar/[0.06] border border-[#5B8DEF]/[0.12] rounded-xs hover:bg-sf-stellar/[0.12] transition-colors flex-shrink-0"
          title="Insert [[ to trigger wiki link autocomplete"
        >
          [[
        </button>
      )}
      {onInsertMention && (
        <button
          onClick={onInsertMention}
          className="flex items-center justify-center px-2 py-1.5 text-sf-emerald bg-sf-emerald/[0.06] border border-sf-emerald/[0.12] rounded-xs hover:bg-[#00FF88]/[0.12] transition-colors flex-shrink-0"
          title="Insert @ to trigger entity mention autocomplete"
        >
          <AtSign className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Moodboard toggle */}
      {hasMoodboardImages && (
        <button
          onClick={onToggleMoodboard}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-heading uppercase tracking-[1.5px] border rounded-xs transition-colors flex-shrink-0",
            moodboardOpen
              ? "border-[#FFB800]/30 text-sf-amber bg-sf-amber/[0.06]"
              : "border-white/[0.08] text-t4 hover:text-t2 hover:border-white/[0.15]"
          )}
          title="Toggle moodboard (Ctrl+M)"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mood</span>
        </button>
      )}

      {/* Right panel toggle */}
      <button
        onClick={onToggleRightPanel}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-heading uppercase tracking-[1.5px] border rounded-xs transition-colors flex-shrink-0",
          rightPanelOpen
            ? "border-[#5B8DEF]/30 text-sf-stellar bg-sf-stellar/[0.06]"
            : "border-white/[0.08] text-t4 hover:text-t2 hover:border-white/[0.15]"
        )}
        title="Toggle reference panel (Ctrl+Shift+\\)"
      >
        <PanelRight className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Ref</span>
      </button>

      {/* Wide-mode toggle — expands editor from centered max-w-4xl to edge-to-edge */}
      {selectedDoc && (
        <button
          onClick={onToggleWideMode}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-heading uppercase tracking-[1.5px] border rounded-xs transition-colors duration-base flex-shrink-0",
            wideMode
              ? "border-sf-teal/30 text-sf-teal bg-sf-teal/[0.06]"
              : "border-sf-border text-t4 hover:text-t2 hover:border-sf-border-strong"
          )}
          title="Toggle wide mode (edge-to-edge editor)"
          aria-pressed={wideMode}
        >
          <StretchHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Wide</span>
        </button>
      )}

      {/* Zen Mode toggle */}
      {selectedDoc && (
        <button
          onClick={onEnterZen}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-heading uppercase tracking-[1.5px] border border-sf-border text-t4 hover:text-t2 hover:border-sf-border-strong rounded-xs transition-colors duration-base flex-shrink-0"
          title="Enter Zen Mode (distraction-free)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Zen</span>
        </button>
      )}
    </div>
  );
}
