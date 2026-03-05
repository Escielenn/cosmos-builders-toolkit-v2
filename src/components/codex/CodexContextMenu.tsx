import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FileText, Wrench, Pencil, Copy, FolderInput, Trash2, Tag, Image, Pin, PinOff } from "lucide-react";
import type { CodexElement } from "@/services/world-data";

interface CodexContextMenuProps {
  element: CodexElement;
  children: React.ReactNode;
  onOpenWiki?: (element: CodexElement) => void;
  onOpenTool?: (element: CodexElement) => void;
  onRename?: (element: CodexElement) => void;
  onDuplicate?: (element: CodexElement) => void;
  onMoveTo?: (element: CodexElement) => void;
  onAddTag?: (element: CodexElement) => void;
  onChangeIcon?: (element: CodexElement) => void;
  onSticky?: (element: CodexElement) => void;
  isPinned?: boolean;
  onDelete?: (element: CodexElement) => void;
}

const CodexContextMenu = ({
  element,
  children,
  onOpenWiki,
  onOpenTool,
  onRename,
  onDuplicate,
  onMoveTo,
  onAddTag,
  onChangeIcon,
  onSticky,
  isPinned,
  onDelete,
}: CodexContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-[#0D1117] border-border/20">
        {onOpenWiki && (
          <ContextMenuItem
            onClick={() => onOpenWiki(element)}
            className="text-xs gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Open Wiki Page
          </ContextMenuItem>
        )}
        {onOpenTool && element.toolSource && (
          <ContextMenuItem
            onClick={() => onOpenTool(element)}
            className="text-xs gap-2"
          >
            <Wrench className="w-3.5 h-3.5" />
            Open in Tool
          </ContextMenuItem>
        )}
        {(onOpenWiki || onOpenTool) && <ContextMenuSeparator />}

        {onRename && (
          <ContextMenuItem
            onClick={() => onRename(element)}
            className="text-xs gap-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            Rename
          </ContextMenuItem>
        )}
        {onDuplicate && (
          <ContextMenuItem
            onClick={() => onDuplicate(element)}
            className="text-xs gap-2"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </ContextMenuItem>
        )}
        {onMoveTo && (
          <ContextMenuItem
            onClick={() => onMoveTo(element)}
            className="text-xs gap-2"
          >
            <FolderInput className="w-3.5 h-3.5" />
            Move to...
          </ContextMenuItem>
        )}
        {onSticky && (
          <ContextMenuItem
            onClick={() => onSticky(element)}
            className="text-xs gap-2"
          >
            {isPinned ? (
              <>
                <PinOff className="w-3.5 h-3.5" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5" />
                Pin to Top
              </>
            )}
          </ContextMenuItem>
        )}
        {(onRename || onDuplicate || onMoveTo || onSticky) && <ContextMenuSeparator />}

        {onAddTag && (
          <ContextMenuItem
            onClick={() => onAddTag(element)}
            className="text-xs gap-2"
          >
            <Tag className="w-3.5 h-3.5" />
            Add Tag
          </ContextMenuItem>
        )}
        {onChangeIcon && (
          <ContextMenuItem
            onClick={() => onChangeIcon(element)}
            className="text-xs gap-2"
          >
            <Image className="w-3.5 h-3.5" />
            Change Icon
          </ContextMenuItem>
        )}
        {(onAddTag || onChangeIcon) && onDelete && <ContextMenuSeparator />}

        {onDelete && (
          <ContextMenuItem
            onClick={() => onDelete(element)}
            className="text-xs gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default CodexContextMenu;
