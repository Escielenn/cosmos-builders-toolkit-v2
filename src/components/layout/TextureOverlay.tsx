import { useLocation } from "react-router-dom";
import "./texture-overlay.css";

// Simulator routes use canvas/WebGL — texture overlay causes artifacts
const SIMULATOR_ROUTES = ["/rogue", "/tools/tidelock", "/tools/exosky", "/tools/stellar-cartographer"];

const TextureOverlay = () => {
  const { pathname } = useLocation();

  const isSimulator = SIMULATOR_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isSimulator) return null;

  return (
    <div className="sf-texture-overlay" aria-hidden="true">
      <div className="sf-grain" />
      <div className="sf-scanlines" />
    </div>
  );
};

export default TextureOverlay;
