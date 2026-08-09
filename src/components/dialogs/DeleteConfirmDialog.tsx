import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: "world" | "worksheet" | "entity" | "note" | "entry";
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const isConfirmValid = confirmText.toLowerCase() === itemName.toLowerCase();

  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
      setConfirmText("");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmText("");
    }
    onOpenChange(newOpen);
  };

  const cascadeWarnings: Record<string, string> = {
    world: "This will permanently delete this world and all its worksheets, notes, and connections.",
    worksheet: "This will permanently delete this worksheet and all its data.",
    entity: "This will permanently delete this entity and any linked data.",
    note: "This will permanently delete this note.",
    entry: "This will permanently delete this entry and any linked data.",
  };
  const cascadeWarning = cascadeWarnings[itemType] ?? "This will permanently delete this item.";

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-sf-crimson">
            <AlertTriangle className="w-5 h-5" />
            CONFIRM: Delete {itemType}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>{cascadeWarning}</p>
            <p className="font-medium text-t1">THIS CANNOT BE UNDONE.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="confirm-delete" className="text-sm text-t3">
            Type <span className="font-medium text-t1">{itemName}</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={itemName}
            className="font-mono"
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={!isConfirmValid || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "CONFIRM DELETION"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
