// ---------------------------------------------------------------------------
// ProjectReplaceDialog, find and replace across the manuscript.
//
// Opened from the binder search (BinderSearch.tsx finds; this replaces).
// The writer sets the scope (every document, or one folder), sees every
// match with its context, includes or excludes each, and applies. Before
// anything changes, every affected document is filed as a named snapshot
// (BEFORE REPLACE "X" → "Y"); REVERT REPLACE puts them back.
//
// Text only: titles, cards and notes are never changed, and cited facts,
// @mentions and [[wiki links]] are never rewritten (lib/writing/project-
// replace.ts). Contents are fetched when the dialog opens, not carried in
// the binder list. Register: INSTRUMENT (mono readouts), prose in Lora.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useQueryClient } from "@tanstack/react-query";
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
import { useAuth } from "@/contexts/AuthContext";
import { buildMatcher, type SearchOptions } from "@/lib/binder-search";
import {
  matchKey,
  planProject,
  snapshotPlan,
  type DocReplacePlan,
} from "@/lib/writing/project-replace";
import {
  applyProjectReplace,
  fetchDocsForReplace,
  revertProjectReplace,
  type LoadedDoc,
  type ReplaceRecord,
  type SkippedDoc,
} from "@/hooks/use-project-replace";
import { primeDocCaches } from "@/hooks/use-doc-autosave";

export interface ReplaceScope {
  /** "all", or a folder id. */
  id: string;
  label: string;
}

interface ProjectReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worldId: string;
  /** The binder search's query and options, as the starting point. */
  query: string;
  opts: SearchOptions;
  scopes: ReplaceScope[];
  /** Document ids in reading order for a scope id. */
  docIdsFor: (scopeId: string) => string[];
  /** The live editor showing a document, if any. */
  editorFor: (docId: string) => Editor | null;
  /** Let pending saves land before reading or writing. */
  beforeApply: () => Promise<void>;
  /** The last replace, kept by the parent so REVERT outlives the dialog. */
  lastReplace: ReplaceRecord | null;
  onLastReplace: (r: ReplaceRecord | null) => void;
}

type Phase = "edit" | "loading" | "preview" | "applying" | "done";

