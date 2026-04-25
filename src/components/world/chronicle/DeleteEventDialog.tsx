import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventTitle: string;
  onConfirm: () => void;
}

export function DeleteEventDialog({
  open,
  onOpenChange,
  eventTitle,
  onConfirm,
}: DeleteEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-[#0C1019] border-sf-border rounded-none">
        <DialogHeader>
          <DialogTitle className="sf-tool-section text-left">
            Confirm Removal
          </DialogTitle>
        </DialogHeader>

        <p className="font-mono text-xs uppercase tracking-wider text-t3/50 mt-2">
          Remove{" "}
          <span className="text-t2">{eventTitle}</span>{" "}
          from Chronicle
        </p>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="sf-fill-sweep sf-fill-sweep--secondary px-4 py-1.5 border border-sf-border text-[10px] uppercase tracking-wider text-t3/50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="sf-fill-sweep px-4 py-1.5 border border-destructive/30 text-sf-crimson text-[10px] uppercase tracking-wider"
          >
            Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
