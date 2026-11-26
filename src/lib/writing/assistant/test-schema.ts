// A small ProseMirror schema for the assistant's tests: paragraphs with
// marks, a hard break, and the editor's inline atoms (@mention, cited fact).
import { Schema, type Node as PMNode } from "@tiptap/pm/model";

export const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "inline*", toDOM: () => ["p", 0] },
    codeBlock: { group: "block", content: "text*", code: true, toDOM: () => ["pre", 0] },
    text: { group: "inline" },
    hardBreak: { group: "inline", inline: true, selectable: false, toDOM: () => ["br"] },
    entityMention: {
      group: "inline",
      inline: true,
      atom: true,
      attrs: { id: { default: null }, label: { default: "" }, entityType: { default: "custom" }, color: { default: null } },
      toDOM: (node) => ["entity-mention", {}, String(node.attrs.label)],
    },
    factRef: {
      group: "inline",
      inline: true,
      atom: true,
      attrs: { value: { default: "" } },
      toDOM: (node) => ["fact-ref", {}, String(node.attrs.value)],
    },
  },
  marks: {
    bold: { toDOM: () => ["strong", 0] },
  },
});

type Inline = string | PMNode;

export const bold = (text: string): PMNode => schema.text(text, [schema.marks.bold.create()]);
export const mention = (label: string, id = "e1"): PMNode => schema.nodes.entityMention.create({ id, label });
export const fact = (value: string): PMNode => schema.nodes.factRef.create({ value });
export const br = (): PMNode => schema.nodes.hardBreak.create();

export function p(...content: Inline[]): PMNode {
  return schema.nodes.paragraph.create(
    null,
    content.filter((c) => c !== "").map((c) => (typeof c === "string" ? schema.text(c) : c)),
  );
}

export function doc(...blocks: PMNode[]): PMNode {
  return schema.nodes.doc.create(null, blocks);
}
