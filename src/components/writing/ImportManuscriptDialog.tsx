// ---------------------------------------------------------------------------
// ImportManuscriptDialog, bring a book in progress into this world.
//
// Pick (files, a .zip, or a .scriv folder) → read → preview with counts →
// confirm → write → result. Nothing is written before IMPORT is pressed,
// and the import only ever adds (useManuscriptImport).
//
// Formats: Markdown, plain text, Word (.docx), RTF, a .zip of any of them,
// and Scrivener projects (a .scriv folder, or a .zip of one).
//
// Absorbs (Law VII) nothing: there was no import path at all. Opened from
// the binder's IMPORT action, the Studio's empty state and ?import=1 on /write.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Folder, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useWritingDocuments } from "@/hooks/use-writing-documents";
import { useWritingLabels } from "@/hooks/use-writing-labels";
import { ImportHaltedError, useManuscriptImport, type ImportOutcome } from "@/hooks/use-manuscript-import";
import { buildImport, importResultLine, type ImportNode, type ImportPreview } from "@/lib/manuscript-import";
import { countWords } from "@/lib/text";
import { mapError } from "@/lib/ship-voice";
import { ENTITY_TYPE_LABELS } from "@/services/world-data";

type Step =
  | { kind: "pick" }
  | { kind: "reading"; done: number; total: number }
  | { kind: "preview"; preview: ImportPreview }
  | { kind: "writing" }
  | { kind: "done"; outcome: ImportOutcome }
  | { kind: "error"; message: string };

const ACCEPT = ".md,.markdown,.txt,.docx,.rtf,.zip,text/markdown,text/plain,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PREVIEW_ROWS = 400;

interface ImportManuscriptDialogProps {
  worldId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the first imported document, to open it. */
  onOpenDocument?: (docId: string) => void;
}

function countExcluded(nodes: ImportNode[]): number {
  return nodes.reduce((n, x) => n + (x.includeInCompile === false ? 1 : 0) + countExcluded(x.children), 0);
}

function flatten(nodes: ImportNode[], depth = 0, out: { node: ImportNode; depth: number }[] = []) {
  for (const n of nodes) {
    if (out.length > PREVIEW_ROWS) break;
    out.push({ node: n, depth });
    flatten(n.children, depth + 1, out);
  }
  return out;
}

