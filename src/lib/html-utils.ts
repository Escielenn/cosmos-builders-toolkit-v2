/**
 * Convert HTML content to plain text.
 * Handles block elements by inserting newlines, strips all tags.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return "";

  // If there are no HTML tags, return as-is (plain text content)
  if (!/<[^>]+>/.test(html)) return html;

  let text = html;

  // Replace block-level elements with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, "\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/(ul|ol)>/gi, "\n");

  // Add bullet markers for list items
  text = text.replace(/<li[^>]*>/gi, "- ");

  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, " ");

  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text;
}

/**
 * Recursively strip HTML from all string values in an object.
 * Safe to call on plain text — htmlToPlainText passes through non-HTML strings unchanged.
 */
export function deepStripHtml<T>(data: T): T {
  if (typeof data === "string") return htmlToPlainText(data) as T;
  if (Array.isArray(data)) return data.map((item) => deepStripHtml(item)) as T;
  if (data && typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[key] = deepStripHtml(value);
    }
    return result as T;
  }
  return data;
}
