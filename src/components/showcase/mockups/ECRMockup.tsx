import { useEffect, useState } from "react";

/**
 * Animated Environmental Chain Reaction mockup
 * Shows cascade flow with connected levels lighting up sequentially
 */
const ECRMockup = () => {
  const [activeLevel, setActiveLevel] = useState(0);

  // Cascade through levels
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLevel((prev) => (prev + 1) % 6); // 5 levels + reset
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const levels = [
    { level: 1, title: "Physical", examples: ["High Gravity", "Long Days"], color: "sf-teal" },
    { level: 2, title: "Biological", examples: ["Dense Muscles", "Slow Metabolism"], color: "sf-emerald" },
    { level: 3, title: "Psychological", examples: ["Patience", "Groundedness"], color: "sf-violet" },
    { level: 4, title: "Cultural", examples: ["Monumental Art", "Slow Rituals"], color: "sf-amber" },
    { level: 5, title: "Mythological", examples: ["Earth Deities", "Weight Symbolism"], color: "sf-magenta" },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-sf-void/50 rounded-none p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-xs text-t3 uppercase tracking-wider mb-1">
          Environmental Chain Reaction
        </div>
        <div className="text-sm font-mono text-sf-teal-text">
          Tracing Consequences
        </div>
      </div>

      {/* Cascade visualization */}
      <div className="flex-1 relative">
        {/* Vertical connection line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-sf-teal/50 via-sf-violet/50 to-sf-magenta/50" />

        {/* Levels */}
        <div className="space-y-2">
          {levels.map((item, index) => {
            const isActive = index < activeLevel;
            const isCurrent = index === activeLevel - 1;

            return (
              <div key={item.level} className="flex items-start gap-3 relative">
                {/* Node */}
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-slow z-10 ${
                    isActive ? "" : "border-sf-line bg-sf-surface"
                  }`}
                  style={{
                    borderColor: isActive ? `var(--${item.color})` : undefined,
                    backgroundColor: isActive ? `rgb(var(--${item.color}-rgb) / 0.3)` : undefined,
                    boxShadow: isCurrent ? `0 0 12px rgb(var(--${item.color}-rgb) / 0.5)` : undefined,
                  }}
                />

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-t4">
                      L{item.level}
                    </span>
                    <span
                      className={`text-xs font-medium transition-colors duration-slow ${isActive ? "" : "text-t4"}`}
                      style={{ color: isActive ? `var(--${item.color}-text)` : undefined }}
                    >
                      {item.title}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.examples.map((example) => (
                      <span
                        key={example}
                        className={`text-xs px-2 py-0.5 rounded-none border transition-colors duration-slow ${
                          isActive
                            ? "border-sf-line text-t3"
                            : "border-transparent text-t4"
                        }`}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flow indicator */}
        <div
          className="absolute left-5 w-3 h-3 rounded-full bg-sf-teal/50 blur-sm"
          style={{
            top: `${((activeLevel - 1) / 5) * 100}%`,
            transition: "top 280ms cubic-bezier(0.2, 0, 0, 1)",
            opacity: activeLevel > 0 ? 1 : 0,
          }}
        />
      </div>

      {/* Result badge */}
      <div className="mt-4 flex justify-center">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-none transition-colors duration-slow ${
            activeLevel >= 5
              ? "bg-sf-emerald/10 border border-sf-emerald"
              : "bg-sf-surface border border-sf-line"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-slow ${
              activeLevel >= 5 ? "bg-sf-emerald animate-pulse" : "bg-sf-surface-elevated"
            }`}
          />
          <span
            className={`text-xs uppercase tracking-wider transition-colors duration-slow ${
              activeLevel >= 5 ? "text-sf-emerald-text" : "text-t3"
            }`}
          >
            {activeLevel >= 5 ? "Chain Complete" : "Tracing..."}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ECRMockup;
