import { Link, useSearchParams } from "react-router-dom";
import { Globe, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * ToolWorldBar: the "no world open" notice for instruments that need a world
 * up front (Dossier, Surface Cartographer, Ark imports). Every notice that
 * says "open a world" must also be the place you open one (Law III: no dead
 * ends), so this one carries the control.
 *
 * Choosing a world writes `?worldId=` to the URL, which is how useWorldId()
 * resolves a world on a standalone tool route. Signed out, it offers sign in;
 * with no worlds on file, it offers to create one.
 */
interface ToolWorldBarProps {
  /** Why this instrument needs a world, in one line (Ship's Voice). */
  reason: string;
  /** Accent for the frame: a named hue key, matching the tool's accent. */
  accent?: "magenta" | "azure" | "teal" | "amber" | "emerald" | "violet" | "stellar";
  className?: string;
}

const FRAME: Record<NonNullable<ToolWorldBarProps["accent"]>, string> = {
  magenta: "border-sf-magenta bg-sf-magenta/[0.06]",
  azure: "border-sf-azure bg-sf-azure/[0.06]",
  teal: "border-sf-teal bg-sf-teal/[0.06]",
  amber: "border-sf-amber bg-sf-amber/[0.06]",
  emerald: "border-sf-emerald bg-sf-emerald/[0.06]",
  violet: "border-sf-violet bg-sf-violet/[0.06]",
  stellar: "border-sf-stellar bg-sf-stellar/[0.06]",
};

const linkClass =
  "inline-flex min-h-hit items-center gap-2 border border-sf-line-interactive px-4 font-sans text-sm font-medium uppercase text-t1 transition-colors duration-base ease-sf-out hover:border-sf-primary hover:text-sf-primary-text";

export function ToolWorldBar({ reason, accent = "teal", className }: ToolWorldBarProps): JSX.Element {
  const { user } = useAuth();
  const { worlds, isLoading } = useWorlds();
  const [searchParams, setSearchParams] = useSearchParams();

  const chooseWorld = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("worldId", id);
    setSearchParams(next);
  };

  return (
    <section
      aria-label="Choose a world"
      className={cn("mb-6 border p-4 md:p-5", FRAME[accent], className)}
    >
      <p className="font-mono text-sf-mono uppercase text-t2">// NO WORLD OPEN. {reason}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        {!user ? (
          <Link to="/auth" className={linkClass}>
            SIGN IN TO CHOOSE A WORLD
          </Link>
        ) : isLoading ? (
          <p className="font-mono text-sf-mono uppercase text-t4">// RETRIEVING WORLDS…</p>
        ) : worlds.length === 0 ? (
          <Link to="/worlds" className={linkClass}>
            <Plus className="h-4 w-4" aria-hidden />
            CREATE A WORLD
          </Link>
        ) : (
          <>
            <div className="min-w-[240px] flex-1 space-y-1.5 sm:max-w-sm">
              <Label htmlFor="tool-world-bar">World</Label>
              <Select onValueChange={chooseWorld}>
                <SelectTrigger id="tool-world-bar" className="min-h-hit">
                  <Globe className="mr-2 h-4 w-4 text-t4" aria-hidden />
                  <SelectValue placeholder="Choose a world" />
                </SelectTrigger>
                <SelectContent>
                  {worlds.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Link to="/worlds" className={linkClass}>
              <Plus className="h-4 w-4" aria-hidden />
              NEW WORLD
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

export default ToolWorldBar;
