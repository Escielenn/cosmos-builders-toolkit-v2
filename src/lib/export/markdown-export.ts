/**
 * Markdown World Export
 *
 * Generates a ZIP of organized .md files from ExportSection[].
 * - One .md file per section (layer)
 * - Each subsection as a ## heading within its section file
 * - Chronicle folder with individual event .md files
 * - Wiki-links preserved as [[Title]]
 */

import type { ExportSection, ExportSubsection } from "@/services/worldExportFormatter";

function safeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function renderSubsection(sub: ExportSubsection): string {
  const lines: string[] = [];

  lines.push(`## ${sub.title}`);
  lines.push("");

  // Infobox as a table
  if (sub.infobox.length > 0) {
    lines.push("| Field | Value |");
    lines.push("|-------|-------|");
    for (const row of sub.infobox) {
      const escapedLabel = row.label.replace(/\|/g, "\\|");
      const escapedValue = row.value.replace(/\|/g, "\\|");
      lines.push(`| ${escapedLabel} | ${escapedValue} |`);
    }
    lines.push("");
  }

  // Prose (already markdown-formatted from stripHtmlToText)
  if (sub.prose && sub.prose.trim()) {
    lines.push(sub.prose.trim());
    lines.push("");
  }

  // Connections
  if (sub.connections.length > 0) {
    lines.push("### Connections");
    lines.push("");
    for (const conn of sub.connections) {
      lines.push(`- ${conn.relationship} \u2192 [[${conn.targetTitle}]]`);
    }
    lines.push("");
  }

  // Timeline events
  if (sub.timelineEvents.length > 0) {
    lines.push("### Timeline");
    lines.push("");
    for (const ev of sub.timelineEvents) {
      lines.push(`- **${ev.date}**: ${ev.title}`);
      if (ev.description) {
        lines.push(`  ${ev.description.slice(0, 300)}${ev.description.length > 300 ? "..." : ""}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

function renderSection(section: ExportSection, index: number): string {
  const lines: string[] = [];

  lines.push(`# ${index}. ${section.title}`);
  lines.push("");
  lines.push(`*${section.subsections.length} element${section.subsections.length !== 1 ? "s" : ""}*`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const sub of section.subsections) {
    lines.push(renderSubsection(sub));
  }

  return lines.join("\n");
}

export interface MarkdownExportFile {
  path: string;
  content: string;
}

export function generateMarkdownFiles(
  worldName: string,
  worldDescription: string | undefined,
  sections: ExportSection[]
): MarkdownExportFile[] {
  const files: MarkdownExportFile[] = [];
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // README
  const contentSections = sections.filter(
    (s) => s.layer !== "overview" && s.layer !== "notes"
  );

  const readme = [
    `# ${worldName}`,
    "",
    worldDescription ? worldDescription : "",
    "",
    `*Exported from StellarForge on ${date}*`,
    "",
    "## Contents",
    "",
    ...contentSections.map(
      (s, i) =>
        `${i + 1}. [${s.title}](./${safeName(s.title)}.md) (${s.subsections.length} element${s.subsections.length !== 1 ? "s" : ""})`
    ),
    "",
  ];

  // Check for chronicle
  const chronicleSection = sections.find((s) => s.layer === "chronicle");
  if (chronicleSection) {
    readme.push(
      `- [Chronicle](./chronicle/) (${chronicleSection.subsections.length} event${chronicleSection.subsections.length !== 1 ? "s" : ""})`
    );
    readme.push("");
  }

  files.push({ path: "README.md", content: readme.join("\n") });

  // World Notes
  const notesSection = sections.find((s) => s.layer === "notes");
  if (notesSection && notesSection.subsections.length > 0) {
    const noteContent = [
      `# World Notes`,
      "",
      ...notesSection.subsections.map((sub) => sub.prose || ""),
    ].join("\n");
    files.push({ path: "world-notes.md", content: noteContent });
  }

  // Content sections (layers)
  contentSections
    .filter((s) => s.layer !== "chronicle")
    .forEach((section, i) => {
      const filename = `${safeName(section.title)}.md`;
      files.push({
        path: filename,
        content: renderSection(section, i + 1),
      });
    });

  // Chronicle, individual event files
  if (chronicleSection) {
    for (const sub of chronicleSection.subsections) {
      const eventFilename = `chronicle/${safeName(sub.title)}.md`;
      const eventLines = [
        `# ${sub.title}`,
        "",
      ];

      if (sub.infobox.length > 0) {
        for (const row of sub.infobox) {
          eventLines.push(`- **${row.label}**: ${row.value}`);
        }
        eventLines.push("");
      }

      if (sub.prose && sub.prose.trim()) {
        eventLines.push(sub.prose.trim());
        eventLines.push("");
      }

      files.push({ path: eventFilename, content: eventLines.join("\n") });
    }
  }

  return files;
}

export async function downloadMarkdownZip(
  worldName: string,
  worldDescription: string | undefined,
  sections: ExportSection[]
): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const files = generateMarkdownFiles(worldName, worldDescription, sections);
  for (const file of files) {
    zip.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const slug = worldName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const date = new Date().toISOString().split("T")[0];

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}-markdown-${date}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
