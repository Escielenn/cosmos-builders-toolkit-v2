import { beforeEach, describe, expect, it, vi } from "vitest";

const { ORIGIN, createSignedUrls, copy, from } = vi.hoisted(() => {
  const ORIGIN = "https://proj.supabase.co";
  const createSignedUrls = vi.fn();
  const copy = vi.fn();
  const from = vi.fn((bucket: string) => ({
    createSignedUrls: (paths: string[], ttl: number) => createSignedUrls(bucket, paths, ttl),
    copy: (a: string, b: string, o: unknown) => copy(bucket, a, b, o),
    getPublicUrl: (path: string) => ({
      data: { publicUrl: `${ORIGIN}/storage/v1/object/public/${bucket}/${path}` },
    }),
  }));
  return { ORIGIN, createSignedUrls, copy, from };
});

vi.mock("@/integrations/supabase/client", () => ({ supabase: { storage: { from } } }));

import {
  SIGNED_URL_TTL_SECONDS,
  clearSignedUrlCache,
  isPrivateBucket,
  mapSheetPath,
  parseStorageUrl,
  privateObjectFromUrl,
  promoteToPublicHeader,
  signStorageObject,
} from "../storage-urls";

const pub = (bucket: string, path: string) => `${ORIGIN}/storage/v1/object/public/${bucket}/${path}`;

describe("parseStorageUrl", () => {
  it("reads bucket and path from a legacy public URL", () => {
    expect(parseStorageUrl(pub("moodboard-images", "u1/ws1/a.png"), ORIGIN)).toEqual({
      bucket: "moodboard-images",
      path: "u1/ws1/a.png",
    });
  });

  it("reads signed, authenticated and render URLs", () => {
    expect(
      parseStorageUrl(`${ORIGIN}/storage/v1/object/sign/audio-tracks/u1/t.mp3?token=abc`, ORIGIN),
    ).toEqual({ bucket: "audio-tracks", path: "u1/t.mp3" });
    expect(
      parseStorageUrl(`${ORIGIN}/storage/v1/object/authenticated/map-sheets/u/w/e-1.png`, ORIGIN),
    ).toEqual({ bucket: "map-sheets", path: "u/w/e-1.png" });
    expect(
      parseStorageUrl(`${ORIGIN}/storage/v1/render/image/public/world-headers/u/x.jpg?width=200`, ORIGIN),
    ).toEqual({ bucket: "world-headers", path: "u/x.jpg" });
  });

  it("decodes percent-encoded path segments", () => {
    expect(parseStorageUrl(pub("moodboard-images", "u1/ws1/my%20map.png"), ORIGIN)?.path).toBe(
      "u1/ws1/my map.png",
    );
  });

  it("ignores other hosts, non-storage URLs and junk", () => {
    expect(parseStorageUrl("https://other.supabase.co/storage/v1/object/public/moodboard-images/a/b.png", ORIGIN)).toBeNull();
    expect(parseStorageUrl("https://example.com/cat.png", ORIGIN)).toBeNull();
    expect(parseStorageUrl("not a url", ORIGIN)).toBeNull();
    expect(parseStorageUrl(null, ORIGIN)).toBeNull();
    expect(parseStorageUrl(`${ORIGIN}/storage/v1/object/public/moodboard-images/`, ORIGIN)).toBeNull();
  });

  it("skips the host check when no origin is configured", () => {
    expect(parseStorageUrl("https://any.host/storage/v1/object/public/avatars/u/a.png", null)).toEqual({
      bucket: "avatars",
      path: "u/a.png",
    });
  });
});

