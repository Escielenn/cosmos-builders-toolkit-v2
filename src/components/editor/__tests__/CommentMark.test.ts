import { describe, it, expect, afterEach } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { CommentMark, commentIdsInDoc, findCommentRanges } from "@/components/editor/CommentMark";
import { FactRef } from "@/components/editor/FactRefExtension";
import { htmlToBlocks, runsText } from "@/lib/manuscript/blocks";
import { htmlToPlain } from "@/lib/binder-search";
import { commentsSummary, orderComments } from "@/lib/writing/comments";

let editor: Editor | null = null;
function make(content: string): Editor {
  editor = new Editor({ element: document.createElement("div"), extensions: [StarterKit, FactRef, CommentMark], content });
  return editor;
}
afterEach(() => {
  editor?.destroy();
  editor = null;
});

/** Position of the first character of `needle` in a one-paragraph doc. */
function posOf(ed: Editor, needle: string): number {
  // Search each textblock's whole text: marks split it into several nodes.
  let found = -1;
  ed.state.doc.descendants((node, pos) => {
    if (found >= 0) return false;
    if (!node.isTextblock) return true;
    const i = node.textContent.indexOf(needle);
    if (i >= 0) found = pos + 1 + i;
    return false;
  });
  if (found < 0) throw new Error(`no ${needle}`);
  return found;
}

function anchor(ed: Editor, needle: string, id: string): void {
  const from = posOf(ed, needle);
  ed.chain().setTextSelection({ from, to: from + needle.length }).setComment(id).run();
}

describe("comment anchors", () => {
  it("anchors on the selection without changing the text", () => {
    const ed = make("<p>The storm broke over Kellis.</p>");
    const before = ed.getText();
    anchor(ed, "storm broke", "c1");
    expect(ed.getText()).toBe(before);
    expect(findCommentRanges(ed.state.doc, "c1").map((r) => r.text)).toEqual(["storm broke"]);
    expect(ed.getHTML()).toContain('<span class="sf-comment" data-comment-id="c1">storm broke</span>');
  });

  it("survives edits before, inside and after the anchor (position mapping)", () => {
    const ed = make("<p>The storm broke over Kellis.</p>");
    anchor(ed, "storm broke", "c1");
    // Before: the anchor shifts right with its words.
    ed.chain().insertContentAt(1, "At dawn, ").run();
    expect(findCommentRanges(ed.state.doc, "c1")[0].text).toBe("storm broke");
    // Inside: typed words join the anchor.
    ed.chain().insertContentAt(posOf(ed, "broke"), "finally ").run();
    expect(findCommentRanges(ed.state.doc, "c1")[0].text).toBe("storm finally broke");
    // At the end edge: not extended (inclusive: false).
    const end = findCommentRanges(ed.state.doc, "c1")[0].to;
    ed.chain().setTextSelection(end).insertContent("!").run();
    expect(findCommentRanges(ed.state.doc, "c1")[0].text).toBe("storm finally broke");
    // A new paragraph above moves everything down.
    ed.chain().insertContentAt(0, "<p>Prologue.</p>").run();
    expect(findCommentRanges(ed.state.doc, "c1")[0].text).toBe("storm finally broke");
  });

  it("survives a save and reload through HTML", () => {
    const ed = make("<p>The storm broke over Kellis.</p>");
    anchor(ed, "Kellis", "c2");
    const html = ed.getHTML();
    ed.destroy();
    const again = make(html);
    expect(findCommentRanges(again.state.doc, "c2").map((r) => r.text)).toEqual(["Kellis"]);
  });

  it("loses its anchor only when every anchored word is deleted", () => {
    const ed = make("<p>The storm broke.</p>");
    anchor(ed, "storm", "c1");
    const from = posOf(ed, "storm");
    ed.chain().deleteRange({ from, to: from + 5 }).run();
    expect(findCommentRanges(ed.state.doc, "c1")).toEqual([]);
    expect(ed.getText()).toBe("The  broke.");
  });

  it("comments may overlap", () => {
    const ed = make("<p>alpha beta gamma</p>");
    anchor(ed, "alpha beta", "a");
    anchor(ed, "beta gamma", "b");
    expect(findCommentRanges(ed.state.doc, "a")[0].text).toBe("alpha beta");
    expect(findCommentRanges(ed.state.doc, "b")[0].text).toBe("beta gamma");
    expect(commentIdsInDoc(ed.state.doc).sort()).toEqual(["a", "b"]);
  });

  it("resolve and delete rewrite only the mark", () => {
    const ed = make("<p>The storm broke.</p>");
    anchor(ed, "storm", "c1");
    const text = ed.getText();
    ed.commands.setCommentResolved("c1", true);
    expect(ed.getHTML()).toContain('data-resolved="true"');
    expect(findCommentRanges(ed.state.doc, "c1")[0].text).toBe("storm");
    ed.commands.setCommentResolved("c1", false);
    expect(ed.getHTML()).not.toContain("data-resolved");
    ed.commands.unsetComment("c1");
    expect(ed.getHTML()).not.toContain("data-comment-id");
    expect(ed.getText()).toBe(text);
  });

  it("an empty selection files no anchor", () => {
    const ed = make("<p>words</p>");
    expect(ed.chain().setTextSelection(2).setComment("x").run()).toBe(false);
  });
});

describe("compile, export and search strip comments", () => {
  const html = '<p>The <span class="sf-comment" data-comment-id="c1" data-resolved="true">storm</span> broke.</p>';

  it("blocks print the words only", () => {
    const blocks = htmlToBlocks(html);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type === "p" && runsText(blocks[0].runs)).toBe("The storm broke.");
  });

  it("search sees the words only", () => {
    expect(htmlToPlain(html)).toBe("The storm broke.");
  });
});

describe("rail ordering", () => {
  const c = (id: string, createdAt: string, resolvedAt: string | null = null) => ({ id, createdAt, resolvedAt });

  it("open by position, then unanchored, then resolved newest first", () => {
    const comments = [c("late", "2026-01-03"), c("gone", "2026-01-01"), c("early", "2026-01-04"), c("r1", "2026-01-01", "2026-02-01"), c("r2", "2026-01-01", "2026-03-01")];
    const at: Record<string, number | null> = { late: 40, early: 5, gone: null, r1: 1, r2: 2 };
    expect(orderComments(comments, (id) => at[id]).map((p) => p.comment.id)).toEqual(["early", "late", "gone", "r2", "r1"]);
  });

  it("summary line", () => {
    expect(commentsSummary([])).toBe("NO COMMENTS.");
    expect(commentsSummary([c("a", "x"), c("b", "x", "y")])).toBe("1 OPEN · 1 RESOLVED");
  });
});
