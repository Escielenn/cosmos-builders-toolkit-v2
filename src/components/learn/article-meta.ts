// Shared SF University article metadata: one label set and one date format
// for the index, the article page and the landing's "Latest" row.

export const CATEGORY_LABELS: Record<string, string> = {
  basics: "Worldbuilding basics",
  science: "Science concepts",
  craft: "Writing craft",
  "case-studies": "Case studies",
};

export function formatArticleDate(iso: string, month: "short" | "long" = "short"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month, day: "numeric", year: "numeric" });
}
