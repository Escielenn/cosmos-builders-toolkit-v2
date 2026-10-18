// ---------------------------------------------------------------------------
// comments, rail ordering for inline comments. Pure, tested.
//
// Open comments read in the order their words appear in the document; a
// comment whose words were deleted (no anchor left) follows them, oldest
// first; resolved comments come last, newest first.
// ---------------------------------------------------------------------------

export interface OrderableComment {
  id: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface PlacedComment<T extends OrderableComment> {
  comment: T;
  /** Document position of the first anchored character, or null when the anchor is gone. */
  at: number | null;
}

export function orderComments<T extends OrderableComment>(
  comments: T[],
  anchorOf: (id: string) => number | null,
): PlacedComment<T>[] {
  const placed = comments.map((comment) => ({ comment, at: anchorOf(comment.id) }));
  const rank = (p: PlacedComment<T>) => (p.comment.resolvedAt ? 2 : p.at === null ? 1 : 0);
  return placed.sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) return (a.at ?? 0) - (b.at ?? 0) || a.comment.createdAt.localeCompare(b.comment.createdAt);
    if (ra === 1) return a.comment.createdAt.localeCompare(b.comment.createdAt);
    return (b.comment.resolvedAt ?? "").localeCompare(a.comment.resolvedAt ?? "");
  });
}

/** "2 OPEN · 1 RESOLVED", or "NO COMMENTS." */
export function commentsSummary(comments: OrderableComment[]): string {
  if (comments.length === 0) return "NO COMMENTS.";
  const resolved = comments.filter((c) => c.resolvedAt).length;
  const open = comments.length - resolved;
  return `${open} OPEN${resolved ? ` · ${resolved} RESOLVED` : ""}`;
}
