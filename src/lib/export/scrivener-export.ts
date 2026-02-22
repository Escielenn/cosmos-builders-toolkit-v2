/**
 * Scrivener World Export
 *
 * Generates a .scriv project structure as a ZIP:
 *   MyWorld.scriv/
 *     MyWorld.scrivx              (binder XML)
 *     Files/
 *       version.txt               ("16")
 *       binder.backup             (zipped copy of .scrivx)
 *       Data/
 *         <UUID>/content.rtf      (one per text document)
 *
 * Each ExportSection becomes a folder in the Draft (Manuscript).
 * Each ExportSubsection becomes a text document with infobox, prose,
 * connections, and timeline events rendered as RTF.
 * Chronicle events go into a Research/Chronicle folder.
 */

import type { ExportSection, ExportSubsection } from "@/services/worldExportFormatter";

// ──────────────────────────────────────────────
// UUID generator (v4-style, uppercase)
// ──────────────────────────────────────────────

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
    .toUpperCase();
}

// ──────────────────────────────────────────────
// RTF helpers
// ──────────────────────────────────────────────

function escapeRtf(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (ch === "\\") out += "\\\\";
    else if (ch === "{") out += "\\{";
    else if (ch === "}") out += "\\}";
    else if (code > 127) out += `\\u${code}?`;
    else out += ch;
  }
  return out;
}

function textToRtf(content: string): string {
  const lines: string[] = [];
  lines.push("{\\rtf1\\ansi\\ansicpg1252\\deff0");
  lines.push("{\\fonttbl{\\f0\\fswiss Helvetica;}{\\f1\\fswiss\\fcharset0 Helvetica-Bold;}}");
  lines.push("{\\colortbl;\\red255\\green255\\blue255;\\red0\\green122\\blue122;}");
  lines.push("\\pard\\plain\\f0\\fs24");

  for (const para of content.split("\n\n")) {
    if (!para.trim()) continue;

    if (para.startsWith("## ")) {
      // Heading 2
      lines.push(`\\pard\\f1\\fs28\\cf2 ${escapeRtf(para.replace("## ", ""))}\\par`);
      lines.push("\\pard\\plain\\f0\\fs24\\cf0");
    } else if (para.startsWith("### ")) {
      // Heading 3
      lines.push(`\\pard\\f1\\fs26\\cf2 ${escapeRtf(para.replace("### ", ""))}\\par`);
      lines.push("\\pard\\plain\\f0\\fs24\\cf0");
    } else {
      // Regular paragraph — handle single newlines as line breaks
      const escaped = escapeRtf(para.trim()).replace(/\n/g, "\\line ");
      lines.push(`${escaped}\\par`);
    }
  }

  lines.push("}");
  return lines.join("\n");
}

function subsectionToRtf(sub: ExportSubsection): string {
  const parts: string[] = [];

  // Title as heading
  parts.push(`## ${sub.title}`);
  parts.push("");

  // Infobox
  if (sub.infobox.length > 0) {
    for (const row of sub.infobox) {
      parts.push(`${row.label}: ${row.value}`);
    }
    parts.push("");
  }

  // Prose
  if (sub.prose && sub.prose.trim()) {
    parts.push(sub.prose.trim());
    parts.push("");
  }

  // Connections
  if (sub.connections.length > 0) {
    parts.push("### Connections");
    parts.push("");
    for (const conn of sub.connections) {
      parts.push(`\u2022 ${conn.relationship} \u2192 ${conn.targetTitle}`);
    }
    parts.push("");
  }

  // Timeline
  if (sub.timelineEvents.length > 0) {
    parts.push("### Timeline");
    parts.push("");
    for (const ev of sub.timelineEvents) {
      parts.push(`\u2022 ${ev.date}: ${ev.title}`);
      if (ev.description) {
        const desc = ev.description.length > 200
          ? ev.description.slice(0, 200) + "..."
          : ev.description;
        parts.push(`  ${desc}`);
      }
    }
    parts.push("");
  }

  return textToRtf(parts.join("\n\n"));
}

// ──────────────────────────────────────────────
// Binder XML builder
// ──────────────────────────────────────────────

interface BinderNode {
  uuid: string;
  title: string;
  type: "DraftFolder" | "ResearchFolder" | "TrashFolder" | "Folder" | "Text";
  children: BinderNode[];
  includeInCompile: boolean;
}

