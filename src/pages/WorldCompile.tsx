// ---------------------------------------------------------------------------
// WorldCompile, manuscript compile + export page.
//
// Route: /worlds/:worldId/compile
//
// The writer picks what goes in (per document or folder), the order it goes
// in (drag, or Up / Down on a row's handle; reordering here reorders the binder:
// one order everywhere), how it is dressed (preset, separators, chapter headings and
// numbering, title page, back matter) and the format: Word in Standard
// Manuscript Format, PDF, EPUB, Markdown or plain text.
//
// Selection, order and settings persist per world at worlds.settings.compile
// (browser storage until that column exists). Cited facts print their stored
// value; mentions and wiki links print their display text.
//
// Absorbs (Law VII) the old one-panel compile (title/author/subtitle, a flat
// checkbox list, three download buttons).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BookOpen, Download, Eye, FileText, Folder, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackLink } from "@/components/ui/back-link";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useReorderDocuments, useWritingDocuments, type BinderDoc } from "@/hooks/use-writing-documents";
import { useWorldDocumentContents } from "@/hooks/use-document-contents";
import type { ContentRecord } from "@/lib/writing/doc-scale";
import { useWorldSetting } from "@/hooks/use-world-setting";
import { useWorlds } from "@/hooks/use-worlds";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWorksheets } from "@/hooks/use-worksheets";
import { getToolDisplayName } from "@/lib/tools-config";
import { extractWorksheetFacts } from "@/lib/worksheet-facts";
import { mapError } from "@/lib/ship-voice";
import { sanitizeHtml } from "@/lib/sanitize";
import { countWords } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { BinderNode } from "@/lib/binder-tree";
import { blocksToXhtml } from "@/lib/manuscript/blocks";
import {
  COMPILE_FORMATS,
  NUMBERINGS,
  PRESETS,
  PRESET_LABELS,
  SEPARATORS,
  applyPreset,
  approxWordsLine,
  buildManuscript,
  sanitizeCompileSettings,
  sectionHeading,
  showDocTitle,
  type CompileFormat,
  type CompileNode,
  type CompileSettings,
  type NumberingStyle,
  type SeparatorStyle,
} from "@/lib/manuscript/compile";
import { FORMAT_LABELS, downloadManuscript } from "@/lib/manuscript/export";
import { backMatterData } from "@/lib/manuscript/back-matter-data";
import { useEntities } from "@/hooks/use-entity-graph";
import { useCanonFacts } from "@/canon/hooks";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEPARATOR_LABELS: Record<SeparatorStyle, string> = {
  none: "None",
  blank: "Blank line",
  hash: "#",
  stars: "* * *",
  custom: "Custom",
};

const NUMBERING_LABELS: Record<NumberingStyle, string> = {
  none: "No numbers",
  chapter: "Chapter 1",
  words: "One",
  roman: "I, II, III",
};

const FORMAT_NOTES: Record<CompileFormat, string> = {
  docx: "Word · submission ready",
  pdf: "Print and read",
  epub: "E-readers",
  md: "Markdown",
  txt: "Plain text",
};

