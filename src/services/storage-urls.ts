// ---------------------------------------------------------------------------
// Storage URLs: one place that knows which buckets are private and how a
// stored URL becomes something a browser can load.
//
// Tier 0 privacy (migration 20261018_private_storage_buckets.sql):
//   PUBLIC   avatars, world-headers           stored URL loads as-is
//   PRIVATE  moodboard-images, audio-tracks,  stored URL is resolved to a
//            map-sheets                       1-hour signed URL on display
//
// Rows keep storing the public-URL form (getPublicUrl), which encodes bucket
// and object path. Rows written before the buckets went private hold exactly
// that form, so old data and new data resolve through the same parser.
//
// Components never call supabase.storage directly for these buckets; they use
// this module or the hooks in src/hooks/use-storage-url.ts.
// ---------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";

export const PRIVATE_BUCKETS = ["moodboard-images", "audio-tracks", "map-sheets"] as const;
export type PrivateBucket = (typeof PRIVATE_BUCKETS)[number];

export const MAP_SHEET_BUCKET: PrivateBucket = "map-sheets";
export const WORLD_HEADER_BUCKET = "world-headers";

/** Signed URLs live this long. */
export const SIGNED_URL_TTL_SECONDS = 60 * 60;
/** Re-sign this long before a cached URL expires, so a page never holds a dead one. */
export const SIGNED_URL_REFRESH_MARGIN_MS = 5 * 60 * 1000;

export interface StorageObjectRef {
  bucket: string;
  path: string;
}

export interface PrivateObjectRef {
  bucket: PrivateBucket;
  path: string;
}

// ── Parsing ─────────────────────────────────────────────────────────────────

// /storage/v1/object/{public|sign|authenticated}/<bucket>/<path>
// /storage/v1/render/image/{public|sign|authenticated}/<bucket>/<path>
const OBJECT_ROUTE =
  /\/storage\/v1\/(?:object|render\/image)\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/;

function configuredOrigin(): string | null {
  const raw = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

/**
 * The bucket and object path a Supabase storage URL points at, or null.
 *
 * `origin` restricts parsing to this project's storage host, so an external
 * image URL that happens to share the route shape (a moodboard "add by URL"
 * pointing at another Supabase project) is never re-signed against ours.
 * Pass null to skip the host check.
 */
export function parseStorageUrl(
  url: string | null | undefined,
  origin: string | null = configuredOrigin(),
): StorageObjectRef | null {
  if (!url || typeof url !== "string") return null;
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (origin && parsed.origin !== origin) return null;
  const match = parsed.pathname.match(OBJECT_ROUTE);
  if (!match) return null;
  try {
    const bucket = decodeURIComponent(match[1]);
    const path = match[2]
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
    if (!bucket || !path) return null;
    return { bucket, path };
  } catch {
    return null;
  }
}

export function isPrivateBucket(bucket: string): bucket is PrivateBucket {
  return (PRIVATE_BUCKETS as readonly string[]).includes(bucket);
}

/** The private object a stored URL refers to, or null for anything loadable as-is. */
export function privateObjectFromUrl(
  url: string | null | undefined,
  origin: string | null = configuredOrigin(),
): PrivateObjectRef | null {
  const ref = parseStorageUrl(url, origin);
  if (!ref || !isPrivateBucket(ref.bucket)) return null;
  return { bucket: ref.bucket, path: ref.path };
}

/** True when the URL must be signed before a browser can load it. */
export function needsSigning(url: string | null | undefined): boolean {
  return privateObjectFromUrl(url) !== null;
}

/**
 * The value persisted for an object: its public-URL form. For a private
 * bucket this URL does not load by itself; it is an address that
 * resolveStorageUrl() turns into a signed URL.
 */
export function storedObjectUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

// ── Paths ───────────────────────────────────────────────────────────────────

function cleanExt(ext: string | null | undefined, fallback: string): string {
  return (ext || fallback).toLowerCase().replace(/[^a-z0-9]/g, "") || fallback;
}

/** map-sheets/<user_id>/<world_id>/<entity_id>-<ts>.<ext> (owner + world-reader policies key on segments 1 and 2). */
export function mapSheetPath(
  userId: string,
  worldId: string,
  entityId: string,
  ext: string,
  now: number = Date.now(),
): string {
  return `${userId}/${worldId}/${entityId}-${now}.${cleanExt(ext, "png")}`;
}

// ── Signing (cached, batched) ───────────────────────────────────────────────

interface CacheEntry {
  url: string;
  expiresAt: number;
}

interface Waiter {
  resolve: (url: string) => void;
  reject: (err: Error) => void;
}

const cache = new Map<string, CacheEntry>();
const queued = new Map<PrivateBucket, Map<string, Waiter[]>>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const cacheKey = (bucket: string, path: string) => `${bucket}/${path}`;

function cached(bucket: string, path: string, now = Date.now()): string | null {
  const hit = cache.get(cacheKey(bucket, path));
  if (!hit) return null;
  if (hit.expiresAt - SIGNED_URL_REFRESH_MARGIN_MS <= now) {
    cache.delete(cacheKey(bucket, path));
    return null;
  }
  return hit.url;
}

async function flush(): Promise<void> {
  flushTimer = null;
  const batches = Array.from(queued.entries());
  queued.clear();

  await Promise.all(
    batches.map(async ([bucket, byPath]) => {
      const paths = Array.from(byPath.keys());
      const fail = (err: Error) => {
        for (const waiters of byPath.values()) waiters.forEach((w) => w.reject(err));
      };
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
        if (error) throw error;
        const issuedAt = Date.now();
        const byResult = new Map<string, string>();
        for (const row of data ?? []) {
          if (row.path && row.signedUrl && !row.error) byResult.set(row.path, row.signedUrl);
        }
        for (const [path, waiters] of byPath) {
          const signed = byResult.get(path);
          if (signed) {
            cache.set(cacheKey(bucket, path), {
              url: signed,
              expiresAt: issuedAt + SIGNED_URL_TTL_SECONDS * 1000,
            });
            waiters.forEach((w) => w.resolve(signed));
          } else {
            const err = new Error("FILE NOT ON RECORD OR ACCESS DENIED.");
            waiters.forEach((w) => w.reject(err));
          }
        }
      } catch (err) {
        fail(err instanceof Error ? err : new Error(String(err)));
      }
    }),
  );
}

