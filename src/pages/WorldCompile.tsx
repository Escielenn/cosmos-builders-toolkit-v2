// ---------------------------------------------------------------------------
// WorldCompile, manuscript compile + export page.
//
// Route: /worlds/:worldId/compile
// Reads the chapter tree, lets user reorder/toggle which docs are included,
// preview the stitched manuscript, and export to .docx / Markdown / text.
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronLeft,
  Download,
  Eye,
  FileText,
  Folder,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GlassPanel } from "@/components/ui/glass-panel";
import { useMetaTags } from "@/hooks/use-meta-tags";
import { useWritingDocuments, type WritingFolder } from "@/hooks/use-writing-documents";
import { useWorlds } from "@/hooks/use-worlds";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  compileManuscriptDocx,
  compileManuscriptMarkdown,
  compileManuscriptPlainText,
  type ManuscriptChapter,
  type ManuscriptMeta,
} from "@/lib/manuscript-compile";
import type { WorldEntry } from "@/services/world-data";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { useWorksheets } from "@/hooks/use-worksheets";
import { getToolDisplayName } from "@/lib/tools-config";
import { extractWorksheetFacts } from "@/lib/worksheet-facts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWords(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, " ").trim();
  if (!text) return 0;
  return text.split(/\s+/).length;
}

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorldCompile() {
  const { worldId } = useParams<{ worldId: string }>();
  const { user } = useAuth();
  const { worlds } = useWorlds();
  const { toast } = useToast();
  const { data: documents, folders, unfiledDocs, isLoading } =
    useWritingDocuments(worldId);

  useMetaTags({ title: "Compile Manuscript" });

  const currentWorld = worldId ? worlds.find((w) => w.id === worldId) : null;

  // Front matter
  const [title, setTitle] = useState(currentWorld?.name ?? "Untitled Manuscript");
  const [author, setAuthor] = useState(user?.user_metadata?.display_name ?? "");
  const [subtitle, setSubtitle] = useState("");

  // Track which docs are included
  const allDocIds = useMemo(() => {
    const ids: string[] = [];
    for (const f of folders) {
      for (const d of f.documents) ids.push(d.id);
    }
    for (const d of unfiledDocs) ids.push(d.id);
    return ids;
  }, [folders, unfiledDocs]);

  const [includedIds, setIncludedIds] = useState<Set<string>>(
    () => new Set(allDocIds)
  );

  // Sync when allDocIds changes (new docs created while page is open)
  useMemo(() => {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      for (const id of allDocIds) {
        if (!next.has(id)) next.add(id);
      }
      return next;
    });
  }, [allDocIds]);

  const toggleDoc = (id: string) => {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFolder = (folder: WritingFolder) => {
    const folderDocIds = folder.documents.map((d) => d.id);
    const allIncluded = folderDocIds.every((id) => includedIds.has(id));
    setIncludedIds((prev) => {
      const next = new Set(prev);
      for (const id of folderDocIds) {
        if (allIncluded) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setIncludedIds(new Set(allDocIds));
  const selectNone = () => setIncludedIds(new Set());

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  // World appendix, off by default so existing exports are unchanged.
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const { worksheets } = useWorksheets(worldId);
  const appendixHtml = useMemo(() => {
    const sections = (worksheets ?? [])
      .map((ws) => ({
        title: ws.title || getToolDisplayName(ws.tool_type),
        facts: extractWorksheetFacts(ws.tool_type, ws.data),
      }))
      .filter((s) => s.facts.length > 0);
    if (sections.length === 0) return "";
    // Markup, not raw newlines: the preview renders through sanitizeHtml.
    return sections
      .map(
        (s) =>
          `<h3>${s.title}</h3><ul>${s.facts
            .map((f) => `<li><strong>${f.label}:</strong> ${f.value}</li>`)
            .join("")}</ul>`,
      )
      .join("");
  }, [worksheets]);

  // Build chapter list in order: folders first (in sort_order), then unfiled
  const chapters = useMemo((): ManuscriptChapter[] => {
    const result: ManuscriptChapter[] = [];
    for (const folder of folders) {
      for (const doc of folder.documents) {
        if (!includedIds.has(doc.id)) continue;
        result.push({
          id: doc.id,
          title: doc.title || "Untitled",
          content: doc.content || "",
          folderName: folder.title,
        });
      }
    }
    for (const doc of unfiledDocs) {
      if (!includedIds.has(doc.id)) continue;
      result.push({
        id: doc.id,
        title: doc.title || "Untitled",
        content: doc.content || "",
      });
    }

    // Optional world appendix. The compile previously carried only prose, so
    // none of the worldbuilding reached the exported manuscript.
    if (includeAppendix && appendixHtml) {
      result.push({
        id: "__world-appendix",
        title: "Appendix: World Reference",
        content: appendixHtml,
      });
    }
    return result;
  }, [folders, unfiledDocs, includedIds, includeAppendix, appendixHtml]);

  const totalWords = useMemo(
    () => chapters.reduce((sum, c) => sum + countWords(c.content), 0),
    [chapters]
  );

  const meta: ManuscriptMeta = useMemo(
    () => ({
      title: title || "Untitled Manuscript",
      author: author || "Unknown Author",
      subtitle: subtitle || undefined,
    }),
    [title, author, subtitle]
  );

  // Export handlers
  const [isExporting, setIsExporting] = useState(false);

  const handleExportDocx = useCallback(async () => {
    setIsExporting(true);
    try {
      await compileManuscriptDocx(meta, chapters);
      toast({ title: "EXPORT COMPLETE.", description: "Manuscript downloaded as .docx." });
    } catch (err) {
      console.error("Docx export failed:", err);
      toast({
        title: "EXPORT FAILED.",
        description: err instanceof Error ? err.message : "Could not generate .docx.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [meta, chapters, toast]);

  const handleExportMarkdown = useCallback(() => {
    const md = compileManuscriptMarkdown(meta, chapters);
    const slug = meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    downloadText(md, `${slug || "manuscript"}.md`, "text/markdown");
    toast({ title: "EXPORT COMPLETE.", description: "Manuscript downloaded as Markdown." });
  }, [meta, chapters, toast]);

  const handleExportText = useCallback(() => {
    const txt = compileManuscriptPlainText(meta, chapters);
    const slug = meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    downloadText(txt, `${slug || "manuscript"}.txt`, "text/plain");
    toast({ title: "EXPORT COMPLETE.", description: "Manuscript downloaded as plain text." });
  }, [meta, chapters, toast]);

  if (!worldId) return null;

  return (
    <div className="min-h-screen bg-[hsl(222_30%_5%)]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/worlds/${worldId}/write`}
            className="inline-flex items-center gap-1 text-xs text-t4 hover:text-t2 mb-3"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> ← RETURN TO WRITING SPACE
          </Link>
          <h1 className="font-display text-3xl md:text-4xl tracking-[0.08em] text-t1 mb-1">
            COMPILE MANUSCRIPT
          </h1>
          <p className="text-sm text-t3 max-w-2xl">
            Stitch your chapters in order and export as a formatted manuscript.
            Toggle chapters on or off, set front matter, then download.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: chapter list + preview */}
          <div className="space-y-6">
            {/* Front matter */}
            <GlassPanel>
              <div className="p-4 space-y-3">
                <h2 className="font-heading text-sm uppercase tracking-[2px] text-[#00FF88] mb-3">
                  Front Matter
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="ms-title">Manuscript title</Label>
                    <Input
                      id="ms-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="My Novel"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ms-author">Author</Label>
                    <Input
                      id="ms-author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ms-subtitle">
                    Subtitle{" "}
                    <span className="text-t4 font-normal normal-case tracking-normal">(optional)</span>
                  </Label>
                  <Input
                    id="ms-subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="A Novel of the Deep Reaches"
                  />
                </div>

                {appendixHtml && (
                  <label className="mt-2 flex cursor-pointer items-start gap-2.5 border-t border-sf-border pt-3">
                    <Checkbox
                      checked={includeAppendix}
                      onCheckedChange={(v) => setIncludeAppendix(v === true)}
                      aria-label="Append a world reference chapter"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm text-t2">
                        Append world reference
                      </span>
                      <span className="block text-xs text-t3">
                        Adds a final chapter listing the values recorded in this
                        world's tools.
                      </span>
                    </span>
                  </label>
                )}
              </div>
            </GlassPanel>

            {/* Chapter selection */}
            <GlassPanel>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading text-sm uppercase tracking-[2px] text-[#00FF88]">
                    Chapters
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                      All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={selectNone} className="text-xs h-7">
                      None
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="text-xs text-t5 py-4 text-center">Loading documents...</div>
                ) : (
                  <div className="space-y-1">
                    {folders.map((folder) => {
                      const folderDocIds = folder.documents.map((d) => d.id);
                      const allIn = folderDocIds.length > 0 && folderDocIds.every((id) => includedIds.has(id));
                      const someIn = folderDocIds.some((id) => includedIds.has(id));

                      return (
                        <div key={folder.id}>
                          <button
                            type="button"
                            onClick={() => toggleFolder(folder)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-white/[0.03] transition-colors"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              {allIn ? (
                                <Check className="w-3.5 h-3.5 text-primary" />
                              ) : someIn ? (
                                <Minus className="w-3.5 h-3.5 text-t3" />
                              ) : (
                                <div className="w-3 h-3 border border-white/20" />
                              )}
                            </div>
                            <Folder className="w-3.5 h-3.5 text-[#FFB347]" />
                            <span className="text-xs font-medium text-t2 flex-1 text-left">
                              {folder.title}
                            </span>
                            <span className="text-[12px] font-mono text-t5">
                              {folderDocIds.filter((id) => includedIds.has(id)).length}/{folderDocIds.length}
                            </span>
                          </button>
                          <div className="pl-8 space-y-0.5">
                            {folder.documents.map((doc) => (
                              <DocToggleRow
                                key={doc.id}
                                doc={doc}
                                included={includedIds.has(doc.id)}
                                onToggle={() => toggleDoc(doc.id)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {unfiledDocs.length > 0 && (
                      <>
                        {folders.length > 0 && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-[12px] uppercase tracking-[1.5px] text-t5 font-heading px-2">
                              Unfiled
                            </span>
                          </div>
                        )}
                        {unfiledDocs.map((doc) => (
                          <DocToggleRow
                            key={doc.id}
                            doc={doc}
                            included={includedIds.has(doc.id)}
                            onToggle={() => toggleDoc(doc.id)}
                          />
                        ))}
                      </>
                    )}

                    {(documents?.length ?? 0) === 0 && (
                      <div className="text-xs text-t4 text-center py-6">
                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No documents in this world yet.
                        <br />
                        <Link
                          to={`/worlds/${worldId}/write`}
                          className="text-primary hover:underline"
                        >
                          Start writing
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassPanel>

            {/* Preview toggle */}
            {chapters.length > 0 && (
              <GlassPanel>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-heading text-sm uppercase tracking-[2px] text-[#00FF88]">
                      Preview
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview((p) => !p)}
                      className="text-xs h-7"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      {showPreview ? "Hide" : "Show"} preview
                    </Button>
                  </div>

                  {showPreview && (
                    <div className="max-h-[60vh] overflow-y-auto border border-white/5 bg-white/[0.02] p-6 space-y-6">
                      <div className="text-center pb-6 border-b border-white/5">
                        <h3 className="font-heading text-xl tracking-wider text-t1">
                          {meta.title}
                        </h3>
                        {meta.subtitle && (
                          <p className="text-sm text-t3 italic mt-1">{meta.subtitle}</p>
                        )}
                        <p className="text-xs text-t4 mt-2">by {meta.author}</p>
                      </div>
                      {chapters.map((ch, i) => (
                        <div key={ch.id}>
                          <h4 className="font-heading text-base tracking-wider text-t2 mb-3">
                            {ch.title}
                          </h4>
                          <div
                            className="prose prose-invert prose-sm max-w-none text-t2 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(ch.content) }}
                          />
                          {i < chapters.length - 1 && (
                            <div className="mt-6 border-t border-dashed border-white/10" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </GlassPanel>
            )}
          </div>

          {/* Right sidebar: stats + export */}
          <div className="space-y-4">
            <GlassPanel>
              <div className="p-4 space-y-3">
                <h2 className="font-heading text-sm uppercase tracking-[2px] text-[#00FF88]">
                  Manuscript Stats
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-t3">Chapters included</span>
                    <span className="font-mono text-t1">{chapters.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-t3">Total words</span>
                    <span className="font-mono text-t1">{totalWords.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-t3">Est. pages (250 w/p)</span>
                    <span className="font-mono text-t1">
                      {Math.ceil(totalWords / 250)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-t3">Reading time</span>
                    <span className="font-mono text-t1">
                      {Math.ceil(totalWords / 250)} min
                    </span>
                  </div>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel>
              <div className="p-4 space-y-3">
                <h2 className="font-heading text-sm uppercase tracking-[2px] text-[#00FF88]">
                  Export
                </h2>

                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    onClick={handleExportDocx}
                    disabled={chapters.length === 0 || isExporting}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download .docx
                    <span className="ml-auto text-[12px] opacity-60">Standard manuscript</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExportMarkdown}
                    disabled={chapters.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Markdown
                    <span className="ml-auto text-[12px] opacity-60">.md</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExportText}
                    disabled={chapters.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download plain text
                    <span className="ml-auto text-[12px] opacity-60">.txt / Scrivener</span>
                  </Button>
                </div>

                {chapters.length === 0 && (
                  <p className="text-[12px] text-t4 text-center py-2">
                    Select at least one chapter to export.
                  </p>
                )}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DocToggleRow, checkbox + title + word count for a single doc
// ---------------------------------------------------------------------------

function DocToggleRow({
  doc,
  included,
  onToggle,
}: {
  doc: WorldEntry;
  included: boolean;
  onToggle: () => void;
}) {
  const words = countWords(doc.content);
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1 transition-colors",
        included ? "hover:bg-white/[0.03]" : "opacity-50 hover:opacity-70"
      )}
    >
      <Checkbox checked={included} className="pointer-events-none" aria-label={`Include ${doc.title}`} />
      <FileText className={cn("w-3 h-3 shrink-0", included ? "text-t3" : "text-t5")} />
      <span className={cn("text-xs flex-1 text-left truncate", included ? "text-t2" : "text-t4")}>
        {doc.title || "Untitled"}
      </span>
      {words > 0 && (
        <span className="text-[12px] font-mono text-t5 shrink-0">
          {words < 1000 ? words : `${Math.round(words / 100) / 10}k`}
        </span>
      )}
    </button>
  );
}
