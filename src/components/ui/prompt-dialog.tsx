import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * PromptDialog, themed replacement for `window.prompt()`.
 *
 * April 2026 handoff disallows native browser dialogs (they don't match the
 * bridge aesthetic and can't be styled). Use this for one-field text input
 * like rename / create-folder / tag-new-name.
 *
 * Imperative helper available via `usePrompt()` below, or render the component
 * directly with controlled `open` + `onOpenChange` props.
 *
 * Usage (imperative):
 *   const ask = usePrompt();
 *   const name = await ask({ title: "NEW FOLDER", label: "Folder name" });
 *   if (name) createFolder(name);
 */

export interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Uppercase dialog title (Ship's Voice expected). */
  title: string;
  /** Optional sub-line shown beneath the title. */
  description?: string;
  /** Label for the input field. */
  label?: string;
  /** Placeholder shown inside the input. */
  placeholder?: string;
  /** Initial value for the input. */
  defaultValue?: string;
  /** Button label for the confirm action (default: "CONFIRM"). */
  confirmLabel?: string;
  /** Button label for cancel (default: "CANCEL"). */
  cancelLabel?: string;
  /** Called with the entered value when user confirms. */
  onSubmit: (value: string) => void;
}

export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  label = "Value",
  placeholder,
  defaultValue = "",
  confirmLabel = "CONFIRM",
  cancelLabel = "CANCEL",
  onSubmit,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset value when dialog re-opens
  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      // Focus the input shortly after Dialog's open animation kicks in
      const t = setTimeout(() => inputRef.current?.select(), 50);
      return () => clearTimeout(t);
    }
  }, [open, defaultValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="font-mono text-[11px] tracking-[0.18em] text-sf-teal uppercase">
            // INPUT REQUIRED
          </p>
          <DialogTitle className="font-display text-xl font-light tracking-sf-title uppercase text-t1">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="font-mono text-[11px] tracking-[0.18em] uppercase text-t3">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="prompt-dialog-input">{label}</Label>
            <Input
              ref={inputRef}
              id="prompt-dialog-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="sf-ghost"
              size="sf-sm"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              variant="sf-primary"
              size="sf-sm"
              disabled={!value.trim()}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
