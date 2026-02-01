import { useState, useEffect, useCallback } from "react";
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
  Settings,
  Wrench,
} from "lucide-react";
import { useWorlds } from "@/hooks/use-worlds";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getToolDisplayName } from "@/lib/worksheet-links-config";

// Tool icon mapping
const TOOL_ICONS: Record<string, React.ElementType> = {
  "planetary-profile": Globe,
  "evolutionary-biology": Dna,
  "xenomythology-framework-builder": Sparkles,
  "environmental-chain-reaction": GitBranch,
  "spacecraft-designer": Rocket,
  "propulsion-consequences-map": Zap,
  "drake-equation-calculator": Calculator,
};

// Tool routes
const TOOL_ROUTES: Record<string, string> = {
  "planetary-profile": "/tools/planetary-profile",
  "evolutionary-biology": "/tools/evolutionary-biology",
  "xenomythology-framework-builder": "/tools/xenomythology-framework-builder",
  "environmental-chain-reaction": "/tools/environmental-chain-reaction",
  "spacecraft-designer": "/tools/spacecraft-designer",
  "propulsion-consequences-map": "/tools/propulsion-consequences-map",
  "drake-equation-calculator": "/tools/drake-equation-calculator",
};

interface Worksheet {
  id: string;
  title: string | null;
  tool_type: string;
  world_id: string;
  data: {
    speciesName?: string;
    [key: string]: unknown;
  };
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all worksheets when dialog opens
  useEffect(() => {
    if (open && user) {
      setIsLoading(true);
      supabase
        .from("worksheets")
        .select("id, title, tool_type, world_id, data")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (!error && data) {
            setWorksheets(data as Worksheet[]);
          }
          setIsLoading(false);
        });
    }
  }, [open, user]);

  const handleSelect = useCallback(
    (type: "world" | "worksheet" | "tool", id: string, extra?: string) => {
      onOpenChange(false);

      if (type === "world") {
        navigate(`/worlds/${id}`);
      } else if (type === "worksheet" && extra) {
        const route = TOOL_ROUTES[extra];
        if (route) {
          const worksheet = worksheets.find((w) => w.id === id);
          navigate(`${route}?worldId=${worksheet?.world_id}&worksheetId=${id}`);
        }
      } else if (type === "tool") {
        const route = TOOL_ROUTES[id];
        if (route) {
          navigate(route);
        }
      }
    },
    [navigate, onOpenChange, worksheets]
  );

  // Get world name for a worksheet
  const getWorldName = (worldId: string) => {
    return worlds.find((w) => w.id === worldId)?.name || "Unknown World";
  };

  // Get display name for worksheet
  const getWorksheetDisplayName = (worksheet: Worksheet) => {
    if (worksheet.data?.speciesName) {
      return worksheet.data.speciesName as string;
    }
    return worksheet.title || getToolDisplayName(worksheet.tool_type);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type to search worlds, worksheets, and tools..." autoFocus />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Loading..." : "No results found."}
        </CommandEmpty>

        {/* Worlds */}
        {worlds.length > 0 && (
          <CommandGroup heading="Worlds">
            {worlds.slice(0, 5).map((world) => (
              <CommandItem
                key={world.id}
                value={`world-${world.name}`}
                onSelect={() => handleSelect("world", world.id)}
              >
                <Globe className="mr-2 h-4 w-4 text-primary" />
                <span>{world.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Recent Worksheets */}
        {worksheets.length > 0 && (
          <CommandGroup heading="Recent Worksheets">
            {worksheets.slice(0, 8).map((worksheet) => {
              const Icon = TOOL_ICONS[worksheet.tool_type] || FileText;
              return (
                <CommandItem
                  key={worksheet.id}
                  value={`worksheet-${getWorksheetDisplayName(worksheet)}-${worksheet.tool_type}`}
                  onSelect={() =>
                    handleSelect("worksheet", worksheet.id, worksheet.tool_type)
                  }
                  className="flex items-center"
                >
                  <Icon className="mr-2 h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{getWorksheetDisplayName(worksheet)}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    {getToolDisplayName(worksheet.tool_type)}
                  </span>
                </CommandItem>
              );
            })}
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
                value={`tool-${getToolDisplayName(toolType)}`}
                onSelect={() => handleSelect("tool", toolType)}
              >
                <Icon className="mr-2 h-4 w-4 text-primary" />
                <span>{getToolDisplayName(toolType)}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem
            value="action-new-world"
            onSelect={() => {
              onOpenChange(false);
              navigate("/");
              setTimeout(() => {
                document.getElementById("worlds")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New World</span>
          </CommandItem>
          <CommandItem
            value="action-settings"
            onSelect={() => {
              onOpenChange(false);
              navigate("/profile");
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Open Profile</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