function renderBinderItem(node: BinderNode, indent: number): string {
  const pad = "  ".repeat(indent);
  const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " -0000");

  let xml = `${pad}<BinderItem UUID="${node.uuid}" Type="${node.type}" Created="${now}" Modified="${now}">\n`;
  xml += `${pad}  <Title>${escapeXml(node.title)}</Title>\n`;
  xml += `${pad}  <MetaData>\n`;
  xml += `${pad}    <IncludeInCompile>${node.includeInCompile ? "Yes" : "No"}</IncludeInCompile>\n`;
  xml += `${pad}  </MetaData>\n`;

  if (node.children.length > 0) {
    xml += `${pad}  <Children>\n`;
    for (const child of node.children) {
      xml += renderBinderItem(child, indent + 2);
    }
    xml += `${pad}  </Children>\n`;
  }

  xml += `${pad}</BinderItem>\n`;
  return xml;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildScrivx(projectId: string, binder: BinderNode[]): string {
  const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " -0000");
  const modId = uuid();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<ScrivenerProject Identifier="${projectId}" Version="2.0" Creator="SCRWIN-3.1.5.1" Modified="${now}" ModID="${modId}">\n`;
  xml += `\n  <Binder>\n`;

  for (const node of binder) {
    xml += renderBinderItem(node, 2);
  }

  xml += `  </Binder>\n\n`;
  xml += `  <LabelSettings>\n`;
  xml += `    <Title>Label</Title>\n`;
  xml += `    <DefaultLabelID>-1</DefaultLabelID>\n`;
  xml += `    <Labels>\n`;
  xml += `      <Label ID="-1">No Label</Label>\n`;
  xml += `    </Labels>\n`;
  xml += `  </LabelSettings>\n\n`;
  xml += `  <StatusSettings>\n`;
  xml += `    <Title>Status</Title>\n`;
  xml += `    <DefaultStatusID>-1</DefaultStatusID>\n`;
  xml += `    <Statuses>\n`;
  xml += `      <Status ID="-1">No Status</Status>\n`;
  xml += `    </Statuses>\n`;
  xml += `  </StatusSettings>\n\n`;
  xml += `</ScrivenerProject>\n`;

  return xml;
}

// ──────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────

export async function downloadScrivenerProject(
  worldName: string,
  worldDescription: string | undefined,
  sections: ExportSection[]
): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const slug = worldName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const projectName = worldName;
  const scrivFolder = zip.folder(`${slug}.scriv`)!;
  const filesFolder = scrivFolder.folder("Files")!;
  const dataFolder = filesFolder.folder("Data")!;

  // version.txt
  filesFolder.file("version.txt", "16");

  // Collect text documents (uuid → rtf content)
  const textDocs: { uuid: string; rtf: string }[] = [];

  // Build binder tree
  const projectId = uuid();
  const draftId = uuid();
  const researchId = uuid();
  const trashId = uuid();

  const draftChildren: BinderNode[] = [];

  // Content sections → Draft folders
  const contentSections = sections.filter(
    (s) => s.layer !== "overview" && s.layer !== "notes" && s.layer !== "chronicle"
  );

  for (const section of contentSections) {
    const folderId = uuid();
    const docNodes: BinderNode[] = [];

    for (const sub of section.subsections) {
      const docId = uuid();
      const rtf = subsectionToRtf(sub);
      textDocs.push({ uuid: docId, rtf });

      docNodes.push({
        uuid: docId,
        title: sub.title,
        type: "Text",
        children: [],
        includeInCompile: true,
      });
    }

    draftChildren.push({
      uuid: folderId,
      title: section.title,
      type: "Folder",
      children: docNodes,
      includeInCompile: true,
    });
  }

  // World description as first doc in Draft
  if (worldDescription) {
    const overviewId = uuid();
    textDocs.push({
      uuid: overviewId,
      rtf: textToRtf(`## ${worldName}\n\n${worldDescription}`),
    });
    draftChildren.unshift({
      uuid: overviewId,
      title: "World Overview",
      type: "Text",
      children: [],
      includeInCompile: true,
    });
  }

  // World notes
  const notesSection = sections.find((s) => s.layer === "notes");
  if (notesSection && notesSection.subsections.length > 0) {
    const notesId = uuid();
    const notesProse = notesSection.subsections
      .map((sub) => sub.prose || "")
      .filter(Boolean)
      .join("\n\n---\n\n");
    textDocs.push({ uuid: notesId, rtf: textToRtf(notesProse) });
    draftChildren.splice(worldDescription ? 1 : 0, 0, {
      uuid: notesId,
      title: "World Notes",
      type: "Text",
      children: [],
      includeInCompile: true,
    });
  }

  // Chronicle → Research/Chronicle folder
  const chronicleSection = sections.find((s) => s.layer === "chronicle");
  const researchChildren: BinderNode[] = [];

  if (chronicleSection && chronicleSection.subsections.length > 0) {
    const chronFolderId = uuid();
    const chronDocs: BinderNode[] = [];

    for (const ev of chronicleSection.subsections) {
      const evId = uuid();
      const evParts: string[] = [`## ${ev.title}`, ""];
      for (const row of ev.infobox) {
        evParts.push(`${row.label}: ${row.value}`);
      }
      if (ev.prose) {
        evParts.push("", ev.prose);
      }
      textDocs.push({ uuid: evId, rtf: textToRtf(evParts.join("\n\n")) });
      chronDocs.push({
        uuid: evId,
        title: ev.title,
        type: "Text",
        children: [],
        includeInCompile: false,
      });
    }

    researchChildren.push({
      uuid: chronFolderId,
      title: "Chronicle",
      type: "Folder",
      children: chronDocs,
      includeInCompile: false,
    });
  }

  // Build binder
  const binder: BinderNode[] = [
    {
      uuid: draftId,
      title: "Manuscript",
      type: "DraftFolder",
      children: draftChildren,
      includeInCompile: true,
    },
    {
      uuid: researchId,
      title: "Research",
      type: "ResearchFolder",
      children: researchChildren,
      includeInCompile: false,
    },
    {
      uuid: trashId,
      title: "Trash",
      type: "TrashFolder",
      children: [],
      includeInCompile: false,
    },
  ];

  // Generate .scrivx
  const scrivxContent = buildScrivx(projectId, binder);
  scrivFolder.file(`${slug}.scrivx`, scrivxContent);

  // binder.backup (zip containing the .scrivx)
  const backupZip = new JSZip();
  backupZip.file(`${slug}.scrivx`, scrivxContent);
  const backupBlob = await backupZip.generateAsync({ type: "blob" });
  filesFolder.file("binder.backup", backupBlob);

  // Write RTF documents
  for (const doc of textDocs) {
    dataFolder.folder(doc.uuid)!.file("content.rtf", doc.rtf);
  }

  // Generate and download
  const blob = await zip.generateAsync({ type: "blob" });
  const date = new Date().toISOString().split("T")[0];

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-scrivener-${date}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
