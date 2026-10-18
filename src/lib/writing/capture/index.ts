// ---------------------------------------------------------------------------
// capture, Canon Capture v1: prose proposes canon (Constitution Law IV,
// Studio Charter §2.2) and the Contradiction Ledger (§2.3).
//
//   paragraphs  →  detect (cached per paragraph)  →  bind  →  ledger
//
// Rule-based and deterministic. No model calls. Never edits prose; it reads
// paragraphs and returns items the writer can act on.
// ---------------------------------------------------------------------------

import { bindParagraph, type BindContext, type BoundClaim } from "@/lib/writing/capture/bind";
import { detectParagraphs, type CaptureCache, type Paragraph } from "@/lib/writing/capture/detect";
import { buildCaptureItems, type CaptureItem, type CaptureResolutions, type FactIndex } from "@/lib/writing/capture/ledger";
import { paragraphsFromHtml } from "@/lib/writing/capture/paragraphs";

export * from "@/lib/writing/capture/detect";
export * from "@/lib/writing/capture/bind";
export * from "@/lib/writing/capture/ledger";
export * from "@/lib/writing/capture/paragraphs";
export { CAPTURE_RULES } from "@/lib/writing/capture/rules";

/** Bound claims per paragraph. */
export function bindAll(
  paragraphs: readonly Paragraph[],
  raw: ReadonlyArray<ReturnType<typeof detectParagraphs>[number]>,
  ctx: BindContext,
): BoundClaim[][] {
  return paragraphs.map((p, i) => bindParagraph(raw[i] ?? [], p, ctx));
}

/** Paragraphs → ledger items, reading only paragraphs the cache has not seen. */
export function captureParagraphs(
  docId: string,
  paragraphs: readonly Paragraph[],
  cache: CaptureCache,
  ctx: BindContext,
  index: FactIndex,
  resolutions?: CaptureResolutions,
): CaptureItem[] {
  const raw = detectParagraphs(paragraphs, cache);
  return buildCaptureItems(docId, bindAll(paragraphs, raw, ctx), index, resolutions);
}

/** A stored document's HTML → ledger items. */
export function captureHtml(
  docId: string,
  html: string | null | undefined,
  cache: CaptureCache,
  ctx: BindContext,
  index: FactIndex,
  resolutions?: CaptureResolutions,
): CaptureItem[] {
  return captureParagraphs(docId, paragraphsFromHtml(html), cache, ctx, index, resolutions);
}