describe("private buckets", () => {
  it("knows which buckets are private", () => {
    expect(isPrivateBucket("moodboard-images")).toBe(true);
    expect(isPrivateBucket("audio-tracks")).toBe(true);
    expect(isPrivateBucket("map-sheets")).toBe(true);
    expect(isPrivateBucket("avatars")).toBe(false);
    expect(isPrivateBucket("world-headers")).toBe(false);
  });

  it("treats public-bucket URLs as loadable as-is", () => {
    expect(privateObjectFromUrl(pub("world-headers", "u/map-sheets/e-1.png"), ORIGIN)).toBeNull();
    expect(privateObjectFromUrl(pub("map-sheets", "u/w/e-1.png"), ORIGIN)).toEqual({
      bucket: "map-sheets",
      path: "u/w/e-1.png",
    });
  });
});

describe("mapSheetPath", () => {
  it("keys on user then world, so owner and world-reader policies can match", () => {
    expect(mapSheetPath("u1", "w1", "e1", "PNG", 42)).toBe("u1/w1/e1-42.png");
    expect(mapSheetPath("u1", "w1", "e1", ".j/p?g", 42)).toBe("u1/w1/e1-42.jpg");
    expect(mapSheetPath("u1", "w1", "e1", "", 42)).toBe("u1/w1/e1-42.png");
  });
});

describe("signStorageObject", () => {
  beforeEach(() => {
    clearSignedUrlCache();
    createSignedUrls.mockReset();
  });

  it("batches same-tick requests per bucket and caches the result", async () => {
    createSignedUrls.mockImplementation(async (_b: string, paths: string[]) => ({
      data: paths.map((p) => ({ path: p, signedUrl: `signed:${p}`, error: null })),
      error: null,
    }));

    const [a, b] = await Promise.all([
      signStorageObject("moodboard-images", "u/1.png"),
      signStorageObject("moodboard-images", "u/2.png"),
    ]);
    expect(a).toBe("signed:u/1.png");
    expect(b).toBe("signed:u/2.png");
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls).toHaveBeenCalledWith("moodboard-images", ["u/1.png", "u/2.png"], SIGNED_URL_TTL_SECONDS);

    await signStorageObject("moodboard-images", "u/1.png");
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
  });

  it("rejects only the paths that could not be signed", async () => {
    createSignedUrls.mockResolvedValue({
      data: [
        { path: "u/ok.png", signedUrl: "signed:ok", error: null },
        { path: "u/gone.png", signedUrl: null, error: "Object not found" },
      ],
      error: null,
    });
    const ok = signStorageObject("map-sheets", "u/ok.png");
    const gone = signStorageObject("map-sheets", "u/gone.png");
    await expect(ok).resolves.toBe("signed:ok");
    await expect(gone).rejects.toThrow("ACCESS DENIED");
  });

  it("rejects every waiter when the request fails", async () => {
    createSignedUrls.mockResolvedValue({ data: null, error: new Error("boom") });
    await expect(signStorageObject("audio-tracks", "u/t.mp3")).rejects.toThrow("boom");
  });
});

describe("promoteToPublicHeader", () => {
  beforeEach(() => copy.mockReset());

  it("copies a private object into world-headers and returns its public URL", async () => {
    copy.mockResolvedValue({ data: { path: "x" }, error: null });
    vi.stubEnv("VITE_SUPABASE_URL", ORIGIN);
    const out = await promoteToPublicHeader(pub("moodboard-images", "u1/ws/a.png"), "u1");
    vi.unstubAllEnvs();
    expect(copy).toHaveBeenCalledTimes(1);
    const [bucket, fromPath, toPath, opts] = copy.mock.calls[0];
    expect(bucket).toBe("moodboard-images");
    expect(fromPath).toBe("u1/ws/a.png");
    expect(toPath).toMatch(/^u1\/from-moodboard-images-\d+-a\.png$/);
    expect(opts).toEqual({ destinationBucket: "world-headers" });
    expect(out).toBe(pub("world-headers", toPath));
  });

  it("returns public and external URLs unchanged", async () => {
    const ext = "https://example.com/cat.png";
    expect(await promoteToPublicHeader(ext, "u1")).toBe(ext);
    expect(copy).not.toHaveBeenCalled();
  });
});
