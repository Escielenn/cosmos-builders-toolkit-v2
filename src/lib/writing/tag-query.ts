// ---------------------------------------------------------------------------
// `#tag` in binder search (1.7).
//
// A document's tags are its keywords (metadata.keywords). In the binder's
// search field, `#arrival` narrows to documents carrying that tag; several
// tags narrow further; anything else in the query is searched as before,
// inside those documents only. `#first-contact` matches the tag "first
// contact". Pure.
// ---------------------------------------------------------------------------

export interface TagQuery {
  /** Lower-cased tags the document must all carry. */
  tags: string[];
  /** What is left to search for, trimmed. */
  text: string;
}

const TAG_TOKEN = /(^|\s)#([\p{L}\p{N}][\p{L}\p{N}_-]*)/gu;

export function parseTagQuery(query: string): TagQuery {
  const tags: string[] = [];
  const text = query
    .replace(TAG_TOKEN, (_m, lead: string, tag: string) => {
      const t = tag.toLowerCase();
      if (!tags.includes(t)) tags.push(t);
      return lead;
    })
    .replace(/\s+/g, " ")
    .trim();
  return { tags, text };
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "-");

/** True when the document carries every tag asked for. */
export function hasAllTags(keywords: readonly string[], tags: readonly string[]): boolean {
  if (tags.length === 0) return true;
  const have = new Set(keywords.map(norm));
  return tags.every((t) => have.has(norm(t)));
}

/** The search-field token for a tag: `first contact` → `#first-contact`. */
export function tagToken(keyword: string): string {
  return `#${norm(keyword)}`;
}
