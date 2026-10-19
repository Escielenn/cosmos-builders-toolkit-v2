// Sentry initialization. DSN-gated: when VITE_SENTRY_DSN is unset, every
// Sentry call becomes a no-op and @sentry/react is never downloaded. This
// keeps local dev and contributor clones working without Sentry credentials,
// while production / preview deploys with the env var get full error capture.
//
// The SDK is loaded with a dynamic import so it stays off the critical path.
// `initSentry()` still runs first thing in main.tsx; it starts the download
// and, until the SDK arrives, queues every capture call and any uncaught
// error / unhandled rejection. The queue is replayed once `Sentry.init()`
// has run, after which calls go straight to the SDK.

import type * as SentryNS from "@sentry/react";
import { APP_VERSION } from "@/config/version";

type SentrySDK = typeof SentryNS;
type CaptureContext = Parameters<SentrySDK["captureException"]>[1];
type MessageContext = Parameters<SentrySDK["captureMessage"]>[1];
type SentryUser = Parameters<SentrySDK["setUser"]>[0];

type QueuedCall = (sdk: SentrySDK) => void;

/** Max calls held while the SDK downloads; older ones are dropped first. */
export const SENTRY_QUEUE_LIMIT = 50;

export const SENTRY_IGNORE_ERRORS = [
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
];

export interface LazySentry {
  init(): Promise<void>;
  captureException(error: unknown, context?: CaptureContext): void;
  captureMessage(message: string, context?: MessageContext): void;
  setUser(user: SentryUser): void;
  setTag(key: string, value: string): void;
  /** Test/diagnostic: calls waiting for the SDK. */
  pending(): number;
}

/**
 * The queue-until-loaded wrapper, separated from the module singleton so it
 * can be unit tested with a fake loader. `dsn` undefined means disabled:
 * nothing is loaded, queued or sent.
 */
export function createLazySentry(
  dsn: string | undefined,
  load: () => Promise<SentrySDK>,
  configure: (sdk: SentrySDK, dsn: string) => void,
): LazySentry {
  let sdk: SentrySDK | null = null;
  let started: Promise<void> | null = null;
  let failed = false;
  const queue: QueuedCall[] = [];

  const run = (call: QueuedCall) => {
    if (!dsn || failed) return;
    if (sdk) {
      call(sdk);
      return;
    }
    queue.push(call);
    if (queue.length > SENTRY_QUEUE_LIMIT) queue.shift();
  };

  return {
    init() {
      if (!dsn) return Promise.resolve();
      if (started) return started;
      started = load()
        .then((mod) => {
          configure(mod, dsn);
          sdk = mod;
          for (const call of queue.splice(0)) call(mod);
        })
        .catch((err) => {
          // Blocked by an ad blocker or offline: stop queueing, stay silent.
          failed = true;
          queue.length = 0;
          console.warn("Sentry failed to load", err);
        });
      return started;
    },
    captureException: (error, context) => run((s) => void s.captureException(error, context)),
    captureMessage: (message, context) => run((s) => void s.captureMessage(message, context)),
    setUser: (user) => run((s) => s.setUser(user)),
    setTag: (key, value) => run((s) => s.setTag(key, value)),
    pending: () => queue.length,
  };
}

function configureSentry(Sentry: SentrySDK, dsn: string): void {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE, // "development" | "production"
    release: `stellarforge@${APP_VERSION}`,

    integrations: [Sentry.browserTracingIntegration()],

    // Performance: 10% of transactions in production, 100% in preview/dev.
    // Adjust upward once we have a sense of volume.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Drop noise that isn't actionable. Update this list when a new
    // never-fix-it error pattern shows up in the Sentry inbox.
    ignoreErrors: SENTRY_IGNORE_ERRORS,

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

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

const lazySentry = createLazySentry(DSN, () => import("@sentry/react"), configureSentry);

export function initSentry(): void {
  if (!DSN) return;

  // Until the SDK installs its own global handlers, catch early uncaught
  // errors ourselves and queue them. Removed as soon as Sentry is live so
  // nothing is reported twice.
  const onError = (e: ErrorEvent) => lazySentry.captureException(e.error ?? e.message);
  const onRejection = (e: PromiseRejectionEvent) => lazySentry.captureException(e.reason);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  void lazySentry.init().finally(() => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  });
}

// The bits the rest of the app needs, so consumers don't reach into
// @sentry/react directly. All are safe to call before the SDK has loaded.
export const captureException = lazySentry.captureException;
export const captureMessage = lazySentry.captureMessage;
export const setUser = lazySentry.setUser;
export const setTag = lazySentry.setTag;
