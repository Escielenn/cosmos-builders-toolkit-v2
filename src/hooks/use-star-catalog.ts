// ---------------------------------------------------------------------------
// The star catalogue, loaded once (G4).
//
// public/exosky-stars.json is 178 named Hipparcos stars, already shipped for
// ExoSky. One star list for the whole app: a second catalogue of real stars
// would be exactly the Parallel Truth the Constitution names, and the two
// would drift the first time either was corrected.
//
// Fetched lazily — the galaxy view is one view of one space, and the other
// three should not pay for it.
// ---------------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import { parseCatalog, type CatalogStar } from "@/gl/bind/starfield";

export function useStarCatalog(enabled = true) {
  return useQuery<CatalogStar[]>({
    queryKey: ["star-catalog"],
    queryFn: async () => {
      const res = await fetch("/exosky-stars.json");
      if (!res.ok) throw new Error(`Catalogue unavailable (${res.status})`);
      return parseCatalog(await res.json());
    },
    enabled,
    // The sky does not change. Cache it for the session.
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
