// ---------------------------------------------------------------------------
// LabelManagerDialog, edit the world's writing labels (name + colour).
//
// Colours are the eight named-hue tokens only. Removing a label leaves any
// document that used it unlabelled; nothing else changes.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  LABEL_HUES,
  LABEL_SWATCH,
  MAX_LABEL_NAME,
  MAX_LABELS,
  newLabelId,
  nextLabelHue,
  type WritingLabel,
} from "@/lib/writing-labels";

interface LabelManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: WritingLabel[];
  onSave: (labels: WritingLabel[]) => void;
  saving?: boolean;
  /** True while labels live in this browser only (migration pending). */
  local?: boolean;
}

const hueName = (h: string) => h.charAt(0).toUpperCase() + h.slice(1);

export function LabelManagerDialog({
  open,
  onOpenChange,
  labels,
  onSave,
  saving,
  local,
}: LabelManagerDialogProps): JSX.Element {
  const [draft, setDraft] = useState<WritingLabel[]>(labels);

  useEffect(() => {
    if (open) setDraft(labels);
  }, [open, labels]);

  const update = (id: string, patch: Partial<WritingLabel>) =>
    setDraft((d) => d.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const add = () =>
    setDraft((d) =>
      d.length >= MAX_LABELS ? d : [...d, { id: newLabelId(), name: "", hue: nextLabelHue(d) }],
    );

  const save = () => {
    onSave(draft.filter((l) => l.name.trim()));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <p className="font-heading text-sf-eyebrow uppercase text-t4">{"// WRITING LABELS"}</p>
          <DialogTitle className="font-heading text-sf-h3 font-normal uppercase text-t1">Labels</DialogTitle>
          <DialogDescription className="font-sans text-[14px] text-t3">
            One set per world. Give each document a label from the inspector; its colour shows in the
            binder.
            {local && " Stored in this browser until the world settings update lands."}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {draft.map((l) => (
            <li key={l.id} className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Colour for ${l.name || "new label"}: ${hueName(l.hue)}`}
                    className="flex min-h-hit w-11 shrink-0 items-center justify-center border border-sf-line-interactive hover:border-sf-line-emphasis"
                  >
                    <span className={`h-4 w-4 ${LABEL_SWATCH[l.hue]}`} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  {LABEL_HUES.map((h) => (
                    <DropdownMenuItem key={h} onClick={() => update(l.id, { hue: h })}>
                      <span className={`mr-2 h-3 w-3 ${LABEL_SWATCH[h]}`} aria-hidden="true" />
                      {hueName(h)}
                      {h === l.hue && <span className="ml-auto font-mono text-[12px] text-t4">ON</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                value={l.name}
                maxLength={MAX_LABEL_NAME}
                onChange={(e) => update(l.id, { name: e.target.value })}
                placeholder="Label name"
                aria-label="Label name"
                className="min-h-hit min-w-0 flex-1 px-3 font-sans text-[16px] text-t1"
              />
              <button
                type="button"
                onClick={() => setDraft((d) => d.filter((x) => x.id !== l.id))}
                aria-label={`Remove label ${l.name || ""}`.trim()}
                className="flex min-h-hit w-11 shrink-0 items-center justify-center text-t4 transition-colors duration-fast hover:text-sf-crimson-text"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {draft.length === 0 && (
            <li className="font-serif text-[14px] italic text-t3">
              No labels yet. Scrivener writers often start with Scene, Chapter, Idea and Notes.
            </li>
          )}
        </ul>

        <Button variant="sf-ghost" size="sf-sm" onClick={add} disabled={draft.length >= MAX_LABELS} className="justify-self-start">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add label
        </Button>

        <DialogFooter className="gap-2">
          <Button variant="sf-ghost" size="sf-sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="sf-primary" size="sf-sm" onClick={save} disabled={saving}>
            Save labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LabelManagerDialog;