/**
 * A signed URL for one private object. Calls made in the same tick are sent
 * as one createSignedUrls request per bucket; results are cached until five
 * minutes before they expire.
 */
export function signStorageObject(bucket: PrivateBucket, path: string): Promise<string> {
  const hit = cached(bucket, path);
  if (hit) return Promise.resolve(hit);

  return new Promise<string>((resolve, reject) => {
    let byPath = queued.get(bucket);
    if (!byPath) {
      byPath = new Map();
      queued.set(bucket, byPath);
    }
    const waiters = byPath.get(path) ?? [];
    waiters.push({ resolve, reject });
    byPath.set(path, waiters);
    if (!flushTimer) flushTimer = setTimeout(() => void flush(), 0);
  });
}

/**
 * What a browser should load for a stored URL. Private-bucket objects become
 * signed URLs; public-bucket URLs, external URLs and data/blob URLs pass
 * through unchanged.
 */
export async function resolveStorageUrl(url: string): Promise<string> {
  const ref = privateObjectFromUrl(url);
  if (!ref) return url;
  return signStorageObject(ref.bucket, ref.path);
}

/** Drop every cached signed URL (sign-out, tests). */
export function clearSignedUrlCache(): void {
  cache.clear();
}

// ── Writes ──────────────────────────────────────────────────────────────────

/** Upload into a bucket and return the value to persist (storedObjectUrl). */
export async function uploadStorageObject(
  bucket: string,
  path: string,
  body: Blob | File,
  options: { contentType?: string; upsert?: boolean; cacheControl?: string } = {},
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, body, options);
  if (error) throw error;
  return storedObjectUrl(bucket, path);
}

/** Remove the objects behind stored URLs. URLs that are not ours are skipped. */
export async function removeStoredObjects(urls: string[]): Promise<void> {
  const byBucket = new Map<string, string[]>();
  for (const url of urls) {
    const ref = parseStorageUrl(url);
    if (!ref) continue;
    byBucket.set(ref.bucket, [...(byBucket.get(ref.bucket) ?? []), ref.path]);
    cache.delete(cacheKey(ref.bucket, ref.path));
  }
  for (const [bucket, paths] of byBucket) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
  }
}

/** File a map sheet in the private map-sheets bucket. Returns the value for metadata.map_sheet_url. */
export async function uploadMapSheet(input: {
  userId: string;
  worldId: string;
  entityId: string;
  body: Blob | File;
  ext: string;
  contentType?: string;
}): Promise<string> {
  const path = mapSheetPath(input.userId, input.worldId, input.entityId, input.ext);
  return uploadStorageObject(MAP_SHEET_BUCKET, path, input.body, {
    contentType: input.contentType || input.body.type || undefined,
  });
}

/**
 * A world header has to load for signed-out viewers (shared links, community
 * cards), so it must live in the public world-headers bucket. When the writer
 * picks a header from a PRIVATE bucket (a moodboard image), copy the object
 * into world-headers and return the new public URL. Anything else is returned
 * unchanged.
 */
export async function promoteToPublicHeader(url: string, userId: string): Promise<string> {
  const ref = privateObjectFromUrl(url);
  if (!ref) return url;
  const name = ref.path.split("/").pop() || `${Date.now()}`;
  const dest = `${userId}/from-${ref.bucket}-${Date.now()}-${name}`;
  const { error } = await supabase.storage
    .from(ref.bucket)
    .copy(ref.path, dest, { destinationBucket: WORLD_HEADER_BUCKET });
  if (error) throw error;
  return storedObjectUrl(WORLD_HEADER_BUCKET, dest);
}
