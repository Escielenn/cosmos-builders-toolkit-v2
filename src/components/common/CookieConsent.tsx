import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "sf-cookie-consent";

type ConsentValue = "accepted" | "declined";

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Slight delay for better UX (don't flash immediately on page load)
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (value: ConsentValue) => {
    localStorage.setItem(CONSENT_KEY, value);
    setShowBanner(false);

    if (value === "declined") {
      // Clear any non-essential cookies/storage here
      // Currently only functional cookies are used (sidebar state, auth)
      // so minimal action needed - but this is where you'd clear analytics, etc.

      // Clear sidebar state preference as it's not strictly essential
      document.cookie = "sidebar:state=; path=/; max-age=0";
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-300">
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-none p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-sf-border bg-sf-surface/95 backdrop-blur-xl shadow-2xl">
          <Cookie className="w-8 h-8 text-primary flex-shrink-0 hidden sm:block" />

          <div className="flex-1">
            <h3 className="font-medium text-sm text-t1 mb-1">Cookie Notice</h3>
            <p className="text-xs text-t3 leading-relaxed">
              Essential cookies required for authentication and session management.
              No tracking cookies deployed. No third-party data sharing.{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConsent("declined")}
              className="flex-1 sm:flex-none"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={() => handleConsent("accepted")}
              className="flex-1 sm:flex-none"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to check cookie consent status
 * Returns: "accepted" | "declined" | null (not yet decided)
 */
export const useCookieConsent = (): ConsentValue | null => {
  const [consent, setConsent] = useState<ConsentValue | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
    setConsent(stored);
  }, []);

  return consent;
};

export default CookieConsent;
