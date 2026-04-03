import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { BookOpen, HelpCircle, Compass, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import FieldManualSheet from "../onboarding/FieldManualSheet";
import ContactDialog from "../contact/ContactDialog";

const SIMULATOR_ROUTES = [
  "/rogue",
  "/tools/tidelock",
  "/tools/exosky",
  "/tools/exoforge",
  "/tools/solaris",
  "/tools/stellar-cartographer",
];

const FABStack = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { hasEverLoaded: audioVisible, minimized: audioMinimized } = useAudioPlayer();
  const [helpOpen, setHelpOpen] = useState(false);
  const [fieldManualOpen, setFieldManualOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSimulator = SIMULATOR_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  // Close help menu when clicking outside
  useEffect(() => {
    if (!helpOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [helpOpen]);

  // Close help menu on route change
  useEffect(() => {
    setHelpOpen(false);
  }, [pathname]);

  // Audio offset for non-simulator pages
  const audioOffset = !isSimulator && audioVisible
    ? audioMinimized ? "bottom-[76px]" : "bottom-[100px]"
    : "";

  const showGuide = user && pathname !== "/auth" && !pathname.startsWith("/guide") && pathname !== "/getting-started";

  // Hide on auth page
  if (pathname === "/auth") return null;

  // Position: simulators → right of sidebar, otherwise → bottom-right
  const positionClass = isSimulator
    ? "bottom-4 left-[280px]"
    : `${audioOffset || "bottom-6"} right-4`;

  return (
    <>
      <div
        ref={menuRef}
        className={`fixed z-40 no-print ${positionClass}`}
      >
        {/* Expanded menu items */}
        <div
          className={`flex flex-col gap-1.5 mb-2 transition-all duration-200 ${
            helpOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          {showGuide && (
            <Link
              to="/guide"
              className="sf-fab-menu-item"
              onClick={() => setHelpOpen(false)}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>GUIDE</span>
            </Link>
          )}
          {user && (
            <button
              type="button"
              className="sf-fab-menu-item"
              onClick={() => {
                setFieldManualOpen(true);
                setHelpOpen(false);
              }}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>FIELD MANUAL</span>
            </button>
          )}
          <button
            type="button"
            className="sf-fab-menu-item"
            onClick={() => {
              setContactOpen(true);
              setHelpOpen(false);
            }}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>OPEN CHANNEL</span>
          </button>
        </div>

        {/* Help trigger button */}
        <button
          type="button"
          onClick={() => setHelpOpen((v) => !v)}
          className={`sf-fab-help-trigger ${helpOpen ? "active" : ""}`}
          aria-label="Help menu"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      <FieldManualSheet open={fieldManualOpen} onOpenChange={setFieldManualOpen} />
      <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />
    </>
  );
};

export default FABStack;
