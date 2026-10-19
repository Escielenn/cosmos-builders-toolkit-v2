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
  Dna,
  Sparkles,
  GitBranch,
  Rocket,
  Zap,
  Calculator,
  Plus,
  Wrench,
  Sun,
  Crown,
  Cpu,
  Users,
  User,
  BookOpen,
  PenLine,
} from "lucide-react";
import { useWorlds } from "@/hooks/use-worlds";
import { useRecentWork } from "@/hooks/use-recent-work";
import { getToolDisplayName } from "@/lib/worksheet-links-config";
import { TOOL_ROUTES } from "@/lib/tools-config";
import { shapePaletteGroups, type PaletteItem } from "@/lib/command-palette";

// Tool icon mapping. Deliberately partial — TOOL_ROUTES below is the full
// catalog (shared with the header nav and landing showcase), and any tool
// without an entry here falls back to the generic Wrench/FileText icons
// where it's rendered. A tool missing from THIS map only loses its custom
// glyph; a tool missing from TOOL_ROUTES used to mean it couldn't be found
// or opened from search at all — that was the actual bug (roughly half the
// catalog, including every simulator, was unreachable from ⌘K).
const TOOL_ICONS: Record<string, React.ElementType> = {
  "planetary-profile": Globe,
  "evolutionary-biology": Dna,
  "xenomythology-framework-builder": Sparkles,
  "environmental-chain-reaction": GitBranch,
  "spacecraft-designer": Rocket,
  "propulsion-consequences-map": Zap,
  "drake-equation-calculator": Calculator,
  "star-system-builder": Sun,
  "empire-designer": Crown,
  "technology-consequences": Cpu,
  "species-interaction-matrix": Users,
};

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
                icon={(item.toolType && TOOL_ICONS[item.toolType]) || FileText}
                onSelect={go}
              />
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Tools */}
        <CommandGroup heading="Tools">
          {Object.entries(TOOL_ROUTES).map(([toolType, route]) => {
            const Icon = TOOL_ICONS[toolType] || Wrench;
            return (
              <CommandItem
                key={toolType}
                value={`tool ${getToolDisplayName(toolType)}`}
                onSelect={() => go(route)}
              >
                <Icon className="mr-2 h-4 w-4 text-sf-primary-text" aria-hidden="true" />
                <span>{getToolDisplayName(toolType)}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            value="action begin survey create new world"
            onSelect={() => {
              // Same deep link HeaderNavigation's "Create New World" uses —
              // CreateWorldButton (rendered on /worlds) opens BEGIN SURVEY
              // when it sees this param.
              go("/worlds?create=true");
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Begin Survey</span>
          </CommandItem>
          <CommandItem value="action all tools catalog" onSelect={() => go("/tools")}>
            <Wrench className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>All Tools</span>
          </CommandItem>
          <CommandItem value="action open profile" onSelect={() => go("/profile")}>
            <User className="mr-2 h-4 w-4" aria-hidden="true" />
            <span>Open Profile</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
