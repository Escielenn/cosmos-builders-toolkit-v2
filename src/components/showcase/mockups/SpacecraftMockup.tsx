import { useEffect, useState } from "react";

/**
 * Animated Spacecraft Designer mockup
 * Shows ship sections highlighting, crew capacity, and life support
 */
const SpacecraftMockup = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [crewCount, setCrewCount] = useState(0);

  // Cycle through ship sections
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % 5);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // Animate crew count
  useEffect(() => {
    const interval = setInterval(() => {
      setCrewCount((prev) => {
        if (prev < 24) return prev + 1;
        return 0;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  const sections = [
    { id: "bridge", name: "Bridge", x: 75, y: 20, w: 20, h: 15 },
    { id: "quarters", name: "Quarters", x: 30, y: 35, w: 35, h: 25 },
    { id: "cargo", name: "Cargo Bay", x: 10, y: 55, w: 25, h: 30 },
    { id: "engineering", name: "Engineering", x: 50, y: 65, w: 30, h: 25 },
    { id: "engines", name: "Engines", x: 85, y: 50, w: 12, h: 40 },
  ];

  const lifeSupport = [
    { name: "O₂", value: 98, color: "sf-cyan" },
    { name: "H₂O", value: 87, color: "sf-azure" },
    { name: "Power", value: 92, color: "sf-amber" },
    { name: "Temp", value: 21, unit: "°C", color: "sf-emerald" },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-sf-void/50 rounded-lg p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Spacecraft
          </div>
          <div className="text-sm font-display text-sf-cyan">
            RSV Wanderer
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">Crew</div>
          <div className="text-lg font-mono text-sf-cyan">
            {crewCount}
            <span className="text-xs text-muted-foreground">/24</span>
          </div>
        </div>
      </div>

      {/* Ship visualization */}
      <div className="flex-1 relative flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full max-h-[120px]"
          style={{ filter: "drop-shadow(0 0 10px rgba(0, 212, 255, 0.2))" }}
        >
          {/* Ship hull outline */}
          <path
            d="M5 50 L20 30 L80 25 L95 50 L80 75 L20 70 Z"
            fill="none"
            stroke="hsl(var(--sf-cyan) / 0.3)"
            strokeWidth="1"
          />

          {/* Engine glow */}
          <ellipse
            cx="8"
            cy="50"
            rx="4"
            ry="8"
            fill="hsl(var(--sf-cyan) / 0.4)"
            style={{ animation: "pulse-value 1s ease-in-out infinite" }}
          />

          {/* Sections */}
          {sections.map((section, index) => (
            <rect
              key={section.id}
              x={section.x}
              y={section.y}
              width={section.w}
              height={section.h}
              rx="2"
              fill={
                index === activeSection
                  ? "hsl(var(--sf-cyan) / 0.3)"
                  : "hsl(var(--sf-surface) / 0.5)"
              }
              stroke={
                index === activeSection
                  ? "hsl(var(--sf-cyan))"
                  : "hsl(var(--muted-foreground) / 0.2)"
              }
              strokeWidth={index === activeSection ? "1.5" : "0.5"}
              className="transition-all duration-300"
            />
          ))}

          {/* Section label */}
          <text
            x="50"
            y="95"
            textAnchor="middle"
            className="text-[8px] fill-current"
            style={{ fill: "hsl(var(--sf-cyan))" }}
          >
            {sections[activeSection]?.name}
          </text>
        </svg>

        {/* Highlight pulse */}
        <div
          className="absolute w-4 h-4 rounded-full bg-sf-cyan/30 blur-md pointer-events-none"
          style={{
            left: `${sections[activeSection]?.x + sections[activeSection]?.w / 2}%`,
            top: `${sections[activeSection]?.y + sections[activeSection]?.h / 2}%`,
            transition: "all 0.3s ease-out",
          }}
        />
      </div>

      {/* Life support indicators */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {lifeSupport.map((item) => (
          <div key={item.name} className="text-center">
            <div className="text-[8px] text-muted-foreground mb-1">{item.name}</div>
            <div
              className="text-xs font-mono"
              style={{ color: `hsl(var(--${item.color}))` }}
            >
              {item.value}
              {item.unit || "%"}
            </div>
            <div className="h-1 bg-sf-surface mt-1 overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: item.unit ? "100%" : `${item.value}%`,
                  backgroundColor: `hsl(var(--${item.color}))`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Ship class badge */}
      <div className="mt-3 flex justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sf-cyan/10 border border-sf-cyan/30">
          <div className="w-2 h-2 bg-sf-cyan animate-pulse" />
          <span className="text-[10px] text-sf-cyan uppercase tracking-wider">
            Long-Range Explorer
          </span>
        </div>
      </div>
    </div>
  );
};

export default SpacecraftMockup;
