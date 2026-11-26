import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { useLocation, Link } from "react-router-dom";
import { BookOpen, HelpCircle, Compass, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { isManuscriptPath } from "@/lib/manuscript-path";

/**
 * Window events the header's Help menu fires so the panels FABStack owns
 * (Field Manual sheet, contact dialog) open without a second copy.
 */
export const OPEN_FIELD_MANUAL_EVENT = "sf:open-field-manual";
export const OPEN_CONTACT_EVENT = "sf:open-contact";

// Both panels are on every page but rarely opened; the contact forms carry
// zod + react-hook-form. Loaded on first open, then kept mounted so the
// close transition still plays.
const FieldManualSheet = lazy(() => import("../onboarding/FieldManualSheet"));
const ContactDialog = lazy(() => import("../contact/ContactDialog"));

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
  const [fieldManualMounted, setFieldManualMounted] = useState(false);
  const [contactMounted, setContactMounted] = useState(false);
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

  // The header's Help menu opens the same panels.
  useEffect(() => {
    const openManual = () => {
      setFieldManualMounted(true);
      setFieldManualOpen(true);
    };
    const openContact = () => {
      setContactMounted(true);
      setContactOpen(true);
    };
    window.addEventListener(OPEN_FIELD_MANUAL_EVENT, openManual);
    window.addEventListener(OPEN_CONTACT_EVENT, openContact);
    return () => {
      window.removeEventListener(OPEN_FIELD_MANUAL_EVENT, openManual);
      window.removeEventListener(OPEN_CONTACT_EVENT, openContact);
    };
  }, []);

  // Audio offset for non-simulator pages
  const audioOffset = !isSimulator && audioVisible
    ? audioMinimized ? "bottom-[76px]" : "bottom-[100px]"
    : "";

  const showGuide = user && pathname !== "/auth" && !pathname.startsWith("/guide") && pathname !== "/getting-started";

  // Where the floating button may render (1.6 ambient budget, finding 8):
  // only where there is a free gutter beside the content. That is xl+ on
  // standalone pages and on simulator canvases. Inside a world (Bridge,
  // Codex, Instruments, in-world tools) and on the Manuscript the button sat
  // on content and on the editor's status bar, so it is not rendered there;
  // below xl it sat on content on every page. Help stays one click away in
  // the header (profile menu, phone menu), which opens these same panels.
  const inWorld = /^\/worlds\/[^/]+/.test(pathname);
  // Tool pages and simulators carry their own fixed right rail (sections,
  // readouts, the Pro clearance card) and the button landed on it.
  const onToolPage = pathname.startsWith("/tools/") || pathname.startsWith("/rogue");
  const showButton =
    pathname !== "/auth" && !inWorld && !onToolPage && !isManuscriptPath(pathname);

  // Position: simulators → bottom-right past narrative bridge tab; with the
  // audio player → above its bar; otherwise 16px above whatever bottom
  // chrome the page declares in --sf-bottom-chrome (the telemetry bar sets
  // it to 24px while it shows; the Manuscript sets its status bar height).
  const positionClass = isSimulator
    ? "bottom-4 right-12"
    : `${audioOffset} right-4`;
  const positionStyle =
    !isSimulator && !audioOffset ? { bottom: "calc(var(--sf-bottom-chrome, 0px) + 16px)" } : undefined;

  return (
    <>
      {showButton && (
      <div
        ref={menuRef}
        className={`fixed z-40 no-print hidden xl:block ${positionClass}`}
        style={positionStyle}
      >
        {/* Expanded menu items */}
        <div
          className={`flex flex-col gap-1.5 mb-2 transition-all duration-base ease-sf-out ${
            helpOpen
              ? "visible opacity-100 translate-y-0 pointer-events-auto"
              : "invisible opacity-0 translate-y-2 pointer-events-none"
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
                setFieldManualMounted(true);
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
              setContactMounted(true);
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
      )}

      <Suspense fallback={null}>
        {fieldManualMounted && (
          <FieldManualSheet open={fieldManualOpen} onOpenChange={setFieldManualOpen} />
        )}
        {contactMounted && <ContactDialog open={contactOpen} onOpenChange={setContactOpen} />}
      </Suspense>
    </>
  );
};

export default FABStack;
