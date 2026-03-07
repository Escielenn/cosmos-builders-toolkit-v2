import { createContext, useContext, useState, useCallback } from "react";

interface BadgeContextValue {
  pendingBadgeIds: string[];
  enqueueEarnedBadge: (badgeId: string) => void;
  dismissNext: () => void;
}

const BadgeContext = createContext<BadgeContextValue | null>(null);

export function BadgeProvider({ children }: { children: React.ReactNode }) {
  const [pendingBadgeIds, setPendingBadgeIds] = useState<string[]>([]);

  const enqueueEarnedBadge = useCallback((badgeId: string) => {
    setPendingBadgeIds((prev) =>
      prev.includes(badgeId) ? prev : [...prev, badgeId]
    );
  }, []);

  const dismissNext = useCallback(() => {
    setPendingBadgeIds((prev) => prev.slice(1));
  }, []);

  return (
    <BadgeContext.Provider
      value={{ pendingBadgeIds, enqueueEarnedBadge, dismissNext }}
    >
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadgeContext() {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error("useBadgeContext must be used within BadgeProvider");
  return ctx;
}