export function ImportManuscriptDialog({ worldId, open, onOpenChange, onOpenDocument }: ImportManuscriptDialogProps): JSX.Element {
  const { toast } = useToast();
  const { entries } = useWritingDocuments(worldId);
  const { labels } = useWritingLabels(worldId);
  const importer = useManuscriptImport(worldId);
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [files, setFiles] = useState<File[]>([]);
  const [split, setSplit] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirInput = useRef<HTMLInputElement>(null);
  const [dirSupported, setDirSupported] = useState(false);

  useEffect(() => {
    setDirSupported(typeof document !== "undefined" && "webkitdirectory" in document.createElement("input"));
  }, []);

  // Fresh state each time the dialog opens.
  useEffect(() => {
    if (open) {
      setStep({ kind: "pick" });
      setFiles([]);
      importer.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // `webkitdirectory` is not in React's input attribute types.
  useEffect(() => {
    dirInput.current?.setAttribute("webkitdirectory", "");
    dirInput.current?.setAttribute("directory", "");
  });

  const read = async (picked: File[], splitHeadings: boolean) => {
    if (!picked.length) return;
    setFiles(picked);
    setStep({ kind: "reading", done: 0, total: 0 });
    try {
      const preview = await buildImport(picked, { splitHeadings }, labels, (done, total) =>
        setStep({ kind: "reading", done, total }),
      );
      if (preview.counts.documents === 0 && preview.counts.folders === 0) {
        setStep({ kind: "error", message: "NO READABLE TEXT FOUND. USE .MD, .TXT, .DOCX, .RTF, .ZIP OR A .SCRIV PROJECT." });
        return;
      }
      setStep({ kind: "preview", preview });
    } catch (e) {
      console.error("Import read failed:", e);
      setStep({ kind: "error", message: "FILE UNREADABLE. CHECK THE FORMAT AND RETRY." });
    }
  };

  const confirm = async (preview: ImportPreview) => {
    setStep({ kind: "writing" });
    try {
      const outcome = await importer.run(preview, entries);
      setStep({ kind: "done", outcome });
      toast({ title: importResultLine(outcome) });
    } catch (e) {
      const message = e instanceof ImportHaltedError ? `${e.message} ${mapError(e.cause)}` : mapError(e);
      setStep({ kind: "error", message });
    }
  };

  const busy = step.kind === "reading" || step.kind === "writing";
  const rows = useMemo(() => (step.kind === "preview" ? flatten(step.preview.nodes) : []), [step]);

  return (
    <Dialog open={open} onOpenChange={(o) => (!busy ? onOpenChange(o) : undefined)}>
      <DialogContent className="max-w-xl" onInteractOutside={(e) => busy && e.preventDefault()}>
        <DialogHeader>
          <p className="font-heading text-sf-eyebrow uppercase text-t4">{"// IMPORT"}</p>
          <DialogTitle>Bring a manuscript</DialogTitle>
          <DialogDescription className="font-sans text-[14px] text-t3">
            Adds to this world. Nothing already here is changed or replaced.
          </DialogDescription>
        </DialogHeader>

        {step.kind === "pick" && (
          <div className="flex flex-col gap-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                void read(Array.from(e.dataTransfer.files), split);
              }}
              className={`flex flex-col items-center gap-3 border px-4 py-6 text-center transition-colors duration-fast ${
                dragOver ? "border-sf-primary bg-sf-surface-elevated" : "border-sf-line-interactive"
              }`}
            >
              <Upload className="h-6 w-6 text-t3" aria-hidden="true" />
              <p className="font-sans text-[14px] text-t2">Drop files here, or choose them.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="sf-primary" size="sf-sm" onClick={() => fileInput.current?.click()}>
                  Choose files
                </Button>
                {dirSupported && (
                  <Button variant="sf-ghost" size="sf-sm" onClick={() => dirInput.current?.click()}>
                    Choose a .scriv folder
                  </Button>
                )}
              </div>
              <p className="font-mono text-[12px] text-t4">.md · .txt · .docx · .rtf · .zip · .scriv</p>
            </div>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ACCEPT}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                void read(Array.from(e.target.files ?? []), split);
                e.target.value = "";
              }}
            />
            <input
              ref={dirInput}
              type="file"
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                void read(Array.from(e.target.files ?? []), split);
                e.target.value = "";
              }}
            />
            <label className="flex min-h-hit cursor-pointer items-start gap-3">
              <Checkbox checked={split} onCheckedChange={(v) => setSplit(v === true)} className="mt-1" aria-label="Split at headings" />
              <span>
                <span className="block font-sans text-[14px] text-t2">Split at headings</span>
                <span className="block font-sans text-[13px] text-t3">
                  Markdown and Word files: each Heading 1 becomes a folder and each Heading 2 a document.
                </span>
              </span>
            </label>
            <p className="font-sans text-[13px] text-t3">
              Scrivener: browsers cannot open a .scriv bundle as one file. Choose the .scriv folder, or zip it
              first. The Draft keeps its folders and order; labels, status, synopsis, notes and keywords come
              with it.
            </p>
          </div>
        )}

        {step.kind === "reading" && (
          <div className="flex flex-col gap-3 py-4" role="status" aria-live="polite">
            <p className="font-heading text-sf-eyebrow uppercase text-t3">Reading manuscript</p>
            <Progress value={step.total ? (step.done / step.total) * 100 : 5} aria-label="Reading progress" />
            <p className="font-mono text-[12px] text-t4">
              {step.total ? `${step.done} / ${step.total}` : "OPENING"}
            </p>
          </div>
        )}

        {step.kind === "preview" && (
          <PreviewBody
            preview={step.preview}
            rows={rows}
            split={split}
            onSplit={(v) => {
              setSplit(v);
              void read(files, v);
            }}
          />
        )}

        {step.kind === "writing" && (
          <div className="flex flex-col gap-3 py-4" role="status" aria-live="polite">
            <p className="font-heading text-sf-eyebrow uppercase text-t3">Writing to the binder</p>
            <Progress
              value={importer.progress?.total ? (importer.progress.written / importer.progress.total) * 100 : 2}
              aria-label="Import progress"
            />
            <p className="font-mono text-[12px] text-t4">
              {importer.progress ? `${importer.progress.written} / ${importer.progress.total}` : "0"}
            </p>
          </div>
        )}

        {step.kind === "done" && (
          <div className="flex flex-col gap-2 py-2" role="status">
            <p className="font-mono text-[14px] text-sf-primary-text">{importResultLine(step.outcome)}</p>
            <p className="font-sans text-[14px] text-t3">
              {step.outcome.folders.toLocaleString("en-US")} folders added at the end of the binder.
            </p>
            {step.outcome.entities > 0 && (
              <p className="font-sans text-[14px] text-t3">
                {step.outcome.entities.toLocaleString("en-US")} Codex entr{step.outcome.entities === 1 ? "y" : "ies"} filed from your character and setting folders.
              </p>
            )}
          </div>
        )}

        {step.kind === "error" && (
          <p role="alert" className="border border-sf-crimson bg-sf-surface px-3 py-2 font-mono text-[12px] text-sf-crimson-text">
            {`// ${step.message}`}
          </p>
        )}

        <DialogFooter className="gap-2">
          {step.kind === "preview" && (
            <>
              <Button variant="sf-ghost" size="sf-sm" onClick={() => setStep({ kind: "pick" })}>
                Back
              </Button>
              <Button variant="sf-primary" size="sf-sm" onClick={() => void confirm(step.preview)}>
                Import {step.preview.counts.documents.toLocaleString("en-US")} documents
              </Button>
            </>
          )}
          {step.kind === "error" && (
            <Button variant="sf-ghost" size="sf-sm" onClick={() => setStep({ kind: "pick" })}>
              Start over
            </Button>
          )}
          {step.kind === "done" && (
            <>
              <Button variant="sf-ghost" size="sf-sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {step.outcome.firstDocId && onOpenDocument && (
                <Button
                  variant="sf-primary"
                  size="sf-sm"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenDocument(step.outcome.firstDocId!);
                  }}
                >
                  Open first document
                </Button>
              )}
            </>
          )}
          {step.kind === "pick" && (
            <Button variant="sf-ghost" size="sf-sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({
  preview,
  rows,
  split,
  onSplit,
}: {
  preview: ImportPreview;
  rows: { node: ImportNode; depth: number }[];
  split: boolean;
  onSplit: (v: boolean) => void;
}): JSX.Element {
  const excluded = countExcluded(preview.nodes);
  const { counts, skipped } = preview;
  const notes: string[] = [];
  if (preview.kind === "scrivener") notes.push(`Scrivener project: ${preview.sourceName}.`);
  const entities = preview.entities ?? [];
  if (entities.length) {
    const byType = new Map<string, number>();
    for (const e of entities) byType.set(e.entryType, (byType.get(e.entryType) ?? 0) + 1);
    const parts = [...byType].map(([t, n]) => `${n} ${ENTITY_TYPE_LABELS[t]?.toLowerCase() ?? t}`).join(", ");
    notes.push(`${entities.length} item${entities.length === 1 ? "" : "s"} from your other folders become Codex entries (${parts}), not manuscript documents.`);
  }
  if (preview.labelsCreated) notes.push(`${preview.labelsCreated} new label${preview.labelsCreated === 1 ? "" : "s"} added to this world.`);
  if (excluded) notes.push(`${excluded} item${excluded === 1 ? "" : "s"} marked not to compile, as in Scrivener.`);
  if (skipped.media) notes.push(`${skipped.media} media item${skipped.media === 1 ? "" : "s"} (PDF, image, web page) left behind.`);
  if (skipped.missingContent) notes.push(`${skipped.missingContent} text item${skipped.missingContent === 1 ? " has" : "s have"} no saved text and import empty.`);
  if (skipped.unsupported) notes.push(`${skipped.unsupported} file${skipped.unsupported === 1 ? "" : "s"} of other types skipped.`);
  const shown = rows.slice(0, PREVIEW_ROWS);
  const totalRows = counts.documents + counts.folders;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <dl className="grid grid-cols-3 border border-sf-line">
        {[
          ["Folders", counts.folders],
          ["Documents", counts.documents],
          ["Words", counts.words],
        ].map(([label, n]) => (
          <div key={label} className="border-r border-sf-line-hairline px-3 py-2 last:border-r-0">
            <dt className="font-heading text-sf-eyebrow uppercase text-t4">{label}</dt>
            <dd className="font-mono text-[18px] text-t1">{Number(n).toLocaleString("en-US")}</dd>
          </div>
        ))}
      </dl>

      <ul aria-label="Import preview" className="sf-sb max-h-64 overflow-y-auto border border-sf-line py-1">
        {shown.map(({ node, depth }, i) => (
          <li
            key={i}
            className="flex min-w-0 items-center gap-2 py-1 pr-3 font-serif text-[14px] text-t2"
            style={{ paddingLeft: 12 + depth * 16 }}
          >
            {node.kind === "folder" ? (
              <Folder className="h-3.5 w-3.5 shrink-0 text-t3" aria-label="Folder" />
            ) : (
              <FileText className="h-3.5 w-3.5 shrink-0 text-t4" aria-label="Document" />
            )}
            <span className="min-w-0 flex-1 truncate">{node.title}</span>
            {node.includeInCompile === false && (
              <span className="shrink-0 font-mono text-[12px] text-t4">NO COMPILE</span>
            )}
            {node.kind === "doc" && (
              <span className="shrink-0 font-mono text-[12px] text-t4">{countWords(node.html).toLocaleString("en-US")}</span>
            )}
          </li>
        ))}
        {totalRows > shown.length && (
          <li className="px-3 py-1 font-mono text-[12px] text-t4">+{(totalRows - shown.length).toLocaleString("en-US")} MORE</li>
        )}
      </ul>

      {notes.length > 0 && (
        <ul className="flex flex-col gap-1">
          {notes.map((n) => (
            <li key={n} className="font-sans text-[13px] text-t3">
              {n}
            </li>
          ))}
        </ul>
      )}

      {preview.kind === "files" && (
        <label className="flex min-h-hit cursor-pointer items-center gap-3">
          <Checkbox checked={split} onCheckedChange={(v) => onSplit(v === true)} aria-label="Split at headings" />
          <span className="font-sans text-[14px] text-t2">Split Markdown and Word files at headings</span>
        </label>
      )}
    </div>
  );
}

export default ImportManuscriptDialog;