/** Formatting keys: changing one by hand makes the preset Custom. */
type FormatKey = "format" | "separator" | "customSeparator" | "folderHeadings" | "numbering" | "folderTitles" | "docTitles" | "titlePage" | "font" | "doubleSpaced";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** The binder list carries no text: each document's comes from `text`. */
function toCompileNodes(nodes: BinderNode<BinderDoc>[], text: ContentRecord | undefined): CompileNode[] {
  return nodes.map((n) => ({
    id: n.entry.id,
    title: n.entry.title || (n.isFolder ? "Untitled folder" : "Untitled"),
    isFolder: n.isFolder,
    html: n.isFolder ? "" : text?.[n.entry.id]?.content ?? "",
    children: toCompileNodes(n.children, text),
  }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorldCompile() {
  const { worldId } = useParams<{ worldId: string }>();
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const { toast } = useToast();
  const { data: documents, tree, isLoading: listLoading } = useWritingDocuments(worldId);
  // Compile reads every document's text: loaded here, where it is used.
  const contents = useWorldDocumentContents(worldId, { enabled: true });
  const isLoading = listLoading || contents.isLoading;
  const stored = useWorldSetting(worldId, "compile", sanitizeCompileSettings, "COMPILE SETTINGS NOT SAVED.");

  useMetaTags({ title: "Compile Manuscript" });

  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;
  const fallbackTitle = currentWorld?.name ?? "Untitled Manuscript";
  const fallbackAuthor = (user?.user_metadata?.display_name as string | undefined) ?? "";

  // Local draft, seeded once from storage, saved back after a pause.
  const [draft, setDraft] = useState<CompileSettings | null>(null);
  useEffect(() => {
    if (!draft && !stored.isLoading) setDraft(stored.value);
  }, [draft, stored.isLoading, stored.value]);
  const dirty = useRef(false);
  const saveRef = useRef(stored.save);
  saveRef.current = stored.save;
  useEffect(() => {
    if (!draft || !dirty.current) return;
    const t = setTimeout(() => {
      dirty.current = false;
      saveRef.current(draft);
    }, 800);
    return () => clearTimeout(t);
  }, [draft]);

  const s = draft ?? stored.value;
  const update = useCallback((patch: Partial<CompileSettings>) => {
    dirty.current = true;
    setDraft((d) => ({ ...(d ?? sanitizeCompileSettings({})), ...patch }));
  }, []);
  const updateFormat = useCallback(
    <K extends FormatKey>(key: K, value: CompileSettings[K]) => update({ [key]: value, preset: "custom" } as Partial<CompileSettings>),
    [update],
  );

  // Binder → compile tree. Compile follows the binder's order (decision
  // 2026-10-17: one order, not two); reordering here moves the binder.
  // Any compile-only order saved by 0.7456 is ignored.
  const compileTree = useMemo(() => toCompileNodes(tree ?? [], contents.data), [tree, contents.data]);
  const orderedTree = compileTree;
  const buildSettings = useMemo(() => ({ ...s, order: {} }), [s]);
  const excluded = useMemo(() => new Set(s.excluded), [s.excluded]);

  // World appendix (off by default).
  const { worksheets } = useWorksheets(worldId);
  const appendixHtml = useMemo(() => {
    const sections = (worksheets ?? [])
      .map((ws) => ({
        title: ws.title || getToolDisplayName(ws.tool_type),
        facts: extractWorksheetFacts(ws.tool_type, ws.data),
      }))
      .filter((sec) => sec.facts.length > 0);
    return sections
      .map(
        (sec) =>
          `<h3>${escapeHtml(sec.title)}</h3><ul>${sec.facts
            .map((f) => `<li><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(String(f.value))}</li>`)
            .join("")}</ul>`,
      )
      .join("");
  }, [worksheets]);

  // Generated back matter (Studio Charter 2.7): Codex entries for the
  // glossary and dramatis personae, canon facts for the series bible.
  // Read only when one of them is on.
  const wantsCodex = s.includeGlossary || s.includeDramatis;
  const { data: entities } = useEntities(wantsCodex || s.includeSeriesBible ? worldId : undefined);
  const { data: canonFacts } = useCanonFacts(s.includeSeriesBible ? worldId : undefined);
  const backMatter = useMemo(
    () => backMatterData(entities ?? [], canonFacts ?? []),
    [entities, canonFacts],
  );

  const manuscript = useMemo(
    () => buildManuscript(compileTree, buildSettings, { appendixHtml, fallbackTitle, fallbackAuthor, backMatter }),
    [compileTree, buildSettings, appendixHtml, fallbackTitle, fallbackAuthor, backMatter],
  );
  const docCount = manuscript.sections.reduce((n, sec) => n + sec.docs.length, 0);

  // Selection
  const toggle = (id: string) => {
    const next = new Set(excluded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update({ excluded: Array.from(next) });
  };
  const allIds = useMemo(() => {
    const out: string[] = [];
    const walk = (list: CompileNode[]) => list.forEach((n) => (out.push(n.id), walk(n.children)));
    walk(compileTree);
    return out;
  }, [compileTree]);

  // Reorder: moves the binder (siblings keep their parent; only order changes).
  const [announce, setAnnounce] = useState("");
  const reorderDocs = useReorderDocuments(worldId);
  const reorder = (_parentKey: string, ids: string[], label: string, index: number) => {
    reorderDocs.mutate(ids);
    setAnnounce(`${label} MOVED IN THE BINDER. POSITION ${index + 1} OF ${ids.length}.`);
  };

  // Preview
  const [showPreview, setShowPreview] = useState(false);

  // Export
  const [isExporting, setIsExporting] = useState(false);
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const filename = await downloadManuscript(manuscript, s.format);
      toast({
        title: "MANUSCRIPT COMPILED.",
        description: `${filename} · ${docCount} documents · ${manuscript.words.toLocaleString("en-US")} words.`,
      });
    } catch (err) {
      console.error("Compile failed:", err);
      toast({ title: "COMPILE FAILED.", description: mapError(err), variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [manuscript, s.format, docCount, toast]);

  if (!worldId) return null;

  const fontApplies = s.format === "docx" || s.format === "pdf";

  return (
    <div className="min-h-screen bg-sf-void">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <BackLink to={`/worlds/${worldId}/write`} label="RETURN TO MANUSCRIPT" className="mb-3" />
          <h1 className="mb-1 font-display text-sf-h1 tracking-title text-t1">COMPILE MANUSCRIPT</h1>
          <p className="sf-measure text-sf-body text-t2">
            Choose what goes in and in what order, dress it for where it is going, and download. The binder
            is never rearranged by anything here.
          </p>
          {stored.isLocal && (
            <p className="mt-2 font-mono text-[12px] text-t4">SETTINGS HELD IN THIS BROWSER UNTIL THE WORLD SETTINGS UPDATE LANDS.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left: front matter, contents, back matter, preview */}
          <div className="min-w-0 space-y-6">
            <GlassPanel>
              <div className="space-y-3 p-4">
                <PanelHeading>Front matter</PanelHeading>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field id="ms-title" label="Title">
                    <Input id="ms-title" value={s.title} onChange={(e) => update({ title: e.target.value })} placeholder={fallbackTitle} />
                  </Field>
                  <Field id="ms-author" label="Author">
                    <Input id="ms-author" value={s.author} onChange={(e) => update({ author: e.target.value })} placeholder={fallbackAuthor || "Your name"} />
                  </Field>
                </div>
                <Field id="ms-subtitle" label="Subtitle (optional)">
                  <Input id="ms-subtitle" value={s.subtitle} onChange={(e) => update({ subtitle: e.target.value })} placeholder="A Novel of the Deep Reaches" />
                </Field>
                <Toggle checked={s.titlePage} onChange={(v) => updateFormat("titlePage", v)} label="Title page">
                  Contact block top left, {approxWordsLine(manuscript.words)} top right, title and byline centred.
                </Toggle>
                {s.titlePage && (
                  <Field id="ms-contact" label="Contact block">
                    <Textarea
                      id="ms-contact"
                      value={s.contact}
                      onChange={(e) => update({ contact: e.target.value })}
                      rows={3}
                      placeholder={"Street address\nCity, State ZIP\nemail@example.com"}
                      className="sf-sb text-[16px]"
                    />
                  </Field>
                )}
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <PanelHeading>Contents</PanelHeading>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" className="min-h-hit text-xs" onClick={() => update({ excluded: [] })}>
                      Include all
                    </Button>
                    <Button variant="ghost" size="sm" className="min-h-hit text-xs" onClick={() => update({ excluded: allIds })}>
                      Exclude all
                    </Button>
                  </div>
                </div>
                <p className="mb-3 text-sm text-t3">
                  Drag a row by its handle, or focus the handle and press Up or Down. Unchecked items and
                  everything inside an unchecked folder stay out.
                </p>
                <div aria-live="polite" className="sr-only">
                  {announce}
                </div>

                {isLoading ? (
                  <div className="py-4 text-center text-xs text-t4">LOADING DOCUMENTS.</div>
                ) : (documents?.length ?? 0) === 0 ? (
                  <div className="py-6 text-center text-sm text-t3">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-t4" aria-hidden="true" />
                    No documents in this world yet.{" "}
                    <Link to={`/worlds/${worldId}/write`} className="text-sf-primary-text hover:underline">
                      Start writing
                    </Link>
                  </div>
                ) : (
                  <CompileBranch
                    nodes={orderedTree}
                    parentKey="root"
                    depth={0}
                    excluded={excluded}
                    ancestorExcluded={false}
                    onToggle={toggle}
                    onReorder={reorder}
                  />
                )}
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="space-y-3 p-4">
                <PanelHeading>Back matter</PanelHeading>
                <Toggle checked={s.includeAbout} onChange={(v) => update({ includeAbout: v })} label="About the author">
                  A closing page in your own words.
                </Toggle>
                {s.includeAbout && (
                  <Field id="ms-about" label="About the author">
                    <Textarea
                      id="ms-about"
                      value={s.aboutAuthor}
                      onChange={(e) => update({ aboutAuthor: e.target.value })}
                      rows={4}
                      className="sf-sb text-[16px]"
                    />
                  </Field>
                )}
                {appendixHtml && (
                  <Toggle checked={s.includeAppendix} onChange={(v) => update({ includeAppendix: v })} label="World reference appendix">
                    A final section listing the values recorded in this world's tools.
                  </Toggle>
                )}
                <Toggle checked={s.includeDramatis} onChange={(v) => update({ includeDramatis: v })} label="Dramatis personae">
                  Every character the compiled text mentions, by first appearance, with role and summary.
                </Toggle>
                <Toggle checked={s.includeGlossary} onChange={(v) => update({ includeGlossary: v })} label="Glossary">
                  Every Codex entry the compiled text mentions, alphabetical, with its summary.
                </Toggle>
                <Toggle checked={s.includeSeriesBible} onChange={(v) => update({ includeSeriesBible: v })} label="Series bible appendix">
                  The world's canon facts, grouped by cascade layer. Proposed and derived values are left out.
                </Toggle>
                {(s.includeGlossary || s.includeDramatis || s.includeSeriesBible) && (
                  <p className="font-mono text-[12px] text-t3" role="status">
                    {manuscript.backMatter.length
                      ? manuscript.backMatter
                          .map((b) => `${b.title.toUpperCase()} ${b.id === "bible" ? b.blocks.filter((x) => x.type === "li").length : b.blocks.length}`)
                          .join(" · ")
                      : "NOTHING ON FILE FOR THE CHOSEN BACK MATTER."}
                  </p>
                )}
              </div>
            </GlassPanel>

            {docCount > 0 && (
              <GlassPanel>
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <PanelHeading>Preview</PanelHeading>
                    <Button variant="ghost" size="sm" onClick={() => setShowPreview((p) => !p)} className="min-h-hit text-xs">
                      <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      {showPreview ? "Hide" : "Show"} preview
                    </Button>
                  </div>
                  {showPreview && <ManuscriptPreview manuscript={manuscript} />}
                </div>
              </GlassPanel>
            )}
          </div>

          {/* Right: preset, format, formatting, stats, compile */}
          <div className="min-w-0 space-y-4">
            <GlassPanel>
              <div className="space-y-4 p-4">
                <PanelHeading>Preset</PanelHeading>
                <div role="radiogroup" aria-label="Preset" className="grid gap-2">
                  {PRESETS.filter((p) => p !== "custom").map((p) => (
                    <ChoiceButton key={p} checked={s.preset === p} onClick={() => update(applyPreset(s, p))}>
                      {PRESET_LABELS[p]}
                    </ChoiceButton>
                  ))}
                  {s.preset === "custom" && (
                    <p className="px-1 font-mono text-[12px] text-t4">CUSTOM SETTINGS IN USE.</p>
                  )}
                </div>

                <PanelHeading>Format</PanelHeading>
                <div role="radiogroup" aria-label="Format" className="grid gap-2">
                  {COMPILE_FORMATS.map((f) => (
                    <ChoiceButton key={f} checked={s.format === f} onClick={() => updateFormat("format", f)}>
                      <span>{FORMAT_LABELS[f].label}</span>
                      <span className="ml-auto pl-2 font-mono text-[12px] text-t4">.{FORMAT_LABELS[f].ext}</span>
                      <span className="sr-only">, {FORMAT_NOTES[f]}</span>
                    </ChoiceButton>
                  ))}
                </div>
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="space-y-3 p-4">
                <PanelHeading>Formatting</PanelHeading>
                <Field id="ms-sep" label="Scene separator">
                  <Select value={s.separator} onValueChange={(v) => updateFormat("separator", v as SeparatorStyle)}>
                    <SelectTrigger id="ms-sep" className="min-h-hit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEPARATORS.map((sep) => (
                        <SelectItem key={sep} value={sep}>
                          {SEPARATOR_LABELS[sep]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {s.separator === "custom" && (
                  <Field id="ms-sep-custom" label="Custom separator">
                    <Input id="ms-sep-custom" value={s.customSeparator} maxLength={80} onChange={(e) => updateFormat("customSeparator", e.target.value)} placeholder="~" />
                  </Field>
                )}
                <Toggle checked={s.folderHeadings} onChange={(v) => updateFormat("folderHeadings", v)} label="Chapter headings from folders" />
                {s.folderHeadings && (
                  <>
                    <Field id="ms-num" label="Numbering">
                      <Select value={s.numbering} onValueChange={(v) => updateFormat("numbering", v as NumberingStyle)}>
                        <SelectTrigger id="ms-num" className="min-h-hit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NUMBERINGS.map((n) => (
                            <SelectItem key={n} value={n}>
                              {NUMBERING_LABELS[n]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {s.numbering !== "none" && (
                      <Toggle checked={s.folderTitles} onChange={(v) => updateFormat("folderTitles", v)} label="Folder titles after the number" />
                    )}
                  </>
                )}
                <Toggle checked={s.docTitles} onChange={(v) => updateFormat("docTitles", v)} label="Document titles as scene headings" />
                {fontApplies && (
                  <>
                    <Field id="ms-font" label="Font">
                      <Select value={s.font} onValueChange={(v) => updateFormat("font", v as CompileSettings["font"])}>
                        <SelectTrigger id="ms-font" className="min-h-hit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="times">Times New Roman</SelectItem>
                          <SelectItem value="courier">Courier</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Toggle checked={s.doubleSpaced} onChange={(v) => updateFormat("doubleSpaced", v)} label="Double spaced" />
                  </>
                )}
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="space-y-3 p-4">
                <PanelHeading>Manuscript</PanelHeading>
                <dl className="space-y-2">
                  <Stat label="Sections" value={manuscript.sections.length} />
                  <Stat label="Documents" value={docCount} />
                  <Stat label="Words" value={manuscript.words} />
                  <Stat label="Pages at 250 words" value={Math.ceil(manuscript.words / 250)} />
                </dl>
                <Button variant="sf-primary" className="w-full" onClick={handleExport} disabled={docCount === 0 || isExporting || !contents.data}>
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  {isExporting ? "Compiling" : `Compile .${FORMAT_LABELS[s.format].ext}`}
                </Button>
                {docCount === 0 && <p className="text-center text-[12px] text-t4">INCLUDE AT LEAST ONE DOCUMENT.</p>}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function PanelHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-heading text-sf-eyebrow uppercase text-t4">{children}</h2>;
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <label className="flex min-h-hit cursor-pointer items-start gap-2.5 py-1">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} aria-label={label} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-sm text-t2">{label}</span>
        {children && <span className="block text-xs text-t3">{children}</span>}
      </span>
    </label>
  );
}

function ChoiceButton({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={cn(
        "flex min-h-hit w-full items-center gap-2 border px-3 text-left font-sans text-sm transition-colors duration-fast ease-sf-out",
        checked
          ? "border-sf-primary bg-sf-primary/[0.06] text-sf-primary-text"
          : "border-sf-line text-t2 hover:border-sf-line-emphasis hover:text-t1",
      )}
    >
      <span
        aria-hidden="true"
        className={cn("h-2.5 w-2.5 shrink-0 border", checked ? "border-sf-primary bg-sf-primary" : "border-sf-line-interactive")}
      />
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-xs">
      <dt className="text-t3">{label}</dt>
      <dd className="font-mono text-t1">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contents tree: one sortable list per sibling group
// ---------------------------------------------------------------------------

interface BranchProps {
  nodes: CompileNode[];
  parentKey: string;
  depth: number;
  excluded: Set<string>;
  ancestorExcluded: boolean;
  onToggle: (id: string) => void;
  onReorder: (parentKey: string, ids: string[], label: string, index: number) => void;
}

function CompileBranch({ nodes, parentKey, depth, excluded, ancestorExcluded, onToggle, onReorder }: BranchProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = nodes.map((n) => n.id);
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = ids.indexOf(String(e.active.id));
    const to = ids.indexOf(String(e.over.id));
    if (from < 0 || to < 0) return;
    onReorder(parentKey, arrayMove(ids, from, to), nodes[from].title.toUpperCase(), to);
  };
  const move = (id: string, delta: number) => {
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    onReorder(parentKey, arrayMove(ids, from, to), nodes[from].title.toUpperCase(), to);
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="space-y-0.5" aria-label={depth === 0 ? "Manuscript contents" : undefined}>
          {nodes.map((n, i) => (
            <CompileRow
              key={n.id}
              node={n}
              depth={depth}
              position={i}
              count={nodes.length}
              excluded={excluded}
              ancestorExcluded={ancestorExcluded}
              onToggle={onToggle}
              onMove={(delta) => move(n.id, delta)}
              onReorder={onReorder}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function CompileRow({
  node,
  depth,
  position,
  count,
  excluded,
  ancestorExcluded,
  onToggle,
  onMove,
  onReorder,
}: {
  node: CompileNode;
  depth: number;
  position: number;
  count: number;
  excluded: Set<string>;
  ancestorExcluded: boolean;
  onToggle: (id: string) => void;
  onMove: (delta: number) => void;
  onReorder: BranchProps["onReorder"];
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const selfExcluded = excluded.has(node.id);
  const out = selfExcluded || ancestorExcluded;
  const words = node.isFolder ? 0 : countWords(node.html);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "relative z-10")}
    >
      <div
        className={cn(
          "flex min-h-hit items-center gap-1 border border-transparent pr-2",
          isDragging ? "border-sf-line-emphasis bg-sf-surface-elevated" : "hover:bg-sf-surface-elevated",
        )}
        style={{ paddingLeft: depth * 20 }}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          // Keyboard reorder: Up / Down (with or without Alt) on the focused handle.
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              onMove(e.key === "ArrowUp" ? -1 : 1);
              const el = e.currentTarget;
              requestAnimationFrame(() => el.focus());
            }
          }}
          aria-label={`Reorder ${node.title}, position ${position + 1} of ${count}. Press Up or Down to move.`}
          className="flex min-h-hit w-8 shrink-0 cursor-grab items-center justify-center text-t4 transition-colors duration-fast hover:text-t1 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>
        <label className="flex min-h-hit min-w-0 flex-1 cursor-pointer items-center gap-2">
          <Checkbox
            checked={!selfExcluded}
            disabled={ancestorExcluded}
            onCheckedChange={() => onToggle(node.id)}
            aria-label={`${selfExcluded ? "Include" : "Exclude"} ${node.title}`}
          />
          {node.isFolder ? (
            <Folder className={cn("h-3.5 w-3.5 shrink-0", out ? "text-sf-disabled-text" : "text-sf-amber-warm-text")} aria-hidden="true" />
          ) : (
            <FileText className={cn("h-3.5 w-3.5 shrink-0", out ? "text-sf-disabled-text" : "text-t3")} aria-hidden="true" />
          )}
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-sm",
              out ? "text-sf-disabled-text line-through" : node.isFolder ? "font-medium text-t1" : "text-t2",
            )}
          >
            {node.title}
          </span>
          {words > 0 && <span className="shrink-0 font-mono text-[12px] text-t4">{words.toLocaleString("en-US")}</span>}
          {selfExcluded && <span className="shrink-0 font-mono text-[12px] text-t4">OUT</span>}
        </label>
      </div>
      {node.isFolder && node.children.length > 0 && (
        <CompileBranch
          nodes={node.children}
          parentKey={node.id}
          depth={depth + 1}
          excluded={excluded}
          ancestorExcluded={out}
          onToggle={onToggle}
          onReorder={onReorder}
        />
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

function ManuscriptPreview({ manuscript: m }: { manuscript: ReturnType<typeof buildManuscript> }) {
  return (
    <div className="sf-sb max-h-[60vh] space-y-8 overflow-y-auto border border-sf-line bg-sf-surface p-6">
      {m.titlePage && (
        <div className="border-b border-sf-line-hairline pb-6 text-center">
          <p className="font-serif text-xl italic text-t1">{m.title}</p>
          {m.subtitle && <p className="mt-1 font-serif text-sm italic text-t2">{m.subtitle}</p>}
          {m.author && <p className="mt-2 text-sm text-t2">by {m.author}</p>}
          <p className="mt-2 font-mono text-[12px] text-t4">{approxWordsLine(m.words).toUpperCase()}</p>
        </div>
      )}
      {m.sections.map((sec) => {
        const h = sectionHeading(sec);
        return (
          <section key={sec.id} className="space-y-4">
            {h && <h3 className={cn("text-center font-serif italic text-t1", sec.kind === "part" ? "text-xl" : "text-lg")}>{h}</h3>}
            {sec.docs.map((d, i) => (
              <div key={d.id} className="space-y-3">
                {i > 0 && m.separator !== null && (
                  <p className="text-center font-serif text-t3" aria-label="Scene separator">
                    {m.separator || "\u00A0"}
                  </p>
                )}
                {showDocTitle(m, sec, d) && <h4 className="text-center font-serif italic text-t2">{d.title}</h4>}
                <div
                  className="prose prose-invert prose-sm max-w-none font-serif leading-relaxed text-t2"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(blocksToXhtml(d.blocks)) }}
                />
              </div>
            ))}
          </section>
        );
      })}
      {m.about && (
        <section className="space-y-2">
          <h3 className="text-center font-serif text-lg italic text-t1">About the Author</h3>
          <p className="whitespace-pre-line font-serif text-sm text-t2">{m.about}</p>
        </section>
      )}
      {m.appendix && (
        <section className="space-y-2">
          <h3 className="text-center font-serif text-lg italic text-t1">Appendix: World Reference</h3>
          <div className="prose prose-invert prose-sm max-w-none text-t2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(blocksToXhtml(m.appendix)) }} />
        </section>
      )}
      {m.backMatter.map((b) => (
        <section key={b.id} className="space-y-2">
          <h3 className="text-center font-serif text-lg italic text-t1">{b.title}</h3>
          <div className="prose prose-invert prose-sm max-w-none text-t2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(blocksToXhtml(b.blocks)) }} />
        </section>
      ))}
    </div>
  );
}
