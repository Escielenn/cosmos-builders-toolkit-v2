import { useEffect, useRef } from "react";

/**
 * Observes elements with `.sf-data-burst--typewriter` and triggers the
 * typing animation when they scroll into view. Each element types once,
 * then receives the `.sf-typed` class so the cursor disappears.
 *
 * Call once at the page/layout level, it watches the entire subtree.
 */
export function useTypewriterBurst(containerRef: React.RefObject<HTMLElement | null>) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const container = containerRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            if (!el.classList.contains("sf-typing") && !el.classList.contains("sf-typed")) {
              el.classList.add("sf-typing");
              // After animation completes (~2s), swap to typed state
              setTimeout(() => {
                el.classList.remove("sf-typing");
                el.classList.add("sf-typed");
              }, 2200);
            }
            observerRef.current?.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = container.querySelectorAll(".sf-data-burst--typewriter");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [containerRef]);
}
