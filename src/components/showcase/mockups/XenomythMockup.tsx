import { useEffect, useState } from "react";

/**
 * Animated Xenomythology Framework mockup
 * Shows archetype cards, myth patterns, and connections
 */
const XenomythMockup = () => {
  const [activeCard, setActiveCard] = useState(0);

  // Cycle through archetype cards
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const archetypes = [
    { name: "Creator", symbol: "☀", color: "sf-amber" },
    { name: "Trickster", symbol: "◇", color: "sf-violet" },
    { name: "Guardian", symbol: "◈", color: "sf-cyan" },
    { name: "Shadow", symbol: "◉", color: "sf-crimson" },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-sf-void/50 rounded-lg p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Mythological Framework
        </div>
        <div className="text-sm md:text-base font-display text-sf-violet">
          The Path of Light & Shadow
        </div>
      </div>

      {/* Archetype cards - fanned layout */}
      <div className="flex-1 flex items-center justify-center relative">
        <div className="relative h-24 md:h-32 w-full flex items-center justify-center">
          {archetypes.map((archetype, index) => {
            const isActive = index === activeCard;
            const offset = (index - 1.5) * 20;
            const rotation = (index - 1.5) * 8;

            return (
              <div
                key={archetype.name}
                className={`absolute w-16 md:w-20 h-20 md:h-24 rounded-lg bg-sf-surface border transition-all duration-500 flex flex-col items-center justify-center gap-1 ${
                  isActive
                    ? `border-${archetype.color}/50 shadow-[0_0_20px_rgba(155,93,229,0.3)] scale-110 z-10`
                    : "border-muted/30 opacity-60"
                }`}
                style={{
                  transform: `translateX(${offset}px) rotate(${rotation}deg) ${
                    isActive ? "translateY(-8px)" : ""
                  }`,
                }}
              >
                <span className="text-xl md:text-2xl">{archetype.symbol}</span>
                <span className="text-[10px] text-muted-foreground">
                  {archetype.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Connection lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.3 }}
        >
          <line
            x1="30%"
            y1="50%"
            x2="70%"
            y2="50%"
            stroke="url(#mythGradient)"
            strokeWidth="1"
            strokeDasharray="4 4"
            style={{ animation: "cascade-glow 3s ease-in-out infinite" }}
          />
          <defs>
            <linearGradient id="mythGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--sf-violet)" />
              <stop offset="100%" stopColor="var(--sf-cyan)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Myth pattern preview */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-sf-violet animate-pulse" />
          <span className="text-[10px] text-muted-foreground">
            Creation Myth: The First Light emerged from...
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 bg-sf-cyan"
            style={{ animation: "cascade-glow 3s ease-in-out infinite 0.5s" }}
          />
          <span className="text-[10px] text-muted-foreground">
            Hero's Journey: The chosen must descend into...
          </span>
        </div>
      </div>

      {/* Environmental influence badge */}
      <div className="mt-3 flex justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sf-violet/10 border border-sf-violet/30">
          <span className="text-[10px] text-sf-violet uppercase tracking-wider">
            Derived from High-Gravity World
          </span>
        </div>
      </div>
    </div>
  );
};

export default XenomythMockup;
