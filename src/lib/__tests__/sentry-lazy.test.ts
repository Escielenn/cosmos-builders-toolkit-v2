import { describe, it, expect, vi } from "vitest";
import type * as SentryNS from "@sentry/react";
import { createLazySentry, SENTRY_QUEUE_LIMIT } from "@/lib/sentry";

function fakeSdk() {
  return {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    setUser: vi.fn(),
    setTag: vi.fn(),
  } as unknown as typeof SentryNS & {
    captureException: ReturnType<typeof vi.fn>;
    captureMessage: ReturnType<typeof vi.fn>;
    setTag: ReturnType<typeof vi.fn>;
  };
}

describe("createLazySentry", () => {
  it("does nothing without a DSN: no load, no queue", async () => {
    const load = vi.fn();
    const s = createLazySentry(undefined, load, vi.fn());
    s.captureException(new Error("x"));
    await s.init();
    expect(load).not.toHaveBeenCalled();
    expect(s.pending()).toBe(0);
  });

  it("queues calls made before the SDK loads and replays them in order after configure", async () => {
    const sdk = fakeSdk();
    const order: string[] = [];
    const configure = vi.fn(() => order.push("configure"));
    sdk.captureException.mockImplementation(() => order.push("exception"));
    sdk.captureMessage.mockImplementation(() => order.push("message"));
    const s = createLazySentry("dsn", () => Promise.resolve(sdk), configure);

    const err = new Error("early");
    s.captureException(err, { tags: { a: "1" } });
    s.captureMessage("hello", { level: "info" });
    expect(s.pending()).toBe(2);

    await s.init();
    expect(order).toEqual(["configure", "exception", "message"]);
    expect(sdk.captureException).toHaveBeenCalledWith(err, { tags: { a: "1" } });
    expect(s.pending()).toBe(0);

    s.setTag("k", "v");
    expect(sdk.setTag).toHaveBeenCalledWith("k", "v");
  });

  it("loads once however many times init is called", async () => {
    const load = vi.fn(() => Promise.resolve(fakeSdk()));
    const s = createLazySentry("dsn", load, vi.fn());
    await Promise.all([s.init(), s.init()]);
    await s.init();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("caps the queue, dropping the oldest", () => {
    const s = createLazySentry("dsn", () => new Promise(() => {}), vi.fn());
    for (let i = 0; i < SENTRY_QUEUE_LIMIT + 5; i++) s.captureMessage(`m${i}`);
    expect(s.pending()).toBe(SENTRY_QUEUE_LIMIT);
  });

  it("goes silent when the SDK fails to load", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const s = createLazySentry("dsn", () => Promise.reject(new Error("blocked")), vi.fn());
    s.captureMessage("before");
    await s.init();
    s.captureMessage("after");
    expect(s.pending()).toBe(0);
    warn.mockRestore();
  });
});
