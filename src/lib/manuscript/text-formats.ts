// ---------------------------------------------------------------------------
// text-formats, a compiled manuscript as Markdown or plain text.
// Pure. Tested.
// ---------------------------------------------------------------------------

import { blocksToMarkdown, blocksToText } from "./blocks";
import { approxWordsLine, sectionHeading, showDocTitle, type Manuscript } from "./compile";

export function manuscriptToMarkdown(m: Manuscript): string {
  const out: string[] = [];
  out.push(`# ${m.title}`);
  if (m.subtitle) out.push(`*${m.subtitle}*`);
  if (m.author) out.push(`by ${m.author}`);
  if (m.titlePage) {
    if (m.contact) out.push(m.contact.split("\n").join("  \n"));
    out.push(approxWordsLine(m.words));
  }
  for (const s of m.sections) {
    out.push("---");
    const h = sectionHeading(s);
    if (h) out.push(`${s.kind === "part" ? "#" : "##"} ${h}`);
    s.docs.forEach((d, i) => {
      if (i > 0 && m.separator !== null) out.push(m.separator === "" ? "&nbsp;" : m.separator === "#" ? "\\#" : m.separator);
      if (showDocTitle(m, s, d)) out.push(`### ${d.title}`);
      const body = blocksToMarkdown(d.blocks);
      if (body) out.push(body);
    });
  }
  if (m.about) {
    out.push("---", "## About the Author", m.about);
  }
  if (m.appendix) {
    out.push("---", "## Appendix: World Reference", blocksToMarkdown(m.appendix));
  }
  for (const b of m.backMatter) {
    out.push("---", `## ${b.title}`, blocksToMarkdown(b.blocks));
  }
  return out.join("\n\n") + "\n";
}

export function manuscriptToText(m: Manuscript): string {
  const out: string[] = [];
  out.push(m.title.toUpperCase());
  if (m.subtitle) out.push(m.subtitle);
  if (m.author) out.push(`by ${m.author}`);
  if (m.titlePage) {
    if (m.contact) out.push(m.contact);
    out.push(approxWordsLine(m.words));
  }
  for (const s of m.sections) {
    out.push("");
    const h = sectionHeading(s);
    if (h) out.push(h.toUpperCase());
    s.docs.forEach((d, i) => {
      if (i > 0 && m.separator !== null) out.push(m.separator);
      if (showDocTitle(m, s, d)) out.push(d.title);
      const body = blocksToText(d.blocks);
      if (body) out.push(body);
    });
  }
  if (m.about) out.push("", "ABOUT THE AUTHOR", m.about);
  if (m.appendix) out.push("", "APPENDIX: WORLD REFERENCE", blocksToText(m.appendix));
  for (const b of m.backMatter) out.push("", b.title.toUpperCase(), blocksToText(b.blocks));
  return out.join("\n\n").replace(/\n{4,}/g, "\n\n\n") + "\n";
}
