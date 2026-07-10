/**
 * Shared validators. Keep isValidEmail in lockstep with the rule in
 * supabase/functions/waitlist-confirmation (EMAIL_RE) so the client and
 * the edge function agree on what a valid signup is.
 */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(value: string | null | undefined): boolean {
  const clean = String(value ?? "").trim().toLowerCase();
  return clean.length > 0 && clean.length <= 254 && EMAIL_RE.test(clean);
}
