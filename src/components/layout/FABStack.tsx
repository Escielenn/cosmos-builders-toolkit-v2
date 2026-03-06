import { useLocation, Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import ContactFAB from "../contact/ContactFAB";
import FieldManualFAB from "../onboarding/FieldManualFAB";

const SIMULATOR_ROUTES = ["/rogue", "/tools/tidelock", "/tools/exosky", "/tools/exoforge"];

const FABStack = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { hasEverLoaded: audioVisible, minimized: audioMinimized } = useAudioPlayer();
  const isSimulator = SIMULATOR_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // Audio player sits above the 24px status bar; adjust FABs to clear it
  const audioOffset = !isSimulator && audioVisible
    ? audioMinimized ? "bottom-[76px]" : "bottom-[100px]"
    : "";

  return (
    <div
      className={`fixed z-40 flex flex-col gap-2 no-print ${
        isSimulator ? "bottom-24 right-4" : `${audioOffset || "bottom-8"} left-4`
      }`}
    >
      {user && pathname !== "/auth" && !pathname.startsWith("/guide") && pathname !== "/getting-started" && (
        <Link to="/guide" className="sf-comm-button shadow-lg">
          <BookOpen className="w-4 h-4" />
          <span>GUIDE</span>
        </Link>
      )}
      <FieldManualFAB />
      <ContactFAB />
    </div>
  );
};

export default FABStack;