export function ProjectReplaceDialog(props: ProjectReplaceDialogProps): JSX.Element {
  const { open, onOpenChange, worldId, scopes, docIdsFor, editorFor, beforeApply, lastReplace, onLastReplace } = props;
  const { user } = useAuth();
  const qc = useQueryClient();

  const [find, setFind] = useState(props.query);
  const [replacement, setReplacement] = useState("");
  const [opts, setOpts] = useState<SearchOptions>(props.opts);
  const [scope, setScope] = useState(scopes[0]?.id ?? "all");
  const [phase, setPhase] = useState<Phase>("edit");
  const [loaded, setLoaded] = useState<LoadedDoc[]>([]);
  const [plans, setPlans] = useState<DocReplacePlan[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());
  const [status, setStatus] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<SkippedDoc[]>([]);

  // Each opening starts from the binder search as it stands.
  useEffect(() => {
    if (!open) return;
    setFind(props.query);
    setOpts(props.opts);
    setPhase("edit");
    setPlans([]);
    setExcluded(new Set());
    setStatus(null);
    setSkipped([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const matcher = useMemo(() => (find ? buildMatcher(find, opts) : null), [find, opts]);
  const total = plans.reduce((n, p) => n + p.matches.length, 0);
  const snaps = useMemo(() => snapshotPlan(plans, excluded, find, replacement), [plans, excluded, find, replacement]);
  const included = snaps.reduce((n, s) => n + s.count, 0);

  const refresh = useCallback(
    (docs: { id: string; html: string }[]) => {
      for (const d of docs) primeDocCaches(qc, worldId, d.id, d.html, true);
      qc.invalidateQueries({ queryKey: ["writing-documents", worldId] });
      // Lazily loaded manuscript text (search, badges, compile) must see the change too.
      qc.invalidateQueries({ queryKey: ["writing-doc-contents", worldId] });
      for (const d of docs) qc.invalidateQueries({ queryKey: ["write-doc", d.id] });
    },
    [qc, worldId],
  );

  const preview = async () => {
    if (!matcher?.re) return;
    setPhase("loading");
    setStatus(null);
    try {
      await beforeApply();
      const docs = await fetchDocsForReplace(docIdsFor(scope));
      setLoaded(docs);
      setPlans(planProject(docs, matcher.re, replacement, opts.regex));
      setExcluded(new Set());
      setPhase("preview");
    } catch {
      setStatus("DOCUMENTS COULD NOT BE READ. NOTHING CHANGED.");
      setPhase("edit");
    }
  };

  const apply = async () => {
    if (!matcher?.re || !user || included === 0) return;
    setPhase("applying");
    await beforeApply();
    const out = await applyProjectReplace({
      userId: user.id,
      worldId,
      loaded,
      plans,
      excluded,
      re: matcher.re,
      find,
      replacement,
      regex: opts.regex,
      editorFor,
    });
    setSkipped(out.skipped);
    if (out.error) {
      setStatus(out.error);
      setPhase("preview");
      return;
    }
    if (out.record) {
      refresh(out.record.docs.filter((d) => !editorFor(d.docId)).map((d) => ({ id: d.docId, html: d.after })));
      onLastReplace(out.record);
      const n = out.record.docs.reduce((a, d) => a + d.count, 0);
      setStatus(
        `${n} ${n === 1 ? "MATCH" : "MATCHES"} REPLACED IN ${out.record.docs.length} ${out.record.docs.length === 1 ? "DOCUMENT" : "DOCUMENTS"}. SNAPSHOTS FILED.`,
      );
    } else {
      setStatus("NOTHING REPLACED.");
    }
    setPhase("done");
  };

  const revert = async () => {
    if (!lastReplace) return;
    setPhase("applying");
    await beforeApply();
    const out = await revertProjectReplace(lastReplace, editorFor);
    refresh(out.restored.filter((d) => !editorFor(d.docId)).map((d) => ({ id: d.docId, html: d.before })));
    setSkipped(out.skipped);
    onLastReplace(out.skipped.length ? { ...lastReplace, docs: lastReplace.docs.filter((d) => out.skipped.some((s) => s.docId === d.docId)) } : null);
    setStatus(
      `REPLACE REVERTED IN ${out.restored.length} ${out.restored.length === 1 ? "DOCUMENT" : "DOCUMENTS"}.${out.skipped.length ? ` ${out.skipped.length} LEFT AS EDITED.` : ""}`,
    );
    setPhase("done");
  };

  const toggleMatch = (key: string) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const toggleDoc = (p: DocReplacePlan, on: boolean) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      for (const m of p.matches) {
        const k = matchKey(p.docId, m.index);
        if (on) next.delete(k);
        else next.add(k);
      }
      return next;
    });

  const editing = phase === "edit" || phase === "loading";
  const busy = phase === "loading" || phase === "applying";

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <p className="font-heading text-sf-eyebrow uppercase text-t4">{"// PROJECT REPLACE"}</p>
          <DialogTitle className="font-heading text-sf-h3 font-normal text-t1">Replace across the manuscript</DialogTitle>
          <DialogDescription className="font-sans text-[14px] text-t2">
            Document text only. Titles, cards and notes are not changed; cited facts, mentions and wiki links are never
            rewritten. Every affected document is snapshotted first.
          </DialogDescription>
        </DialogHeader>

        {/* Query */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-sans text-[12px] font-medium uppercase text-t3">Find</span>
            <input
              value={find}
              onChange={(e) => {
                setFind(e.target.value);
                if (!editing) setPhase("edit");
              }}
              disabled={busy}
              className="sf-field min-h-hit px-2 font-mono text-[16px] text-t1"
              aria-label="Find"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-sans text-[12px] font-medium uppercase text-t3">Replace with</span>
            <input
              value={replacement}
              onChange={(e) => {
                setReplacement(e.target.value);
                if (!editing) setPhase("edit");
              }}
              disabled={busy}
              placeholder="(remove the match)"
              className="sf-field min-h-hit px-2 font-mono text-[16px] text-t1 placeholder:text-t3"
              aria-label="Replace with"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {(
            [
              ["caseSensitive", "Match case"],
              ["wholeWord", "Whole word"],
              ["regex", "Regular expression"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex min-h-hit items-center gap-2 font-sans text-[14px] text-t2">
              <Checkbox
                checked={!!opts[key]}
                disabled={busy}
                onCheckedChange={(v) => {
                  setOpts((o) => ({ ...o, [key]: v === true }));
                  setPhase("edit");
                }}
              />
              {label}
            </label>
          ))}
          <label className="ml-auto flex min-h-hit items-center gap-2 font-sans text-[12px] font-medium uppercase text-t3">
            Scope
            <select
              value={scope}
              disabled={busy}
              onChange={(e) => {
                setScope(e.target.value);
                setPhase("edit");
              }}
              className="sf-field min-h-hit max-w-[16rem] px-2 font-sans text-[14px] normal-case text-t1"
            >
              {scopes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {opts.regex && (
          <p className="font-mono text-[12px] text-t4">$1, $2 … and $&amp; in the replacement insert the matched groups.</p>
        )}
        {matcher?.error && find && (
          <p className="font-mono text-[12px] text-sf-crimson-text" role="alert">{`// ${matcher.error}`}</p>
        )}

        {/* Preview list */}
        {(phase === "preview" || phase === "applying") && (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <p className="font-mono text-[12px] text-t3" role="status" aria-live="polite">
              {total === 0
                ? "NO MATCHES IN DOCUMENT TEXT."
                : `${included} OF ${total} ${total === 1 ? "MATCH" : "MATCHES"} SELECTED · ${snaps.length} ${snaps.length === 1 ? "DOCUMENT" : "DOCUMENTS"} · ${snaps.length} ${snaps.length === 1 ? "SNAPSHOT" : "SNAPSHOTS"} TO FILE`}
            </p>
            <ul className="sf-sb min-h-0 flex-1 overflow-y-auto border border-sf-line bg-sf-void">
              {plans.map((p) => {
                const on = p.matches.filter((m) => !excluded.has(matchKey(p.docId, m.index))).length;
                return (
                  <li key={p.docId} className="border-b border-sf-line-hairline last:border-b-0">
                    <label className="flex min-h-hit items-center gap-2 bg-sf-surface px-3">
                      <Checkbox
                        checked={on === p.matches.length ? true : on === 0 ? false : "indeterminate"}
                        onCheckedChange={(v) => toggleDoc(p, v === true)}
                        aria-label={`Include every match in ${p.title}`}
                      />
                      <span className="min-w-0 flex-1 truncate font-serif text-[15px] text-t1">{p.title}</span>
                      <span className="shrink-0 font-mono text-[12px] text-t4">
                        {on}/{p.matches.length}
                      </span>
                    </label>
                    <ul>
                      {p.matches.map((m) => {
                        const k = matchKey(p.docId, m.index);
                        const inc = !excluded.has(k);
                        return (
                          <li key={k}>
                            <label className="flex min-h-hit cursor-pointer items-start gap-2 px-3 py-2 hover:bg-sf-surface-elevated">
                              <Checkbox className="mt-0.5" checked={inc} onCheckedChange={() => toggleMatch(k)} aria-label={`Include match ${m.index + 1} in ${p.title}`} />
                              <span className="min-w-0 flex-1 font-serif text-[14px] leading-snug text-t2">
                                {m.before}
                                {inc ? (
                                  <>
                                    <del className="bg-sf-crimson/[0.08] text-sf-crimson-text">{m.match}</del>
                                    {m.replacement && (
                                      <ins className="bg-sf-primary/[0.08] text-sf-primary-text underline underline-offset-4">{m.replacement}</ins>
                                    )}
                                  </>
                                ) : (
                                  <mark className="bg-transparent text-t1 underline decoration-dotted underline-offset-4">{m.match}</mark>
                                )}
                                {m.after}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {status && (
          <p className={`font-mono text-[12px] ${phase === "done" ? "text-sf-primary-text" : "text-sf-crimson-text"}`} role="status">
            {phase === "done" ? status : `// ${status}`}
          </p>
        )}
        {skipped.length > 0 && (
          <ul className="sf-sb max-h-32 overflow-y-auto font-mono text-[12px] text-sf-amber-text">
            {skipped.map((s) => (
              <li key={s.docId}>{`// ${s.title.toUpperCase()}: ${s.reason}`}</li>
            ))}
          </ul>
        )}

        <DialogFooter className="flex-wrap items-center gap-2">
          {lastReplace && (
            <Button
              variant="sf-ghost"
              className="mr-auto min-h-hit"
              disabled={busy}
              onClick={() => void revert()}
              title={`Restore the snapshots filed before replacing "${lastReplace.find}"`}
            >
              Revert replace
            </Button>
          )}
          <Button variant="sf-ghost" className="min-h-hit" disabled={busy} onClick={() => onOpenChange(false)}>
            {phase === "done" ? "Close" : "Cancel"}
          </Button>
          {phase !== "preview" && phase !== "applying" ? (
            <Button
              variant="sf-primary"
              className="min-h-hit"
              disabled={busy || !matcher?.re}
              onClick={() => void preview()}
            >
              {phase === "loading" ? "Reading documents" : "Preview matches"}
            </Button>
          ) : (
            <Button variant="sf-primary" className="min-h-hit" disabled={busy || included === 0} onClick={() => void apply()}>
              {phase === "applying" ? "Replacing" : `Replace ${included}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
