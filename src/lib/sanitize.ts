/**
 * HTML sanitizer for user-authored rich text (security review 2026-07-10).
 *
 * Defense-in-depth for every dangerouslySetInnerHTML site: stored
 * content is written by TipTap, but the API accepts arbitrary HTML,
 * and community worlds / link shares render OTHER users' content —
 * a stored-XSS vector. The CSP (script-src 'self') is the first wall;
 * this is the second. Always render user HTML through sanitizeHtml().
 */
import DOMPurify from "dompurify";

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    // TipTap output + wiki-link/mention markup
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
    FORBID_TAGS: ["style", "form", "input", "button"],
  });
}
