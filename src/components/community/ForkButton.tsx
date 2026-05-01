// ---------------------------------------------------------------------------
// ForkButton, Fork with confirmation dialog, shows fork_count
// ---------------------------------------------------------------------------

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthContext";
import { useForkWorld } from "@/hooks/use-fork-world";

interface ForkButtonProps {
  worldId: string;
  worldName: string;
  forkCount: number;
  license: string;
  className?: string;
}

export default function ForkButton({
  worldId,
  worldName,
  forkCount,
  license,
  className,
}: ForkButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const forkWorld = useForkWorld();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isViewOnly = license === "view_only";

  const handleFork = async () => {
    setConfirmOpen(false);
    const newWorldId = await forkWorld.mutateAsync(worldId);
    if (newWorldId) {
      navigate(`/worlds/${newWorldId}`);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={!user || isViewOnly || forkWorld.isPending}
        className={`gap-1.5 text-t3 hover:text-primary ${className ?? ""}`}
        aria-label={isViewOnly ? "Forking not allowed" : "Fork this world"}
        title={isViewOnly ? "This world is view-only and cannot be forked" : undefined}
      >
        {forkWorld.isPending ? (
          <Loader variant="inline" size="sm" />
        ) : (
          <GitFork className="w-4 h-4" />
        )}
        {forkCount > 0 && (
          <span className="font-mono text-xs">{forkCount}</span>
        )}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase tracking-[2px]">
              Fork World
            </AlertDialogTitle>
            <AlertDialogDescription className="text-t2">
              This will create a copy of <strong>{worldName}</strong> in your
              worlds. The original creator will be credited and the fork count
              will increase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFork}>
              Fork World
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
