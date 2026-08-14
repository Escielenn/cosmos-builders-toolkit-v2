// ---------------------------------------------------------------------------
// WritingReferencePanel, Right sidebar for the Writing Space.
//
// Three tabs:
//   Notes:   Browse & pin worksheets, world notes with inline expand and pin.
//   Pinned:  User-pinned items (notes, worksheets, entities) from localStorage.
//   History: Version history snapshots with preview and restore.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  X,
  StickyNote,
  Pin,
  PinOff,
  History,
  Eye,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  FileText,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorldNotes } from "@/hooks/use-world-notes";
import { useWritingPins, type PinnedItem } from "@/hooks/use-writing-pins";
import { useWorksheets } from "@/hooks/use-worksheets";
import { TOOL_PAGE_CONFIGS } from "@/lib/tool-page-config";
import { extractWorksheetFacts, summarizeFacts } from "@/lib/worksheet-facts";
import { getToolIcon } from "@/components/icons/tool-icons";
import type { DocumentSnapshot } from "@/hooks/use-document-versions";
import { sanitizeHtml } from "@/lib/sanitize";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WritingReferencePanelProps {
  worldId: string;
  open: boolean;
  onToggle: () => void;
  snapshots: DocumentSnapshot[];
  onCreateSnapshot: () => void;
  onRestoreVersion: (snapshotId: string) => void;
  previewSnapshot: DocumentSnapshot | null;
  onPreviewSnapshot: (snapshot: DocumentSnapshot | null) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PANEL_WIDTH = 320;

type TabId = "notes" | "pinned" | "history" | "scratch";

const TABS: { id: TabId; label: string; icon: typeof StickyNote }[] = [
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "pinned", label: "Pinned", icon: Pin },
  { id: "history", label: "History", icon: History },
  { id: "scratch", label: "Scratch", icon: Pencil },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WritingReferencePanel({
  worldId,
  open,
  onToggle,
  snapshots,
  onCreateSnapshot,
  onRestoreVersion,
  previewSnapshot,
  onPreviewSnapshot,
}: WritingReferencePanelProps) {
  const { notes, isLoading: notesLoading } = useWorldNotes(worldId);
  const { pins, addPin, removePin } = useWritingPins(worldId);
  const { worksheets, isLoading: worksheetsLoading } = useWorksheets(worldId);

  const [activeTab, setActiveTab] = useState<TabId>("notes");
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const [worksheetsExpanded, setWorksheetsExpanded] = useState(false);

  // Scratchpad, persisted to localStorage
  const scratchKey = `sf-scratchpad-${worldId}`;
  const [scratchText, setScratchText] = useState(() => {
    try {
      return localStorage.getItem(scratchKey) ?? "";
    } catch {
      return "";
    }
  });
  const scratchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScratchChange = useCallback(
    (value: string) => {
      setScratchText(value);
      if (scratchTimerRef.current) clearTimeout(scratchTimerRef.current);
      scratchTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(scratchKey, value);
        } catch {
          // storage full, ignore
        }
      }, 400);
    },
    [scratchKey]
  );

  // Cleanup scratch debounce timer
  useEffect(() => {
    return () => {
      if (scratchTimerRef.current) clearTimeout(scratchTimerRef.current);
    };
  }, []);

  // Toggle note expand
  const handleToggleNote = useCallback((noteId: string) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  }, []);

  // Pin a note
  const handlePinNote = useCallback(
    (note: { id: string; title: string; content: string }) => {
      addPin({
        id: note.id,
        type: "note",
        title: note.title,
        content: note.content,
      });
    },
    [addPin]
  );

  // Pin a worksheet. The preview shows the worksheet's own values; it used to
  // show the tool's marketing subtitle, which told the writer nothing about
  // their world.
  const handlePinWorksheet = useCallback(
    (ws: { id: string; tool_type: string; title: string | null; data?: unknown }) => {
      const cfg = TOOL_PAGE_CONFIGS[ws.tool_type];
      const displayTitle =
        ws.title || (cfg ? `${cfg.brandName}: ${cfg.fullName}` : ws.tool_type);
      const summary = summarizeFacts(
        extractWorksheetFacts(ws.tool_type, ws.data),
      );
      addPin({
        id: ws.id,
        type: "worksheet",
        title: displayTitle,
        content: summary || cfg?.subtitle || "",
      });
    },
    [addPin]
  );

  // Strip HTML for preview
  const stripHtml = (html: string) =>
    html.replace(/<[^>]*>/g, " ").trim();

  const previewText = (html: string, maxLen = 80) => {
    const text = stripHtml(html);
    return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <aside
      className={cn(
        "h-full flex-shrink-0 border-l border-white/[0.06] bg-sf-surface/90 backdrop-blur-md transition-all duration-300 ease-out overflow-hidden"
      )}
      style={{ width: open ? PANEL_WIDTH : 0 }}
    >
      <div
        className="flex h-full flex-col"
        style={{ width: PANEL_WIDTH }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
          <span className="font-heading text-[12px] font-light uppercase tracking-[2px] text-t3">
            Reference
          </span>
          <button
            onClick={onToggle}
            className="p-1 text-t4 hover:text-t2 transition-colors"
            title="Collapse panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count =
              tab.id === "pinned"
                ? pins.length
                : tab.id === "history"
                  ? snapshots.length
                  : tab.id === "notes"
                    ? notes.length
                    : 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[12px] font-heading uppercase tracking-[1.5px] transition-colors border-b-2",
                  isActive
                    ? "border-[#15C17B] text-sf-teal"
                    : "border-transparent text-t4 hover:text-t2"
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className="font-mono text-[12px] text-t5">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto sf-custom-scrollbar">
          {/* --------------------------------------------------------------- */}
          {/* Notes Tab */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "notes" && (
            <div className="py-1">
              {/* ----- Browse & Pin Worksheets ----- */}
              {(worksheets && worksheets.length > 0) && (
                <div className="border-b border-white/[0.06]">
                  <button
                    onClick={() => setWorksheetsExpanded((p) => !p)}
                    className="flex items-center justify-between w-full px-3 py-2 hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="font-heading text-[12px] font-light uppercase tracking-[1.5px] text-t3 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      Worksheets
                      <span className="font-mono text-[12px] text-t5">
                        {worksheets.length}
                      </span>
                    </span>
                    {worksheetsExpanded ? (
                      <ChevronUp className="w-3 h-3 text-t4" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-t4" />
                    )}
                  </button>
                  {worksheetsExpanded && (
                    <div className="pb-1">
                      {worksheets.map((ws) => {
                        const cfg = TOOL_PAGE_CONFIGS[ws.tool_type];
                        const ToolIcon = getToolIcon(ws.tool_type);
                        const displayTitle =
                          ws.title ||
                          (cfg
                            ? `${cfg.brandName}: ${cfg.fullName}`
                            : ws.tool_type);
                        const isWsPinned = pins.some(
                          (p) =>
                            p.id === ws.id && p.type === "worksheet",
                        );

                        return (
                          <div
                            key={ws.id}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/[0.03] transition-colors"
                          >
                            {ToolIcon ? (
                              <ToolIcon className="w-3.5 h-3.5 text-t4 flex-shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-t4 flex-shrink-0" />
                            )}
                            <span className="flex-1 text-[12px] text-t2 truncate">
                              {displayTitle}
                            </span>
                            <button
                              onClick={() =>
                                isWsPinned
                                  ? removePin(ws.id)
                                  : handlePinWorksheet(ws)
                              }
                              className={cn(
                                "p-0.5 transition-colors flex-shrink-0",
                                isWsPinned
                                  ? "text-sf-amber"
                                  : "text-t4 hover:text-sf-amber",
                              )}
                              title={
                                isWsPinned
                                  ? "Unpin"
                                  : "Pin to Writing Space"
                              }
                            >
                              {isWsPinned ? (
                                <PinOff className="w-3 h-3" />
                              ) : (
                                <Pin className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ----- World Notes ----- */}
              {notesLoading && (
                <div className="px-3 py-6 text-center">
                  <span className="text-[12px] uppercase tracking-[1.5px] text-t5">
                    Loading notes...
                  </span>
                </div>
              )}
              {!notesLoading && notes.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <StickyNote className="w-6 h-6 text-t5 mx-auto mb-2" />
                  <p className="text-[12px] uppercase tracking-[1.5px] text-t5">
                    No world notes yet
                  </p>
                  <p className="text-[12px] text-t5 mt-1">
                    Create notes in the World Dashboard to reference them here.
                  </p>
                </div>
              )}
              {notes.map((note) => {
                const isExpanded = expandedNoteIds.has(note.id);
                const isPinned = pins.some(
                  (p) => p.id === note.id && p.type === "note"
                );

                return (
                  <div
                    key={note.id}
                    className="border-b border-white/[0.03] px-3 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => handleToggleNote(note.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <span className="text-xs text-t2 block truncate">
                          {note.title}
                        </span>
                        {!isExpanded && note.content && (
                          <span className="text-[12px] text-t5 block mt-0.5">
                            {previewText(note.content)}
                          </span>
                        )}
                      </button>
                      <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                        <button
                          onClick={() => handleToggleNote(note.id)}
                          className="p-0.5 text-t4 hover:text-t2"
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            isPinned
                              ? removePin(note.id)
                              : handlePinNote(note)
                          }
                          className={cn(
                            "p-0.5 transition-colors",
                            isPinned
                              ? "text-sf-amber"
                              : "text-t4 hover:text-sf-amber"
                          )}
                          title={isPinned ? "Unpin" : "Pin"}
                        >
                          {isPinned ? (
                            <PinOff className="w-3 h-3" />
                          ) : (
                            <Pin className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    {isExpanded && note.content && (
                      <div
                        className="mt-2 text-xs text-t2 leading-relaxed prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs max-h-[300px] overflow-y-auto sf-custom-scrollbar"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* Pinned Tab */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "pinned" && (
            <div className="py-1">
              {pins.length === 0 && (
                <div className="px-3 py-8 text-center">
                  <Pin className="w-6 h-6 text-t5 mx-auto mb-2" />
                  <p className="text-[12px] uppercase tracking-[1.5px] text-t5">
                    No pinned items
                  </p>
                  <p className="text-[12px] text-t5 mt-1">
                    Pin notes or worksheets from the Notes tab to keep them visible while writing.
                  </p>
                </div>
              )}
              {pins.map((pin) => (
                <div
                  key={`${pin.type}-${pin.id}`}
                  className="border-b border-white/[0.03] px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-t2 truncate block">
                          {pin.title}
                        </span>
                        <span
                          className={cn(
                            "text-[12px] font-mono uppercase tracking-wider px-1 py-px rounded-sm flex-shrink-0",
                            pin.type === "entity"
                              ? "text-sf-emerald/70 bg-sf-emerald/[0.06] border border-sf-emerald/[0.12]"
                              : pin.type === "note"
                                ? "text-sf-amber/70 bg-sf-amber/[0.06] border border-[#FFB800]/[0.12]"
                                : pin.type === "worksheet"
                                  ? "text-sf-stellar/70 bg-sf-stellar/[0.06] border border-[#5B8DEF]/[0.12]"
                                  : "text-t5 bg-white/[0.04]"
                          )}
                        >
                          {pin.type === "worksheet" ? "sheet" : pin.type}
                        </span>
                      </div>
                      {pin.content && (
                        <span className="text-[12px] text-t5 block mt-0.5">
                          {previewText(pin.content)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removePin(pin.id, pin.type)}
                      className="p-0.5 text-sf-amber hover:text-sf-crimson transition-colors flex-shrink-0 mt-0.5"
                      title="Unpin"
                    >
                      <PinOff className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --------------------------------------------------------------- */}
          {/* History Tab */}
          {/* --------------------------------------------------------------- */}
          {/* --------------------------------------------------------------- */}
          {/* Scratch Tab */}
          {/* --------------------------------------------------------------- */}
          {activeTab === "scratch" && (
            <div className="flex flex-col h-full p-3">
              <span className="font-heading text-[12px] font-light uppercase tracking-[1.5px] text-t3 mb-2">
                Scratchpad
              </span>
              <textarea
                value={scratchText}
                onChange={(e) => handleScratchChange(e.target.value)}
                className="flex-1 w-full min-h-[300px] resize-none font-sans text-sm text-t2 bg-white/[0.03] border border-white/[0.08] rounded-xs p-3 outline-none focus:border-[#15C17B]/30 placeholder:text-t5 sf-custom-scrollbar"
                placeholder="Quick thoughts, scraps, ideas..."
              />
            </div>
          )}

          {activeTab === "history" && (
            <div>
              {/* Snapshot preview */}
              {previewSnapshot && (
                <div className="border-b border-white/[0.06] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-heading uppercase tracking-[1.5px] text-sf-stellar">
                      Preview
                    </span>
                    <button
                      onClick={() => onPreviewSnapshot(null)}
                      className="text-[12px] text-t4 hover:text-t2 uppercase tracking-wider"
                    >
                      Close
                    </button>
                  </div>
                  <div
                    className="text-xs text-t2 max-h-[200px] overflow-y-auto sf-custom-scrollbar prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(previewSnapshot.content),
                    }}
                  />
                  <button
                    onClick={() => onRestoreVersion(previewSnapshot.id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[#5B8DEF]/[0.08] border border-[#5B8DEF]/20 text-sf-stellar text-[12px] font-sans font-medium uppercase tracking-[1px] hover:bg-[#5B8DEF]/[0.15] transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore This Version
                  </button>
                </div>
              )}

              {/* Snapshot list */}
              {snapshots.length === 0 ? (
                <div className="px-3 py-8 text-center">
                  <History className="w-6 h-6 text-t5 mx-auto mb-2" />
                  <p className="text-[12px] uppercase tracking-[1.5px] text-t5">
                    No snapshots yet
                  </p>
                  <p className="text-[12px] text-t5 mt-1">
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
                        previewSnapshot?.id === snapshot.id &&
                          "bg-[#5B8DEF]/[0.04]"
                      )}
                      onClick={() => onPreviewSnapshot(snapshot)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[12px] text-t3">
                            {new Date(snapshot.timestamp).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                          {idx === 0 && (
                            <span className="text-[12px] font-mono uppercase tracking-wider text-sf-teal/60 bg-sf-teal/[0.06] border border-[#15C17B]/[0.12] px-1 py-px">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-[12px] text-t5 font-mono block mt-0.5">
                          {new Date(snapshot.timestamp).toLocaleDateString()}{" "}
                          &middot; {snapshot.wordCount.toLocaleString()} words
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewSnapshot(snapshot);
                          }}
                          className="p-1 text-t4 hover:text-sf-stellar"
                          title="Preview"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreVersion(snapshot.id);
                          }}
                          className="p-1 text-t4 hover:text-sf-stellar"
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
          )}
        </div>
      </div>
    </aside>
  );
}
