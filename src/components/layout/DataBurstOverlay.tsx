import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { DataBurst, LiveDataBurst } from "@/components/ui/data-burst";
import { HEADER_BURSTS, EDGE_BURSTS, RIGHT_EDGE_BURSTS, FOOTER_BURSTS } from "@/lib/data-bursts";
import { useAuth } from "@/contexts/AuthContext";
import { useWorlds } from "@/hooks/use-worlds";
import { useSubscription } from "@/hooks/use-subscription";

// Simulator routes, overlay hidden on these (same as TextureOverlay)
const SIMULATOR_ROUTES = ["/rogue", "/tools/tidelock", "/tools/exosky", "/tools/stellar-cartographer"];

/** Sets --scroll-y on <html> for CSS-driven parallax. Runs once globally. */
function useScrollYProperty() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty(
            "--scroll-y",
            String(window.scrollY)
          );
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

const renderBurst = (b: (typeof HEADER_BURSTS)[number], key: string) =>
  b.animation === "live" ? (
    <LiveDataBurst key={key} content={b.content} position={b.position} variant={b.variant} parallax={b.parallax} />
  ) : (
    <DataBurst key={key} content={b.content} position={b.position} variant={b.variant} animation={b.animation} parallax={b.parallax} />
  );

const DataBurstOverlay = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { data: worlds } = useWorlds();
  const { isSubscribed } = useSubscription();

  useScrollYProperty();

  const isSimulator = SIMULATOR_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isSimulator) return null;

  const worldCount = worlds?.length ?? 0;
  const tier = user ? (isSubscribed ? "PRO" : "FREE") : "ANON";

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {HEADER_BURSTS.map((b, i) => renderBurst(b, `h${i}`))}
      {EDGE_BURSTS.map((b, i) => renderBurst(b, `e${i}`))}
      {RIGHT_EDGE_BURSTS.map((b, i) => renderBurst(b, `r${i}`))}
      {FOOTER_BURSTS.map((b, i) => renderBurst(b, `f${i}`))}
      {user && (
        <DataBurst
          content={`TIER: ${tier} // WORLDS: ${worldCount}`}
          position={{ bottom: "52px", right: "12px" }}
          variant="status"
          animation="breathe"
        />
      )}
    </div>
  );
};

export default DataBurstOverlay;
