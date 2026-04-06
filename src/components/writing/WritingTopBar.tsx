// ---------------------------------------------------------------------------
// WritingTopBar — Extracted top bar for the Writing Space.
//
// Layout: left panel toggle | document dropdown + rename | save indicator |
//         moodboard toggle | right panel toggle | zen button
// ---------------------------------------------------------------------------

import { useCallback, useState } from "react";
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
  ImageIcon,
  PanelRight,
  StickyNote,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorldEntry } from "@/services/world-data";

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
  onCreateDocument: () => void;
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

  // Insert shortcut callbacks
  onInsertBracket?: () => void;
  onInsertMention?: () => void;
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
  onInsertBracket,
  onInsertMention,
}: WritingTopBarProps) {
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);

  const handleCreateDocument = useCallback(() => {
    onCreateDocument();
    setDocDropdownOpen(false);
  }, [onCreateDocument]);

  const handleSelectDocument = useCallback(
    (doc: WorldEntry) => {
      onSelectDocument(doc);
      setDocDropdownOpen(false);
    },
    [onSelectDocument]
  );

  return (
    <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#0E1320]/60 px-3 py-2">
      {/* Page label */}
      <span className="font-heading text-[10px] font-light uppercase tracking-[2px] text-tier-3 flex-shrink-0 hidden md:inline">
        Writing Space
      </span>

      {/* Left panel toggle */}
      <button
        onClick={onToggleLeftPanel}
        className={cn(
          "p-1.5 transition-colors border rounded-sm flex-shrink-0",
          leftPanelOpen
            ? "border-[#15C17B]/20 text-[#15C17B] bg-[#15C17B]/[0.06]"
            : "border-white/[0.08] text-tier-4 hover:text-tier-2 hover:border-white/[0.15]"
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
                disabled={isCreating}
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
                          onChange={(e) => onRenameValueChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onConfirmRename();
                            if (e.key === "Escape") onCancelRename();
                          }}
                          autoFocus
                          className="flex-1 min-w-0 bg-white/[0.06] border border-white/[0.15] rounded-xs px-2 py-0.5 text-xs text-tier-1 focus:outline-none focus:border-[#15C17B]/35"
                        />
                        <button
                          onClick={onConfirmRename}
                          className="p-0.5 text-[#15C17B] hover:text-[#3DFFCD]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={onCancelRename}
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
                              onStartRename(doc);
                            }}
                            className="p-1 text-tier-4 hover:text-tier-2"
                            title="Rename"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDocument(doc.id);
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

      {/* Save indicator */}
      {isSaving && (
        <span className="text-[9px] font-mono uppercase tracking-[1.5px] text-tier-4 flex-shrink-0">
          Saving...
        </span>
      )}

      {/* Insert shortcut buttons */}
      {onInsertBracket && (
        <button
          onClick={onInsertBracket}
          className="flex items-center justify-center px-2 py-1.5 font-mono text-xs text-[#5B8DEF] bg-[#5B8DEF]/[0.06] border border-[#5B8DEF]/[0.12] rounded-xs hover:bg-[#5B8DEF]/[0.12] transition-colors flex-shrink-0"
          title="Insert [[ to trigger wiki link autocomplete"
        >
          [[
        </button>
      )}
      {onInsertMention && (
        <button
          onClick={onInsertMention}
          className="flex items-center justify-center px-2 py-1.5 text-[#00FF88] bg-[#00FF88]/[0.06] border border-[#00FF88]/[0.12] rounded-xs hover:bg-[#00FF88]/[0.12] transition-colors flex-shrink-0"
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
              ? "border-[#FFB800]/30 text-[#FFB800] bg-[#FFB800]/[0.06]"
              : "border-white/[0.08] text-tier-4 hover:text-tier-2 hover:border-white/[0.15]"
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
            ? "border-[#5B8DEF]/30 text-[#5B8DEF] bg-[#5B8DEF]/[0.06]"
            : "border-white/[0.08] text-tier-4 hover:text-tier-2 hover:border-white/[0.15]"
        )}
        title="Toggle reference panel (Ctrl+Shift+\\)"
      >
        <PanelRight className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Ref</span>
      </button>

      {/* Zen Mode toggle */}
      {selectedDoc && (
        <button
          onClick={onEnterZen}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-heading uppercase tracking-[1.5px] border border-white/[0.08] text-tier-4 hover:text-tier-2 hover:border-white/[0.15] rounded-xs transition-colors flex-shrink-0"
          title="Enter Zen Mode (distraction-free)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Zen</span>
        </button>
      )}
    </div>
  );
}
