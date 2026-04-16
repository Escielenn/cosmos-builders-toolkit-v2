// ---------------------------------------------------------------------------
// ChapterTree — collapsible folder tree for the writing space.
//
// Replaces the top-bar document dropdown as the primary chapter navigation.
// Shows folders + nested documents + unfiled documents in a left rail that
// persists while writing.
//
// Interactions:
//   - Single click on doc → select (opens in editor)
//   - Double click on title → inline rename (F2 also works)
//   - Kebab menu per row → rename / delete / move to folder
//   - Folder header → toggle collapse
//   - "+ Document" button → creates doc at root or in a folder
//   - "+ Folder" button → creates an empty folder
//
// No drag-drop yet; move-to-folder is done via the kebab menu.
// ---------------------------------------------------------------------------

import { useMemo, useState, type KeyboardEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderPlus,
  MoreVertical,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { WorldEntry } from "@/services/world-data";
import type { WritingFolder } from "@/hooks/use-writing-documents";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ChapterTreeProps {
  open: boolean;
  onToggle: () => void;
  folders: WritingFolder[];
  unfiledDocs: WorldEntry[];
  selectedDocId: string | null;
  onSelectDocument: (docId: string) => void;
  onCreateDocument: (parentId?: string | null) => void;
  onCreateFolder: () => void;
  onRenameDocument: (docId: string, newTitle: string) => void;
  onDeleteDocument: (docId: string) => void;
  onMoveDocument: (docId: string, folderId: string | null) => void;
  onRenameFolder: (folderId: string, newTitle: string) => void;
  onDeleteFolder: (folderId: string) => void;
}

// ---------------------------------------------------------------------------
// Word count helper (matches writing space's counting logic)
// ---------------------------------------------------------------------------

function countWords(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, " ").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChapterTree({
  open,
  onToggle,
  folders,
  unfiledDocs,
  selectedDocId,
  onSelectDocument,
  onCreateDocument,
  onCreateFolder,
  onRenameDocument,
  onDeleteDocument,
  onMoveDocument,
  onRenameFolder,
  onDeleteFolder,
}: ChapterTreeProps): JSX.Element {
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  const beginRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const commitRename = (kind: "doc" | "folder") => {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      if (kind === "doc") onRenameDocument(renamingId, trimmed);
      else onRenameFolder(renamingId, trimmed);
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const renameKeydown =
    (kind: "doc" | "folder") => (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") commitRename(kind);
      if (e.key === "Escape") cancelRename();
    };

  // Rail counts for the header
  const totalDocs = useMemo(() => {
    let n = unfiledDocs.length;
    for (const f of folders) n += f.documents.length;
    return n;
  }, [folders, unfiledDocs]);

  const totalWords = useMemo(() => {
    let n = 0;
    for (const d of unfiledDocs) n += countWords(d.content);
    for (const f of folders) for (const d of f.documents) n += countWords(d.content);
    return n;
  }, [folders, unfiledDocs]);

  // ---------------------------------------------------------------------------
  // Collapsed rail
  // ---------------------------------------------------------------------------

  if (!open) {
    return (
      <aside
        className={cn(
          "shrink-0 w-8 h-full border-r border-white/5",
          "bg-[hsl(222_25%_9%_/_0.6)] flex flex-col items-center py-2"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-tier-4 hover:text-tier-2"
          onClick={onToggle}
          aria-label="Open chapter tree"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </Button>
      </aside>
    );
  }

  // ---------------------------------------------------------------------------
  // Full panel
  // ---------------------------------------------------------------------------

  return (
    <aside
      className={cn(
        "shrink-0 h-full flex flex-col border-r border-white/5",
        "bg-[hsl(222_25%_9%_/_0.8)]"
      )}
      style={{ width: 260 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-[11px] tracking-[1.5px] uppercase text-tier-3">
            Chapters
          </h2>
          <p className="text-[10px] text-tier-5 font-mono">
            {totalDocs} doc{totalDocs === 1 ? "" : "s"} · {totalWords.toLocaleString()} words
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-tier-3 hover:text-tier-1"
            onClick={() => onCreateDocument(null)}
            aria-label="New document"
            title="New document"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-tier-3 hover:text-tier-1"
            onClick={onCreateFolder}
            aria-label="New folder"
            title="New folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-tier-4 hover:text-tier-2"
            onClick={onToggle}
            aria-label="Collapse chapter tree"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Tree body */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Folders */}
        {folders.map((folder) => {
          const collapsed = collapsedFolders.has(folder.id);
          const folderWords = folder.documents.reduce(
            (sum, d) => sum + countWords(d.content),
            0
          );
          const isRenamingThis =
            renamingId === folder.id && renameValue !== "";

          return (
            <div key={folder.id} className="mb-0.5">
              {/* Folder row */}
              <div
                className={cn(
                  "group flex items-center gap-1 px-2 py-1",
                  "hover:bg-white/[0.03] transition-colors"
                )}
              >
                <button
                  type="button"
                  className="shrink-0 text-tier-4 hover:text-tier-2"
                  onClick={() => toggleFolder(folder.id)}
                  aria-label={collapsed ? "Expand folder" : "Collapse folder"}
                >
                  {collapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
                <Folder className="w-3.5 h-3.5 text-[#FFB347] shrink-0" />
                {isRenamingThis ? (
                  <Input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename("folder")}
                    onKeyDown={renameKeydown("folder")}
                    className="h-6 text-xs py-0 px-1.5 flex-1"
                  />
                ) : (
                  <button
                    type="button"
                    onDoubleClick={() => beginRename(folder.id, folder.title)}
                    className="flex-1 text-left text-xs font-medium text-tier-2 truncate hover:text-tier-1"
                  >
                    {folder.title}
                  </button>
                )}
                <span className="text-[10px] font-mono text-tier-5 shrink-0">
                  {folder.documents.length}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-tier-4"
                      aria-label="Folder actions"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() => onCreateDocument(folder.id)}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-2" /> New document here
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => beginRename(folder.id, folder.title)}
                      className="text-xs"
                    >
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDeleteFolder(folder.id)}
                      className="text-xs text-destructive focus:text-destructive"
                    >
                      Delete folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Folder children */}
              {!collapsed && (
                <div className="pl-6">
                  {folder.documents.length === 0 ? (
                    <div className="px-2 py-1 text-[10px] text-tier-5 italic">
                      empty
                    </div>
                  ) : (
                    folder.documents.map((doc) => (
                      <DocRow
                        key={doc.id}
                        doc={doc}
                        folderWords={folderWords}
                        selected={doc.id === selectedDocId}
                        isRenaming={renamingId === doc.id && renameValue !== ""}
                        renameValue={renameValue}
                        onRenameChange={setRenameValue}
                        onRenameBlur={() => commitRename("doc")}
                        onRenameKeydown={renameKeydown("doc")}
                        onSelect={() => onSelectDocument(doc.id)}
                        onBeginRename={() => beginRename(doc.id, doc.title)}
                        onDelete={() => onDeleteDocument(doc.id)}
                        folders={folders}
                        currentFolderId={folder.id}
                        onMove={(folderId) => onMoveDocument(doc.id, folderId)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unfiled */}
        {unfiledDocs.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/5">
            <div className="px-3 py-1">
              <span className="text-[9px] uppercase tracking-[1.5px] text-tier-5 font-heading">
                Unfiled
              </span>
            </div>
            {unfiledDocs.map((doc) => (
              <div className="pl-2" key={doc.id}>
                <DocRow
                  doc={doc}
                  selected={doc.id === selectedDocId}
                  isRenaming={renamingId === doc.id && renameValue !== ""}
                  renameValue={renameValue}
                  onRenameChange={setRenameValue}
                  onRenameBlur={() => commitRename("doc")}
                  onRenameKeydown={renameKeydown("doc")}
                  onSelect={() => onSelectDocument(doc.id)}
                  onBeginRename={() => beginRename(doc.id, doc.title)}
                  onDelete={() => onDeleteDocument(doc.id)}
                  folders={folders}
                  currentFolderId={null}
                  onMove={(folderId) => onMoveDocument(doc.id, folderId)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {folders.length === 0 && unfiledDocs.length === 0 && (
          <div className="px-4 py-8 text-center">
            <FileText className="w-8 h-8 mx-auto mb-2 text-tier-5 opacity-40" />
            <p className="text-xs text-tier-4 mb-3">No documents yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCreateDocument(null)}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New document
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// DocRow — single document row in the tree
// ---------------------------------------------------------------------------

interface DocRowProps {
  doc: WorldEntry;
  folderWords?: number;
  selected: boolean;
  isRenaming: boolean;
  renameValue: string;
  onRenameChange: (v: string) => void;
  onRenameBlur: () => void;
  onRenameKeydown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onSelect: () => void;
  onBeginRename: () => void;
  onDelete: () => void;
  folders: WritingFolder[];
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
}

function DocRow({
  doc,
  selected,
  isRenaming,
  renameValue,
  onRenameChange,
  onRenameBlur,
  onRenameKeydown,
  onSelect,
  onBeginRename,
  onDelete,
  folders,
  currentFolderId,
  onMove,
}: DocRowProps) {
  const words = countWords(doc.content);
  const otherFolders = folders.filter((f) => f.id !== currentFolderId);

  return (
    <div
      className={cn(
        "group flex items-center gap-1 px-2 py-1 cursor-pointer",
        "transition-colors",
        selected
          ? "bg-primary/[0.06] border-l-2 border-primary"
          : "border-l-2 border-transparent hover:bg-white/[0.03]"
      )}
      onClick={(e) => {
        // Don't trigger select when clicking the kebab or rename input
        const target = e.target as HTMLElement;
        if (target.closest("[data-stop-select]")) return;
        onSelect();
      }}
    >
      <FileText
        className={cn(
          "w-3 h-3 shrink-0",
          selected ? "text-primary" : "text-tier-4"
        )}
      />
      {isRenaming ? (
        <div data-stop-select className="flex-1">
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
            onBlur={onRenameBlur}
            onKeyDown={onRenameKeydown}
            className="h-6 text-xs py-0 px-1.5"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <button
          type="button"
          onDoubleClick={(e) => {
            e.stopPropagation();
            onBeginRename();
          }}
          className={cn(
            "flex-1 text-left text-xs truncate",
            selected ? "text-tier-1 font-medium" : "text-tier-2"
          )}
        >
          {doc.title || "Untitled"}
        </button>
      )}
      {words > 0 && (
        <span className="text-[9px] font-mono text-tier-5 shrink-0">
          {words < 1000 ? words : `${Math.round(words / 100) / 10}k`}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-tier-4"
            aria-label="Document actions"
            data-stop-select
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onBeginRename();
            }}
            className="text-xs"
          >
            Rename
          </DropdownMenuItem>
          {folders.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                Move to…
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuLabel className="text-[10px] uppercase tracking-[1.5px] text-tier-4">
                  Move to folder
                </DropdownMenuLabel>
                {otherFolders.map((f) => (
                  <DropdownMenuItem
                    key={f.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMove(f.id);
                    }}
                    className="text-xs"
                  >
                    <Folder className="w-3 h-3 mr-2 text-[#FFB347]" />
                    {f.title}
                  </DropdownMenuItem>
                ))}
                {currentFolderId && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove(null);
                      }}
                      className="text-xs"
                    >
                      Move out of folder
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-xs text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
