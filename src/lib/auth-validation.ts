// Shared credential rules and the post-auth redirect validator, so sign-up,
// sign-in, join and password reset can never drift apart.

import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 6;

export const emailSchema = z.string().email("VALID EMAIL REQUIRED.");
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `AT LEAST ${PASSWORD_MIN_LENGTH} CHARS REQUIRED.`);

const PROBE_ORIGIN = "https://stellarforge.invalid";

/**
 * Turn an untrusted `redirect` / `from` query value into a same-origin
 * relative path, or the fallback. Rejects absolute URLs, protocol-relative
 * (`//evil.com`), backslash tricks (`/\evil.com`), control characters, and
 * the auth pages themselves (no bounce loops).
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;
  let url: URL;
  try {
    url = new URL(value, PROBE_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== PROBE_ORIGIN) return fallback;
  if (url.pathname === "/auth" || url.pathname.startsWith("/auth/")) return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Read the redirect target from a query string (`redirect` wins over `from`). */
export function redirectFromSearch(search: URLSearchParams, fallback = "/"): string {
  return safeRedirectPath(search.get("redirect") ?? search.get("from"), fallback);
}
