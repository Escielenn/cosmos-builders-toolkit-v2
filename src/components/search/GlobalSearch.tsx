import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Globe,
  FileText,
  Plus,
  Wrench,
  User,
  BookOpen,
  PenLine,
} from "lucide-react";
import { useWorlds } from "@/hooks/use-worlds";
import { useRecentWork } from "@/hooks/use-recent-work";
import { getToolDisplayName } from "@/lib/worksheet-links-config";
import { TOOL_ROUTES } from "@/lib/tools-config";
import { ToolGlyph, TOOL_GLYPH_IDS } from "@/components/icons/tool-icons";
import { shapePaletteGroups, type PaletteItem } from "@/lib/command-palette";

// Tool glyphs come from the shared line-glyph family (icons/tool-icons),
// so every tool in TOOL_ROUTES has its own mark here, not a lucide stand-in.
const glyphCache = new Map<string, React.ElementType>();
function toolGlyphIcon(toolType: string | undefined): React.ElementType | null {
  if (!toolType || !TOOL_GLYPH_IDS.includes(toolType)) return null;
  let Icon = glyphCache.get(toolType);
  if (!Icon) {
    const C = ({ className }: { className?: string }) => <ToolGlyph toolId={toolType} className={className} />;
    C.displayName = `SearchGlyph(${toolType})`;
    Icon = C;
    glyphCache.set(toolType, C);
  }
  return Icon;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PaletteRow({
  item,
  icon: Icon,
  onSelect,
}: {
  item: PaletteItem;
  icon: React.ElementType;
  onSelect: (href: string) => void;
}) {
  return (
    <CommandItem value={item.value} onSelect={() => onSelect(item.href)} className="flex items-center">
      <Icon className="mr-2 h-4 w-4 shrink-0 text-sf-primary-text" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
      <span className="ml-2 shrink-0 truncate text-xs text-t3">{item.detail}</span>
    </CommandItem>
  );
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { worlds } = useWorlds();
  const worldIds = useMemo(() => worlds.map((w) => w.id), [worlds]);
  // Same cache as the signed-in home, so opening ⌘K there costs no extra
  // read. Codex entries and documents are searched by title only.
  const { data, isLoading } = useRecentWork(worldIds, { enabled: open });

  const groups = useMemo(
    () =>
      shapePaletteGroups({
        worlds,
        docs: data.docs,
        entries: data.entries,
        worksheets: data.worksheets,
      }),
    [worlds, data],
  );

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      navigate(href);
    },
    [navigate, onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search worlds, documents, Codex, worksheets and tools..." autoFocus />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "SCANNING ARCHIVE..." : "NO MATCHING RECORDS."}
        </CommandEmpty>

        {groups.worlds.length > 0 && (
          <CommandGroup heading="Worlds">
            {groups.worlds.map((item) => (
              <PaletteRow key={item.key} item={item} icon={Globe} onSelect={go} />
            ))}
          </CommandGroup>
        )}

        {groups.documents.length > 0 && (
          <CommandGroup heading="Documents">
            {groups.documents.map((item) => (
              <PaletteRow key={item.key} item={item} icon={PenLine} onSelect={go} />
            ))}
          </CommandGroup>
        )}

        {groups.codex.length > 0 && (
          <CommandGroup heading="Codex">
            {groups.codex.map((item) => (
              <PaletteRow key={item.key} item={item} icon={BookOpen} onSelect={go} />
            ))}
          </CommandGroup>
        )}

        {groups.worksheets.length > 0 && (
          <CommandGroup heading="Worksheets">
            {groups.worksheets.map((item) => (
              <PaletteRow
                key={item.key}
                item={item}
                icon={toolGlyphIcon(item.toolType) || FileText}
                onSelect={go}
              />
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Tools */}
        <CommandGroup heading="Tools">
          {Object.entries(TOOL_ROUTES).map(([toolType, route]) => {
            const Icon = toolGlyphIcon(toolType) || Wrench;
            return (
              <CommandItem
                key={toolType}
                value={`tool ${getToolDisplayName(toolType)}`}
                onSelect={() => go(route)}
              >
                <Icon className="mr-2 h-4 w-4 shrink-0 text-t3" aria-hidden="true" />
                <span>{getToolDisplayName(toolType)}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Actions">
          <CommandItem
            value="action new world create world"
            onSelect={() => {
              // Same deep link HeaderNavigation's "New world" uses:
              // CreateWorldButton (rendered on /worlds) opens the create
              // dialog when it sees this param.
              go("/worlds?create=true");
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>New world</span>
          </CommandItem>
          <CommandItem value="action all tools catalog" onSelect={() => go("/tools")}>
            <Wrench className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>All tools</span>
          </CommandItem>
          <CommandItem value="action open profile" onSelect={() => go("/profile")}>
            <User className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Profile</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
