// ---------------------------------------------------------------------------
// ManuscriptTemplate, a compiled manuscript as PDF (@react-pdf/renderer).
//
// Times or Courier (two of the fourteen base PDF fonts: no embedding, no
// network), 12pt, 1in margins, double or single spacing. Title page without
// the running header; every other page carries "Surname / TITLE / n" top
// right. Each section opens a new page a third of the way down.
//
// Load through `import()` at export time only; it pulls in the renderer.
// Ink is plain black on white: a manuscript is print, not the instrument.
// ---------------------------------------------------------------------------

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Block, Run } from "@/lib/manuscript/blocks";
import { approxWordsLine, sectionHeading, showDocTitle, surnameOf, type Manuscript } from "@/lib/manuscript/compile";

const INK = "black";

function family(font: Manuscript["font"], bold?: boolean, italic?: boolean): string {
  if (font === "courier") {
    if (bold && italic) return "Courier-BoldOblique";
    if (bold) return "Courier-Bold";
    if (italic) return "Courier-Oblique";
    return "Courier";
  }
  if (bold && italic) return "Times-BoldItalic";
  if (bold) return "Times-Bold";
  if (italic) return "Times-Italic";
  return "Times-Roman";
}

function makeStyles(m: Manuscript) {
  const lineHeight = m.doubleSpaced ? 2 : 1.4;
  return StyleSheet.create({
    page: { paddingTop: 72, paddingBottom: 72, paddingHorizontal: 72, fontFamily: family(m.font), fontSize: 12, color: INK, lineHeight },
    header: { position: "absolute", top: 36, right: 72, fontSize: 12, fontFamily: family(m.font) },
    p: { textIndent: 36 },
    pFirst: { textIndent: 0 },
    center: { textAlign: "center" },
    quote: { marginHorizontal: 36 },
    chapterHead: { textAlign: "center", marginTop: 144, marginBottom: 24 },
    partHead: { textAlign: "center", marginTop: 216 },
    titleRow: { flexDirection: "row", justifyContent: "space-between", lineHeight: 1.4 },
    titleBlock: { marginTop: 200, textAlign: "center" },
  });
}

function RunsText({ runs, font }: { runs: Run[]; font: Manuscript["font"] }) {
  return (
    <>
      {runs.map((r, i) =>
        r.text === "\n" ? (
          <Text key={i}>{"\n"}</Text>
        ) : (
          <Text
            key={i}
            style={{
              fontFamily: family(font, r.bold, r.italic),
              textDecoration: r.underline ? "underline" : r.strike ? "line-through" : undefined,
            }}
          >
            {r.text}
          </Text>
        ),
      )}
    </>
  );
}

function BlockView({ b, first, m, s }: { b: Block; first: boolean; m: Manuscript; s: ReturnType<typeof makeStyles> }) {
  if (b.type === "hr") return <Text style={s.center}>#</Text>;
  if (b.type === "h")
    return (
      <Text style={s.center}>
        <RunsText runs={b.runs} font={m.font} />
      </Text>
    );
  if (b.type === "quote")
    return (
      <Text style={s.quote}>
        <RunsText runs={b.runs} font={m.font} />
      </Text>
    );
  if (b.type === "li")
    return (
      <Text style={{ marginLeft: 36 + b.depth * 18 }}>
        {b.ordered ? `${b.index}. ` : "• "}
        <RunsText runs={b.runs} font={m.font} />
      </Text>
    );
  return (
    <Text style={first ? s.pFirst : s.p}>
      <RunsText runs={b.runs} font={m.font} />
    </Text>
  );
}

function BlockList({ blocks, m, s }: { blocks: Block[]; m: Manuscript; s: ReturnType<typeof makeStyles> }) {
  let first = true;
  return (
    <>
      {blocks.map((b, i) => {
        const el = <BlockView key={i} b={b} first={first} m={m} s={s} />;
        first = b.type === "h" || b.type === "hr";
        return el;
      })}
    </>
  );
}

export default function ManuscriptTemplate({ manuscript: m }: { manuscript: Manuscript }) {
  const s = makeStyles(m);
  const headerText = [surnameOf(m.author), m.title.toUpperCase()].filter(Boolean).join(" / ");
  const runningHeader = (
    <Text style={s.header} fixed render={({ pageNumber }) => `${headerText} / ${pageNumber}`} />
  );
  const contactLines = [m.author, ...m.contact.split("\n").map((l) => l.trim()).filter(Boolean)].filter(Boolean);

  return (
    <Document title={m.title} author={m.author || undefined} creator="StellarForge">
      {m.titlePage && (
        <Page size="LETTER" style={s.page}>
          <View style={s.titleRow}>
            <View>
              {contactLines.map((l, i) => (
                <Text key={i}>{l}</Text>
              ))}
            </View>
            <Text>{approxWordsLine(m.words)}</Text>
          </View>
          <View style={s.titleBlock}>
            <Text>{m.title.toUpperCase()}</Text>
            {m.subtitle ? <Text>{m.subtitle}</Text> : null}
            {m.author ? <Text style={{ marginTop: 24 }}>by {m.author}</Text> : null}
          </View>
        </Page>
      )}
      {m.sections.map((sec) => {
        const heading = sectionHeading(sec);
        return (
          <Page key={sec.id} size="LETTER" style={s.page}>
            {runningHeader}
            <Text style={sec.kind === "part" ? s.partHead : s.chapterHead}>{heading ?? " "}</Text>
            {sec.docs.map((d, i) => (
              <View key={d.id}>
                {i > 0 && m.separator !== null ? <Text style={s.center}>{m.separator || " "}</Text> : null}
                {showDocTitle(m, sec, d) ? <Text style={[s.center, { fontFamily: family(m.font, false, true) }]}>{d.title}</Text> : null}
                <BlockList blocks={d.blocks} m={m} s={s} />
              </View>
            ))}
          </Page>
        );
      })}
      {m.about && (
        <Page size="LETTER" style={s.page}>
          {runningHeader}
          <Text style={s.chapterHead}>About the Author</Text>
          {m.about.split(/\n\s*\n/).map((p, i) => (
            <Text key={i} style={i === 0 ? s.pFirst : s.p}>
              {p.trim()}
            </Text>
          ))}
        </Page>
      )}
      {m.appendix && (
        <Page size="LETTER" style={s.page}>
          {runningHeader}
          <Text style={s.chapterHead}>Appendix: World Reference</Text>
          <BlockList blocks={m.appendix} m={m} s={s} />
        </Page>
      )}
      {m.backMatter.map((b) => (
        <Page key={b.id} size="LETTER" style={s.page}>
          {runningHeader}
          <Text style={s.chapterHead}>{b.title}</Text>
          <BlockList blocks={b.blocks} m={m} s={s} />
        </Page>
      ))}
    </Document>
  );
}
