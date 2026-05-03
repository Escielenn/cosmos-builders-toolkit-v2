// Sentry initialization. DSN-gated: when VITE_SENTRY_DSN is unset, every
// Sentry call becomes a no-op. This keeps local dev and contributor clones
// working without Sentry credentials, while production / preview deploys
// with the env var get full error capture.

import * as Sentry from "@sentry/react";
import { APP_VERSION } from "@/config/version";

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initSentry(): void {
  if (!DSN) {
    // No DSN configured. Sentry SDK is a no-op until init() runs, so
    // captureException calls elsewhere won't error; they just don't send.
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: import.meta.env.MODE, // "development" | "production"
    release: `stellarforge@${APP_VERSION}`,

    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Performance: 10% of transactions in production, 100% in preview/dev.
    // Adjust upward once we have a sense of volume.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Drop noise that isn't actionable. Update this list when a new
    // never-fix-it error pattern shows up in the Sentry inbox.
    ignoreErrors: [
      // Stale-chunk errors are auto-recovered by preload-error-recovery.ts
      "Failed to fetch dynamically imported module",
      "Importing a module script failed",
      "error loading dynamically imported module",
      // Browser noise — not user-impacting
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Cancelled fetches (user navigated away)
      "AbortError",
      "The user aborted a request",
      // Common safe network blips that Tanstack Query already retries
      "NetworkError when attempting to fetch resource",
      "Load failed",
    ],

    // Don't send PII by default. Tighten further per-event if needed.
    sendDefaultPii: false,

    beforeSend(event) {
      // Strip referer query strings that could leak share-tokens
      if (event.request?.headers && typeof event.request.headers === "object") {
        delete (event.request.headers as Record<string, string>).Referer;
        delete (event.request.headers as Record<string, string>).referer;
      }
      return event;
    },
  });
}

// Re-export the bits the rest of the app needs so consumers don't reach
// into @sentry/react directly. Keeps the Sentry surface findable.
export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const setUser = Sentry.setUser;
export const setTag = Sentry.setTag;
