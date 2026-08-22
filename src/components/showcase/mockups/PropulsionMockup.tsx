import { useEffect, useState } from "react";

/**
 * Animated Propulsion Consequences Map mockup
 * Shows propulsion type cycling and connected consequence nodes
 */
const PropulsionMockup = () => {
  const [activeType, setActiveType] = useState(0);
  const [visibleConsequences, setVisibleConsequences] = useState<number[]>([]);

  const propulsionTypes = [
    { name: "Fusion Torch", speed: "0.1c", color: "sf-amber" },
    { name: "Alcubierre", speed: "FTL", color: "sf-cyan" },
    { name: "Generation Ship", speed: "0.01c", color: "sf-emerald" },
  ];

  const consequences = {
    0: [
      { domain: "Economic", effect: "Rare fuel monopolies" },
      { domain: "Political", effect: "Colony independence" },
      { domain: "Social", effect: "Space-born generations" },
    ],
    1: [
      { domain: "Economic", effect: "Instant trade networks" },
      { domain: "Political", effect: "Central authority" },
      { domain: "Social", effect: "Cultural homogenization" },
    ],
    2: [
      { domain: "Economic", effect: "Ship-based economy" },
      { domain: "Political", effect: "Isolated governance" },
      { domain: "Social", effect: "Unique cultures" },
    ],
  };

  // Cycle through propulsion types
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveType((prev) => (prev + 1) % 3);
      setVisibleConsequences([]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Stagger consequence reveals
  useEffect(() => {
    setVisibleConsequences([]);

    const timers = [0, 1, 2].map((index) =>
      setTimeout(() => {
        setVisibleConsequences((prev) => [...prev, index]);
      }, 500 + index * 400)
    );

    return () => timers.forEach(clearTimeout);
  }, [activeType]);

  const currentConsequences = consequences[activeType as keyof typeof consequences] || [];

  return (
    <div className="w-full h-full flex flex-col bg-sf-void/50 rounded-none p-4 md:p-6">
      {/* Propulsion selector */}
      <div className="flex gap-2 mb-4">
        {propulsionTypes.map((type, index) => (
          <button
            key={type.name}
            className={`flex-1 px-2 py-1.5 rounded-none border text-[12px] transition-all duration-300 ${
              index === activeType
                ? `border-${type.color}/50 bg-${type.color}/10`
                : "border-muted bg-transparent opacity-50"
            }`}
            style={{
              borderColor:
                index === activeType
                  ? `hsl(var(--${type.color}) / 0.5)`
                  : undefined,
              backgroundColor:
                index === activeType
                  ? `hsl(var(--${type.color}) / 0.1)`
                  : undefined,
            }}
          >
            <div
              className="font-medium truncate"
              style={{
                color:
                  index === activeType
                    ? `hsl(var(--${type.color}))`
                    : undefined,
              }}
            >
              {type.name}
            </div>
            <div className="text-[12px] text-t3">{type.speed}</div>
          </button>
        ))}
      </div>

      {/* Central node and connections */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Central propulsion node */}
        <div
          className="w-16 h-16 border-2 flex items-center justify-center z-10 transition-all duration-500"
          style={{
            borderColor: `hsl(var(--${propulsionTypes[activeType].color}))`,
            backgroundColor: `hsl(var(--${propulsionTypes[activeType].color}) / 0.1)`,
            boxShadow: `0 0 30px hsl(var(--${propulsionTypes[activeType].color}) / 0.3)`,
          }}
        >
          <div className="text-center">
            <div className="text-lg">🚀</div>
            <div
              className="text-[12px] font-mono"
              style={{ color: `hsl(var(--${propulsionTypes[activeType].color}))` }}
            >
              {propulsionTypes[activeType].speed}
            </div>
          </div>
        </div>

        {/* Consequence nodes arranged around center */}
        {currentConsequences.map((consequence, index) => {
          const angle = (index * 120 - 90) * (Math.PI / 180);
          const radius = 70;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isVisible = visibleConsequences.includes(index);

          return (
            <div
              key={`${activeType}-${index}`}
              className={`absolute transition-all duration-500 ${
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              {/* Connection line */}
              <svg
                className="absolute"
                style={{
                  width: "70px",
                  height: "2px",
                  left: x < 0 ? "100%" : "auto",
                  right: x >= 0 ? "100%" : "auto",
                  top: "50%",
                  transform: `rotate(${(angle * 180) / Math.PI + (x < 0 ? 180 : 0)}deg)`,
                  transformOrigin: x < 0 ? "left center" : "right center",
                }}
              >
                <line
                  x1="0"
                  y1="1"
                  x2="60"
                  y2="1"
                  stroke={`hsl(var(--${propulsionTypes[activeType].color}) / 0.5)`}
                  strokeWidth="1"
                  strokeDasharray={isVisible ? "60" : "0"}
                  style={{
                    transition: "stroke-dasharray 0.5s ease-out",
                  }}
                />
              </svg>

              {/* Consequence card */}
              <div className="w-24 bg-sf-surface border border-muted rounded-none p-2 text-center">
                <div className="text-[12px] text-t3 uppercase tracking-wider">
                  {consequence.domain}
                </div>
                <div className="text-[12px] text-t1 mt-0.5">
                  {consequence.effect}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Impact summary */}
      <div className="mt-4 flex justify-center gap-2">
        {["Economic", "Political", "Social"].map((domain) => (
          <div
            key={domain}
            className="px-2 py-1 rounded border border-muted text-[12px] text-t3"
          >
            {domain}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropulsionMockup;
