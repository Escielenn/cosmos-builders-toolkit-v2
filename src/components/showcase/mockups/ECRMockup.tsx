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
    { level: 1, title: "Physical", examples: ["High Gravity", "Long Days"], color: "sf-cyan" },
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
        <div className="text-sm font-mono text-sf-cyan">
          Tracing Consequences
        </div>
      </div>

      {/* Cascade visualization */}
      <div className="flex-1 relative">
        {/* Vertical connection line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-sf-cyan/50 via-sf-violet/50 to-sf-magenta/50" />

        {/* Levels */}
        <div className="space-y-2">
          {levels.map((item, index) => {
            const isActive = index < activeLevel;
            const isCurrent = index === activeLevel - 1;

            return (
              <div key={item.level} className="flex items-start gap-3 relative">
                {/* Node */}
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-all duration-300 z-10 ${
                    isActive
                      ? `border-${item.color} bg-${item.color}/30`
                      : "border-muted/30 bg-sf-surface"
                  }`}
                  style={{
                    borderColor: isActive ? `hsl(var(--${item.color}))` : undefined,
                    backgroundColor: isActive ? `hsl(var(--${item.color}) / 0.3)` : undefined,
                    boxShadow: isCurrent ? `0 0 12px hsl(var(--${item.color}) / 0.5)` : undefined,
                  }}
                />

                {/* Content */}
                <div
                  className={`flex-1 transition-all duration-300 ${
                    isActive ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-t3">
                      L{item.level}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: isActive ? `hsl(var(--${item.color}))` : undefined }}
                    >
                      {item.title}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.examples.map((example) => (
                      <span
                        key={example}
                        className={`text-[8px] px-1.5 py-0.5 rounded border transition-all duration-300 ${
                          isActive
                            ? "border-muted/30 text-t3"
                            : "border-transparent text-t3 opacity-60"
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
          className="absolute left-5 w-3 h-3 rounded-full bg-sf-cyan/50 blur-sm"
          style={{
            top: `${((activeLevel - 1) / 5) * 100}%`,
            transition: "top 0.3s ease-out",
            opacity: activeLevel > 0 ? 1 : 0,
          }}
        />
      </div>

      {/* Result badge */}
      <div className="mt-4 flex justify-center">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-500 ${
            activeLevel >= 5
              ? "bg-sf-emerald/10 border border-sf-emerald/30"
              : "bg-sf-surface border border-muted/20"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              activeLevel >= 5 ? "bg-sf-emerald animate-pulse" : "bg-muted/30"
            }`}
          />
          <span
            className={`text-[10px] uppercase tracking-wider transition-colors duration-500 ${
              activeLevel >= 5 ? "text-sf-emerald" : "text-t3"
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
