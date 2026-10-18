// ---------------------------------------------------------------------------
// export, one entry point from a compiled manuscript to a downloaded file.
// Every heavy library (docx, jszip, @react-pdf/renderer) loads here, at the
// moment of export, never with the page.
// ---------------------------------------------------------------------------

import { createElement } from "react";
import type { CompileFormat, Manuscript } from "./compile";
import { slugify } from "./compile";
import { manuscriptToMarkdown, manuscriptToText } from "./text-formats";

export const FORMAT_LABELS: Record<CompileFormat, { label: string; ext: string }> = {
  docx: { label: "Word", ext: "docx" },
  pdf: { label: "PDF", ext: "pdf" },
  epub: { label: "EPUB", ext: "epub" },
  md: { label: "Markdown", ext: "md" },
  txt: { label: "Plain text", ext: "txt" },
};

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export async function renderManuscript(m: Manuscript, format: CompileFormat): Promise<Blob> {
  switch (format) {
    case "md":
      return new Blob([manuscriptToMarkdown(m)], { type: "text/markdown;charset=utf-8" });
    case "txt":
      return new Blob([manuscriptToText(m)], { type: "text/plain;charset=utf-8" });
    case "docx": {
      const { buildManuscriptDocx } = await import("./docx");
      return buildManuscriptDocx(m);
    }
    case "epub": {
      const { buildEpub } = await import("./epub");
      const bytes = await buildEpub(m, { id: uuid() });
      return new Blob([bytes], { type: "application/epub+zip" });
    }
    case "pdf": {
      const [{ pdf }, { default: ManuscriptTemplate }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/templates/ManuscriptTemplate"),
      ]);
      const blob = await pdf(createElement(ManuscriptTemplate, { manuscript: m }) as Parameters<typeof pdf>[0]).toBlob();
      return new Blob([blob], { type: "application/pdf" });
    }
  }
}

export async function downloadManuscript(m: Manuscript, format: CompileFormat): Promise<string> {
  const blob = await renderManuscript(m, format);
  const filename = `${slugify(m.title)}.${FORMAT_LABELS[format].ext}`;
  const { saveAs } = await import("file-saver");
  saveAs(blob, filename);
  return filename;
}
