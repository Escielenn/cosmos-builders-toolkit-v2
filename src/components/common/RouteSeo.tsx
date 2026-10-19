import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyRouteSeo } from "@/hooks/use-meta-tags";

/**
 * Per-route canonical link, og:url and robots directive. Mounted once inside
 * the router; the policy itself lives in src/lib/seo/routes.ts.
 */
const RouteSeo = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    applyRouteSeo(pathname);
  }, [pathname]);

  return null;
};

export default RouteSeo;
