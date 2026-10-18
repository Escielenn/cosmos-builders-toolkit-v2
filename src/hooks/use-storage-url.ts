// ---------------------------------------------------------------------------
// Display URLs for stored files. Private-bucket objects (moodboard images,
// audio tracks, map sheets) resolve to cached signed URLs; everything else
// passes through. See src/services/storage-urls.ts.
// ---------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import {
  SIGNED_URL_REFRESH_MARGIN_MS,
  SIGNED_URL_TTL_SECONDS,
  needsSigning,
  resolveStorageUrl,
} from "@/services/storage-urls";

const STALE_MS = SIGNED_URL_TTL_SECONDS * 1000 - SIGNED_URL_REFRESH_MARGIN_MS;

export const storageUrlKey = (url: string) => ["storage-url", url] as const;

function queryOptions(url: string) {
  return {
    queryKey: storageUrlKey(url),
    queryFn: () => resolveStorageUrl(url),
    staleTime: STALE_MS,
    gcTime: SIGNED_URL_TTL_SECONDS * 1000,
    refetchInterval: STALE_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  };
}

export interface StorageUrlState {
  /** Loadable URL, or null while a signed URL is being fetched or when none could be made. */
  url: string | null;
  isLoading: boolean;
  isError: boolean;
}

/** The loadable URL for one stored URL. */
export function useStorageUrl(stored: string | null | undefined): StorageUrlState {
  const signing = !!stored && needsSigning(stored);
  const query = useQuery({
    ...queryOptions(stored ?? ""),
    enabled: signing,
  });

  if (!stored) return { url: null, isLoading: false, isError: false };
  if (!signing) return { url: stored, isLoading: false, isError: false };
  return {
    url: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
