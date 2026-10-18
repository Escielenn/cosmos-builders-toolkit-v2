import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { EntityMention } from "@/components/editor/EntityMention";
import { FactRef } from "@/components/editor/FactRefExtension";
import { clearLiveFacts, setLiveEntityNames } from "@/lib/writing/live-facts";
import { scanCanonChanges } from "@/lib/writing/canon-changes";

let editor: Editor | null = null;

function make(content: string): Editor {
  editor = new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, EntityMention, FactRef],
    content,
  });
  return editor;
}

afterEach(() => {
  editor?.destroy();
  editor = null;
  clearLiveFacts();
});

const HTML = `<p>Then <entity-mention data-id="c-1" data-label="Verrid" data-entity-type="character">Verrid</entity-mention> left.</p>`;

function chip(ed: Editor): HTMLElement {
  return ed.view.dom.querySelector(".sf-entity-mention") as HTMLElement;
}

function mentionPos(ed: Editor): number {
  let at = -1;
  ed.state.doc.descendants((n, pos) => {
    if (n.type.name === "entityMention") at = pos;
  });
  return at;
}

function patchMention(ed: Editor, patch: Record<string, unknown>): void {
  const pos = mentionPos(ed);
  ed.commands.command(({ tr }) => {
    tr.setNodeMarkup(pos, undefined, { ...ed.state.doc.nodeAt(pos)!.attrs, ...patch });
    return true;
  });
}

describe("EntityMention rename marker", () => {
  it("stays plain until the Studio publishes names, then marks a renamed mention", () => {
    const ed = make(HTML);
    expect(chip(ed).dataset.state).toBeUndefined();
    setLiveEntityNames(new Map([["c-1", "Verrid Ash"]]));
    expect(chip(ed).dataset.state).toBe("renamed");
    setLiveEntityNames(new Map([["c-1", "Verrid"]]));
    expect(chip(ed).dataset.state).toBeUndefined();
  });

  it("does not serialise ackLabel when it was never set", () => {
    const ed = make(HTML);
    expect(ed.getHTML()).not.toContain("data-ack-label");
  });

  it("IGNORE records the current name; the marker and the scan both go quiet", () => {
    const ed = make(HTML);
    setLiveEntityNames(new Map([["c-1", "Verrid Ash"]]));
    patchMention(ed, { ackLabel: "Verrid Ash" });
    expect(chip(ed).dataset.state).toBeUndefined();
    const html = ed.getHTML();
    expect(html).toContain('data-ack-label="Verrid Ash"');
    expect(html).toContain(">Verrid</entity-mention>");
    const names = new Map([["c-1", "Verrid Ash"]]);
    expect(scanCanonChanges(html, { facts: new Map(), entityNames: names }).renamedMentions).toEqual([]);
  });

  it("UPDATE NAME rewrites only that node's label and its text", () => {
    const ed = make(HTML);
    setLiveEntityNames(new Map([["c-1", "Verrid Ash"]]));
    patchMention(ed, { label: "Verrid Ash" });
    expect(chip(ed).textContent).toBe("Verrid Ash");
    expect(chip(ed).dataset.state).toBeUndefined();
    const html = ed.getHTML();
    expect(html.startsWith("<p>Then <entity-mention")).toBe(true);
    expect(html).toContain(">Verrid Ash</entity-mention> left.</p>");
  });
});
