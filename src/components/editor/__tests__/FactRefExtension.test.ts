import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { FactRef } from "@/components/editor/FactRefExtension";
import { EntityMention } from "@/components/editor/EntityMention";
import { WikiLink } from "@/components/editor/WikiLinkExtension";
import { extractFactRefs, factRefToHtml, type FactRefAttrs } from "@/lib/writing/fact-ref";
import { clearLiveFacts, setLiveFacts } from "@/lib/writing/live-facts";

const ATTRS: FactRefAttrs = {
  factKey: "surfaceGravity",
  value: "1.4 g",
  tool: "planetary-profile",
  worksheetId: "ws-1",
  sourceKind: "worksheet",
  entityId: "planet-1",
  label: "Surface Gravity (g)",
};

let editor: Editor | null = null;

function make(content: string): Editor {
  editor = new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, WikiLink, EntityMention, FactRef],
    content,
  });
  return editor;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
  clearLiveFacts();
});

describe("FactRef node", () => {
  it("serializes as a fact-ref carrying every attribute and its value as text", () => {
    const ed = make("<p></p>");
    ed.commands.insertContent({ type: "factRef", attrs: ATTRS });
    const html = ed.getHTML();
    expect(html).toContain("<fact-ref");
    expect(html).toContain(">1.4 g</fact-ref>");
    expect(extractFactRefs(html)).toEqual([ATTRS]);
  });

  it("parses what it wrote, and reads as its value in plain text", () => {
    const ed = make(`<p>The pull was ${factRefToHtml(ATTRS)} today.</p>`);
    expect(ed.getText()).toBe("The pull was 1.4 g today.");
    expect(extractFactRefs(ed.getHTML())).toEqual([ATTRS]);
  });

  it("leaves documents without refs exactly as they were", () => {
    const html = "<p>Plain <strong>prose</strong>.</p>";
    expect(make(html).getHTML()).toBe(html);
  });

  it("marks a chip stale when its source moves on, without touching the prose", () => {
    const ed = make(`<p>${factRefToHtml(ATTRS)}</p>`);
    const chip = () => ed.view.dom.querySelector(".sf-fact-ref") as HTMLElement;
    expect(chip().dataset.state).toBe("unknown");
    setLiveFacts(new Map([["worksheet:ws-1:surfaceGravity", { insert: "1.4 g" }]]));
    expect(chip().dataset.state).toBe("current");
    setLiveFacts(new Map([["worksheet:ws-1:surfaceGravity", { insert: "1.6 g" }]]));
    expect(chip().dataset.state).toBe("stale");
    expect(chip().textContent).toBe("1.4 g");
    expect(extractFactRefs(ed.getHTML())[0].value).toBe("1.4 g");
  });

  it("updates one mention's stored value only when asked", () => {
    const ed = make(`<p>${factRefToHtml(ATTRS)} and ${factRefToHtml(ATTRS)}</p>`);
    let pos = -1;
    ed.state.doc.descendants((n, p) => {
      if (pos < 0 && n.type.name === "factRef") pos = p;
    });
    ed.chain()
      .command(({ tr }) => {
        tr.setNodeMarkup(pos, undefined, { ...ed.state.doc.nodeAt(pos)!.attrs, value: "1.6 g" });
        return true;
      })
      .run();
    expect(extractFactRefs(ed.getHTML()).map((r) => r.value)).toEqual(["1.6 g", "1.4 g"]);
  });
});
