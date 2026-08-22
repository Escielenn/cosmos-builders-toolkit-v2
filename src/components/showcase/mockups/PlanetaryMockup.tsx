import { useEffect, useState } from "react";

/**
 * Animated Planetary Profile mockup
 * Shows orbital diagram, stats panel, and atmosphere composition
 */
const PlanetaryMockup = () => {
  const [statsVisible, setStatsVisible] = useState([false, false, false, false]);

  // Staggered stat reveal animation
  useEffect(() => {
    const timers = statsVisible.map((_, index) =>
      setTimeout(() => {
        setStatsVisible((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
      }, 500 + index * 400)
    );

    // Reset and loop
    const resetTimer = setTimeout(() => {
      setStatsVisible([false, false, false, false]);
    }, 4000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(resetTimer);
    };
  }, [statsVisible[0] === false]);

  return (
    <div className="w-full h-full flex bg-sf-void/50 rounded-none p-4 md:p-6 gap-4">
      {/* Left: Orbital diagram */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Star */}
        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_30px_rgba(255,180,0,0.5)] z-10" />

        {/* Orbit path */}
        <div className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border border-sf-teal" />

        {/* Planet orbiting */}
        <div
          className="absolute w-32 h-32 md:w-40 md:h-40"
          style={{ animation: "orbit 8s linear infinite" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-sf-cyan to-blue-600 shadow-[0_0_15px_rgba(21,193,123,0.4)]" />
          </div>
        </div>

        {/* Star type label */}
        <div className="absolute bottom-2 text-[12px] text-sf-amber font-mono">
          G2V Main Sequence
        </div>
      </div>

      {/* Right: Stats panel */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Stats */}
        <div className="space-y-2">
          <StatRow
            label="Gravity"
            value="1.2g"
            visible={statsVisible[0]}
          />
          <StatRow
            label="Day Length"
            value="26.4 hrs"
            visible={statsVisible[1]}
          />
          <StatRow
            label="Year Length"
            value="412 days"
            visible={statsVisible[2]}
          />
          <StatRow
            label="Temperature"
            value="18°C avg"
            visible={statsVisible[3]}
          />
        </div>

        {/* Atmosphere composition */}
        <div className="mt-auto">
          <div className="text-[12px] text-t3 mb-1">Atmosphere</div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-500/70 transition-all duration-500"
              style={{ width: statsVisible[0] ? "70%" : "0%" }}
            />
            <div
              className="bg-sf-cyan/70 transition-all duration-500 delay-100"
              style={{ width: statsVisible[1] ? "20%" : "0%" }}
            />
            <div
              className="bg-sf-emerald/70 transition-all duration-500 delay-200"
              style={{ width: statsVisible[2] ? "8%" : "0%" }}
            />
            <div
              className="bg-gray-500/70 transition-all duration-500 delay-300"
              style={{ width: statsVisible[3] ? "2%" : "0%" }}
            />
          </div>
          <div className="flex justify-between text-[12px] text-t3 mt-1">
            <span>N₂ 70%</span>
            <span>O₂ 20%</span>
            <span>Ar 8%</span>
          </div>
        </div>

        {/* Habitability badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sf-emerald/10 border border-sf-emerald">
            <div className="w-2 h-2 bg-sf-emerald animate-pulse" />
            <span className="text-[12px] text-sf-emerald uppercase tracking-wider">
              Habitable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatRowProps {
  label: string;
  value: string;
  visible: boolean;
}

const StatRow = ({ label, value, visible }: StatRowProps) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-t3">{label}</span>
      <span
        className={`text-xs font-mono text-sf-cyan transition-all duration-300 ${
          visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
        }`}
      >
        {value}
      </span>
    </div>
  );
};

export default PlanetaryMockup;
