// ---------------------------------------------------------------------------
// epub, a compiled manuscript as an EPUB 3 package (with an NCX for older
// readers). Built with jszip, which loads only when an ebook is compiled.
//
//   mimetype                    (first entry, stored uncompressed)
//   META-INF/container.xml
//   OEBPS/content.opf           (metadata, manifest, spine)
//   OEBPS/nav.xhtml             (EPUB 3 navigation)
//   OEBPS/toc.ncx               (EPUB 2 navigation)
//   OEBPS/style.css
//   OEBPS/title.xhtml           (when the title page is on)
//   OEBPS/chapter-001.xhtml …   (one per section)
//   OEBPS/about.xhtml, appendix.xhtml (back matter, when on)
//
// Pure apart from jszip. Tested (package structure and well-formed XHTML).
// ---------------------------------------------------------------------------

import { blocksToXhtml, escapeXml, type Block } from "./blocks";
import { sectionHeading, showDocTitle, type Manuscript } from "./compile";

export interface EpubFile {
  path: string;
  content: string;
}

interface Chapter {
  id: string;
  file: string;
  title: string;
  body: string;
}

const CSS = `body { font-family: serif; line-height: 1.5; margin: 0 5%; }
h1, h2 { text-align: center; font-weight: normal; margin: 3em 0 1.5em; page-break-before: always; }
h1.part { margin-top: 30%; }
h3 { text-align: center; font-weight: normal; font-style: italic; margin: 2em 0 1em; }
p { margin: 0; text-indent: 1.5em; }
h1 + p, h2 + p, h3 + p, p.sep + p, p.first { text-indent: 0; }
p.sep { text-align: center; margin: 1em 0; text-indent: 0; }
p.blank { margin: 1em 0 0; }
blockquote { margin: 1em 2em; }
.title { text-align: center; margin-top: 30%; }
.title h1 { page-break-before: auto; margin: 0 0 0.5em; }
.title .sub { font-style: italic; text-indent: 0; }
.title .by { margin-top: 2em; text-indent: 0; }
`;

function xhtml(title: string, body: string, lang: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
<meta charset="utf-8"/>
<title>${escapeXml(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
${body}
</body>
</html>
`;
}

function sectionBody(m: Manuscript, s: Manuscript["sections"][number]): string {
  let html = "";
  const h = sectionHeading(s);
  if (h) html += s.kind === "part" ? `<h1 class="part">${escapeXml(h)}</h1>` : `<h2>${escapeXml(h)}</h2>`;
  s.docs.forEach((d, i) => {
    if (i > 0 && m.separator !== null) {
      html += m.separator === "" ? '<p class="blank"></p>' : `<p class="sep">${escapeXml(m.separator)}</p>`;
    }
    if (showDocTitle(m, s, d)) html += `<h3>${escapeXml(d.title)}</h3>`;
    html += blocksToXhtml(d.blocks);
  });
  return html;
}

/** Every file of the package, in order (mimetype first). */
export function buildEpubFiles(m: Manuscript, opts: { id: string; lang?: string; modified?: Date }): EpubFile[] {
  const lang = opts.lang ?? "en";
  const modified = (opts.modified ?? new Date()).toISOString().replace(/\.\d{3}Z$/, "Z");
  const chapters: Chapter[] = [];
  if (m.titlePage) {
    const body =
      `<section class="title" epub:type="titlepage"><h1>${escapeXml(m.title)}</h1>` +
      (m.subtitle ? `<p class="sub">${escapeXml(m.subtitle)}</p>` : "") +
      (m.author ? `<p class="by">${escapeXml(m.author)}</p>` : "") +
      `</section>`;
    chapters.push({ id: "title", file: "title.xhtml", title: m.title, body });
  }
  m.sections.forEach((s, i) => {
    const n = String(i + 1).padStart(3, "0");
    chapters.push({
      id: `ch${n}`,
      file: `chapter-${n}.xhtml`,
      title: sectionHeading(s) ?? s.docs[0]?.title ?? `Section ${i + 1}`,
      body: sectionBody(m, s),
    });
  });
  if (m.about) {
    const paras = m.about
      .split(/\n\s*\n/)
      .map((p) => `<p>${escapeXml(p.trim()).replace(/\n/g, "<br/>")}</p>`)
      .join("");
    chapters.push({ id: "about", file: "about.xhtml", title: "About the Author", body: `<h2>About the Author</h2>${paras}` });
  }
  if (m.appendix) {
    chapters.push({
      id: "appendix",
      file: "appendix.xhtml",
      title: "Appendix: World Reference",
      body: `<h2>Appendix: World Reference</h2>${blocksToXhtml(m.appendix as Block[])}`,
    });
  }

  const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;

  const manifest = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`,
    `<item id="css" href="style.css" media-type="text/css"/>`,
    ...chapters.map((c) => `<item id="${c.id}" href="${c.file}" media-type="application/xhtml+xml"/>`),
  ].join("\n    ");
  const spine = chapters.map((c) => `<itemref idref="${c.id}"/>`).join("\n    ");
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${lang}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${escapeXml(opts.id)}</dc:identifier>
    <dc:title>${escapeXml(m.title)}</dc:title>
    ${m.author ? `<dc:creator>${escapeXml(m.author)}</dc:creator>` : ""}
    <dc:language>${lang}</dc:language>
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    ${manifest}
  </manifest>
  <spine toc="ncx">
    ${spine}
  </spine>
</package>
`;

  const navItems = chapters
    .filter((c) => c.id !== "title")
    .map((c) => `<li><a href="${c.file}">${escapeXml(c.title)}</a></li>`)
    .join("\n      ");
  const nav = xhtml(
    "Contents",
    `<nav epub:type="toc" id="toc">
  <h1>Contents</h1>
  <ol>
      ${navItems}
  </ol>
</nav>`,
    lang,
  );

  const ncxPoints = chapters
    .map(
      (c, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${escapeXml(c.title)}</text></navLabel><content src="${c.file}"/></navPoint>`,
    )
    .join("\n    ");
  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:uuid:${escapeXml(opts.id)}"/></head>
  <docTitle><text>${escapeXml(m.title)}</text></docTitle>
  <navMap>
    ${ncxPoints}
  </navMap>
</ncx>
`;

  return [
    { path: "mimetype", content: "application/epub+zip" },
    { path: "META-INF/container.xml", content: container },
    { path: "OEBPS/content.opf", content: opf },
    { path: "OEBPS/nav.xhtml", content: nav },
    { path: "OEBPS/toc.ncx", content: ncx },
    { path: "OEBPS/style.css", content: CSS },
    ...chapters.map((c) => ({ path: `OEBPS/${c.file}`, content: xhtml(c.title, c.body, lang) })),
  ];
}

/** Zip the package. The mimetype entry goes first and uncompressed, as the spec requires. */
export async function buildEpub(m: Manuscript, opts: { id: string; lang?: string; modified?: Date }): Promise<Uint8Array> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const f of buildEpubFiles(m, opts)) {
    if (f.path === "mimetype") zip.file(f.path, f.content, { compression: "STORE" });
    else zip.file(f.path, f.content, { compression: "DEFLATE" });
  }
  return zip.generateAsync({ type: "uint8array", mimeType: "application/epub+zip" });
}
