import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Pencil,
  Trash2,
  Link,
  ExternalLink,
  Palette,
  Tag,
  Copy,
} from "lucide-react";

interface TreeContextMenuProps {
  children: React.ReactNode;
  isWorksheet: boolean;
  onRename: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onLinkTo?: () => void;
  onOpenInTool?: () => void;
}

const TreeContextMenu = ({
  children,
  isWorksheet,
  onRename,
  onDelete,
  onDuplicate,
  onLinkTo,
  onOpenInTool,
}: TreeContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {!isWorksheet && (
          <ContextMenuItem onClick={onRename}>
            <Pencil className="w-3.5 h-3.5 mr-2" />
            Rename
          </ContextMenuItem>
        )}
        {isWorksheet && onOpenInTool && (
          <ContextMenuItem onClick={onOpenInTool}>
            <ExternalLink className="w-3.5 h-3.5 mr-2" />
            Open in Tool
          </ContextMenuItem>
        )}
        {onDuplicate && (
          <ContextMenuItem onClick={onDuplicate}>
            <Copy className="w-3.5 h-3.5 mr-2" />
            Duplicate
          </ContextMenuItem>
        )}
        {onLinkTo && (
          <ContextMenuItem onClick={onLinkTo}>
            <Link className="w-3.5 h-3.5 mr-2" />
            Link to...
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default TreeContextMenu;
