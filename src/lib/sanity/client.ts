import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import type { SanityClient } from "@sanity/client";

// Sanity is used only by the blog / Learn surfaces and the prompt of the day.
// @sanity/client is loaded on first fetch so it stays off the initial load.
// The image-URL builder is tiny and synchronous, so it takes the project
// config directly rather than a client instance.
const SANITY_CONFIG = {
  projectId: "74gy5txg",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: true, // Enable CDN for faster reads (use false for real-time data)
} as const;

let clientPromise: Promise<SanityClient> | null = null;

export function getSanityClient(): Promise<SanityClient> {
  if (!clientPromise) {
    clientPromise = import("@sanity/client")
      .then(({ createClient }) => createClient(SANITY_CONFIG))
      .catch((err) => {
        clientPromise = null; // allow a retry after a failed chunk load
        throw err;
      });
  }
  return clientPromise;
}

export async function sanityFetch<T>(query: string, params?: Record<string, unknown>): Promise<T> {
  const client = await getSanityClient();
  return params ? client.fetch<T>(query, params) : client.fetch<T>(query);
}

// Image URL builder: takes the project config directly, no client instance.
const builder = createImageUrlBuilder({ projectId: SANITY_CONFIG.projectId, dataset: SANITY_CONFIG.dataset });

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
