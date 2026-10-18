/**
 * ship-voice, utilities for StellarForge's "Ship's Voice" copy style.
 *
 * Per April 2026 handoff, all system messages use mission-control voice:
 * UPPERCASE, no exclamation points, past tense for confirmations, imperative
 * for actions, no emoji, no "Oops!" or "Let's go!".
 *
 * Examples:
 *   save success   , WORLD FILE SECURED.
 *   save failure   , TRANSMISSION FAILED. RETRY WHEN READY.
 *   export success , EXPORT COMPLETE. TRANSMISSION LOGGED.
 *   load           , CALIBRATING INSTRUMENTS...
 *   network error  , CONNECTION LOST. OPERATING IN LOCAL MODE.
 *   validation fail, PARAMETERS OUTSIDE OPERATIONAL RANGE.
 *   paywall        , THIS INSTRUMENT REQUIRES PRO CLEARANCE.
 *   404            , COORDINATES DO NOT MATCH ANY KNOWN RECORD.
 */

export const VOICE = {
  // Save / persist
  savedWorld: "WORLD FILE SECURED.",
  savedWorksheet: "WORKSHEET SECURED.",
  savedGeneric: "FILE SECURED.",
  saveFailed: "TRANSMISSION FAILED. RETRY WHEN READY.",

  // Export / share
  exportComplete: "EXPORT COMPLETE. TRANSMISSION LOGGED.",
  exportFailed: "EXPORT FAILED. TRANSMISSION ABORTED.",
  sharedLink: "SHARE LINK SECURED. DISTRIBUTE WHEN READY.",
  copyToClipboard: "COPIED TO CLIPBOARD.",

  // Load / sync
  loading: "INITIALIZING...",
  loadingInstruments: "CALIBRATING INSTRUMENTS...",
  syncing: "SYNCHRONIZING...",

  // Empty state helpers
  emptyIndex: (what: string) => `${what.toUpperCase()} INDEX: EMPTY.`,
  noResourceOnFile: (what: string) =>
    `NO ${what.toUpperCase()} ON FILE. BEGIN SURVEY WHEN READY.`,

  // Errors / status
  genericError: "OPERATION FAILED. RETRY WHEN READY.",
  outsideRange: "PARAMETERS OUTSIDE OPERATIONAL RANGE.",
  requiredField: "FIELD REQUIRED BEFORE TRANSMISSION.",
  accessDenied: "ACCESS DENIED. CLEARANCE INSUFFICIENT.",
  recordConflict: "RECORD CONFLICT. ENTRY ALREADY ON FILE.",
  notFound: "COORDINATES DO NOT MATCH ANY KNOWN RECORD.",
  paywall: "THIS INSTRUMENT REQUIRES PRO CLEARANCE.",
  offline: "CONNECTION LOST. OPERATING IN LOCAL MODE.",

  // Auth / session
  sessionEstablished: "SESSION ESTABLISHED.",
  sessionTerminated: "SESSION TERMINATED.",
  credentialsRejected: "CREDENTIALS NOT RECOGNIZED. VERIFY AND RETRY.",
  accountExists: "ACCOUNT ALREADY ON FILE. SIGN IN INSTEAD.",
  emailUnconfirmed: "EMAIL NOT CONFIRMED. CHECK YOUR INBOX FOR THE CONFIRMATION LINK.",
  weakPassword: "PASSWORD REJECTED. CHOOSE A STRONGER ONE.",
  samePassword: "NEW PASSWORD MUST DIFFER FROM THE CURRENT ONE.",
  rateLimited: "TOO MANY REQUESTS. STAND BY AND RETRY IN A MINUTE.",
  resetLinkSent: "RESET LINK DISPATCHED. CHECK YOUR INBOX.",
  resetLinkInvalid: "RESET LINK EXPIRED OR INVALID. REQUEST A NEW ONE.",
  passwordUpdated: "PASSWORD UPDATED. SESSION ESTABLISHED.",
} as const;

/**
 * Supabase Auth error codes (AuthError.code) and the raw messages older
 * servers send without a code. Matching lives here so pages never branch on
 * raw upstream text.
 */
const AUTH_CODES: Record<string, string> = {
  invalid_credentials: VOICE.credentialsRejected,
  user_already_exists: VOICE.accountExists,
  email_exists: VOICE.accountExists,
  email_not_confirmed: VOICE.emailUnconfirmed,
  weak_password: VOICE.weakPassword,
  same_password: VOICE.samePassword,
  over_email_send_rate_limit: VOICE.rateLimited,
  over_request_rate_limit: VOICE.rateLimited,
  otp_expired: VOICE.resetLinkInvalid,
};

const AUTH_MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, VOICE.credentialsRejected],
  [/user already registered/i, VOICE.accountExists],
  [/email not confirmed/i, VOICE.emailUnconfirmed],
  [/should be different from the old password/i, VOICE.samePassword],
  [/rate limit|too many requests|security purposes, you can only request/i, VOICE.rateLimited],
];

/**
 * Map a raw error (Supabase PostgREST code, Error, or string) to Ship's Voice.
 * Falls back to a generic message when the code is unknown.
 */
export function mapError(err: unknown): string {
  if (!err) return VOICE.genericError;
  if (typeof err === "string") {
    for (const [pattern, voice] of AUTH_MESSAGES) {
      if (pattern.test(err)) return voice;
    }
    return reshape(err);
  }

  // Supabase / PostgREST shape: { code, message, details }
  const anyErr = err as { code?: string; message?: string };
  if (anyErr.code) {
    switch (anyErr.code) {
      case "23505":
        return VOICE.recordConflict;
      case "42501":
      case "PGRST301":
        return VOICE.accessDenied;
      case "PGRST116":
        return VOICE.notFound;
      case "23502":
      case "23514":
        return VOICE.outsideRange;
    }
    if (AUTH_CODES[anyErr.code]) return AUTH_CODES[anyErr.code];
  }

  const message = anyErr.message ?? (err instanceof Error ? err.message : undefined);
  if (message) {
    for (const [pattern, voice] of AUTH_MESSAGES) {
      if (pattern.test(message)) return voice;
    }
    return reshape(message);
  }
  return VOICE.genericError;
}

function reshape(raw: string): string {
  // If the upstream message already looks like Ship's Voice (ALL CAPS, no
  // exclamation), return it unchanged. Otherwise uppercase and strip trailing
  // exclamation points so it feels like a bridge readout.
  if (/^[A-Z0-9 .,:;·'"-]+$/.test(raw) && !raw.includes("!")) return raw;
  return raw
    .replace(/!/g, ".")
    .replace(/^["']|["']$/g, "")
    .trim()
    .toUpperCase();
}
