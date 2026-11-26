import { describe, expect, it, vi } from "vitest";
import { EditorState, TextSelection } from "@tiptap/pm/state";
import { findIssue, listIssues, proofreadKey, proofreadPlugin, type PlacedIssue, type ProofMeta } from "./proofread-plugin";
import { doc, p } from "./test-schema";

function issue(id: string, from: number, to: number, problem: string): PlacedIssue {
  return { id, from, to, problem, message: "m", kind: "Spelling", key: id, spelling: true, sentenceStart: false, suggestions: [] };
}

function setup() {
  const plugin = proofreadPlugin({ onChange: vi.fn(), onPick: vi.fn() });
  // "Teh ship lef orbit." at 1..; "Agian." in the second paragraph.
  const d = doc(p("Teh ship lef orbit."), p("Agian."));
  let state = EditorState.create({ doc: d, plugins: [plugin] });
  const meta = (m: ProofMeta | ProofMeta[]) => {
    state = state.apply(state.tr.setMeta(proofreadKey, m));
  };
  const apply = (fn: (s: EditorState) => ReturnType<EditorState["tr"]["insertText"]>) => {
    state = state.apply(fn(state));
  };
  return { get: () => state, meta, apply, second: d.child(0).nodeSize };
}

describe("proofread plugin", () => {
  it("places issues and reports them in document order", () => {
    const t = setup();
    t.meta({ type: "replaceAll", issues: [issue("b", 10, 13, "lef"), issue("a", 1, 4, "Teh")] });
    expect(listIssues(t.get()).map((i) => [i.id, i.from, i.to])).toEqual([["a", 1, 4], ["b", 10, 13]]);
    expect(proofreadKey.getState(t.get())!.count).toBe(2);
  });

  it("never changes the document", () => {
    const t = setup();
    const before = t.get().doc;
    t.meta({ type: "replaceAll", issues: [issue("a", 1, 4, "Teh")] });
    t.meta({ type: "remove", ids: ["a"] });
    t.meta({ type: "clear" });
    expect(t.get().doc).toBe(before);
  });

  it("moves underlines with an edit elsewhere instead of rebuilding them", () => {
    const t = setup();
    t.meta({ type: "replaceAll", issues: [issue("a", 1, 4, "Teh"), issue("b", 10, 13, "lef")] });
    const v = proofreadKey.getState(t.get())!.version;
    // Type at the very end of the first paragraph.
    t.apply((s) => s.tr.insertText(" Now", 20));
    expect(listIssues(t.get()).map((i) => [i.id, i.from])).toEqual([["a", 1], ["b", 10]]);
    // Type before "lef": it shifts, "Teh" stays.
    t.apply((s) => s.tr.insertText("big ", 5));
    const after = listIssues(t.get());
    expect(after.map((i) => [i.id, i.from, i.to])).toEqual([["a", 1, 4], ["b", 14, 17]]);
    expect(t.get().doc.textBetween(after[1].from, after[1].to)).toBe("lef");
    // A pure move is not a change of the set.
    expect(proofreadKey.getState(t.get())!.version).toBe(v);
  });

  it("drops the underline the edit touched, and only that one", () => {
    const t = setup();
    t.meta({ type: "replaceAll", issues: [issue("a", 1, 4, "Teh"), issue("b", 10, 13, "lef")] });
    const v = proofreadKey.getState(t.get())!.version;
    t.apply((s) => s.tr.insertText("f", 13));
    expect(listIssues(t.get()).map((i) => i.id)).toEqual(["a"]);
    expect(proofreadKey.getState(t.get())!.version).toBe(v + 1);
  });

  it("drops underlines inside a deleted range", () => {
    const t = setup();
    t.meta({ type: "replaceAll", issues: [issue("a", 1, 4, "Teh"), issue("b", 10, 13, "lef")] });
    t.apply((s) => s.tr.delete(8, 16));
    expect(listIssues(t.get()).map((i) => i.id)).toEqual(["a"]);
  });

  it("replaces one paragraph's issues and leaves the rest", () => {
    const t = setup();
    const from2 = t.second;
    t.meta({ type: "replaceAll", issues: [issue("a", 1, 4, "Teh"), issue("c", from2 + 1, from2 + 6, "Agian")] });
    t.meta({ type: "replaceRange", from: 0, to: from2, issues: [issue("b", 10, 13, "lef")] });
    expect(listIssues(t.get()).map((i) => i.id)).toEqual(["b", "c"]);
    // An empty result clears just that paragraph.
    t.meta({ type: "replaceRange", from: from2, to: t.get().doc.content.size, issues: [] });
    expect(listIssues(t.get()).map((i) => i.id)).toEqual(["b"]);
  });

  it("applies a batch of paragraph results in one transaction", () => {
    const t = setup();
    const from2 = t.second;
    t.meta([
      { type: "replaceRange", from: 0, to: from2, issues: [issue("a", 1, 4, "Teh")] },
      { type: "replaceRange", from: from2, to: t.get().doc.content.size, issues: [issue("c", from2 + 1, from2 + 6, "Agian")] },
    ]);
    expect(listIssues(t.get()).map((i) => i.id)).toEqual(["a", "c"]);
  });

  it("removes by id, finds by id, and ignores invalid ranges", () => {
    const t = setup();
    t.meta({ type: "replaceAll", issues: [issue("a", 1, 4, "Teh"), issue("bad", 500, 510, "x"), issue("empty", 6, 6, "")] });
    expect(listIssues(t.get()).map((i) => i.id)).toEqual(["a"]);
    expect(findIssue(t.get(), "a")).toMatchObject({ from: 1, to: 4, problem: "Teh" });
    t.meta({ type: "remove", ids: ["a", "ghost"] });
    expect(findIssue(t.get(), "a")).toBeNull();
    expect(proofreadKey.getState(t.get())!.count).toBe(0);
  });

  it("turns browser spellcheck off while registered", () => {
    const plugin = proofreadPlugin({ onChange: vi.fn(), onPick: vi.fn() });
    expect(plugin.props.attributes).toEqual({ spellcheck: "false" });
  });

  it("keeps the caret where it was when issues change", () => {
    const t = setup();
    t.apply((s) => s.tr.setSelection(TextSelection.create(s.doc, 7)));
    t.meta({ type: "replaceAll", issues: [issue("a", 1, 4, "Teh")] });
    expect(t.get().selection.from).toBe(7);
  });
});
