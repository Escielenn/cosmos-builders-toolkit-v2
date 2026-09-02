import { useEffect, useState } from "react";

/**
 * Animated Drake Equation Calculator mockup
 * Shows sliders moving and N value updating
 */
const DrakeMockup = () => {
  const [nValue, setNValue] = useState(42);

  // Animate the N value
  useEffect(() => {
    const interval = setInterval(() => {
      setNValue((prev) => {
        // Oscillate between 10 and 1000
        const delta = Math.sin(Date.now() / 2000) * 50;
        return Math.round(100 + delta);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-sf-void/50 rounded-none p-4 md:p-6">
      {/* Header */}
      <div className="text-center mb-4 md:mb-6">
        <div className="text-xs text-t3 uppercase tracking-wider mb-1">
          Drake Equation
        </div>
        <div className="text-2xl md:text-4xl font-display font-light text-sf-cyan">
          N = <span style={{ animation: "pulse-value 2s ease-in-out infinite" }}>{nValue}</span>
        </div>
        <div className="text-xs text-t3 mt-1">
          {nValue > 100 ? "Crowded Galaxy" : nValue > 50 ? "Moderate" : "Sparse"}
        </div>
      </div>

      {/* Sliders */}
      <div className="flex-1 space-y-3">
        <SliderRow label="R*" description="Star formation" delay={0} />
        <SliderRow label="fp" description="Planets per star" delay={0.3} />
        <SliderRow label="ne" description="Habitable planets" delay={0.6} />
        <SliderRow label="fl" description="Life develops" delay={0.9} />
        <SliderRow label="fi" description="Intelligence" delay={1.2} />
        <SliderRow label="fc" description="Technology" delay={1.5} />
        <SliderRow label="L" description="Civilization lifespan" delay={1.8} />
      </div>

      {/* Interpretation badge */}
      <div className="mt-4 flex justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sf-cyan/10 border border-sf-primary">
          <div className="w-2 h-2 bg-sf-cyan animate-pulse" />
          <span className="text-xs text-sf-cyan uppercase tracking-wider">
            Space Opera Setting
          </span>
        </div>
      </div>
    </div>
  );
};

interface SliderRowProps {
  label: string;
  description: string;
  delay: number;
}

const SliderRow = ({ label, description, delay }: SliderRowProps) => {
  return (
    <div className="flex items-center gap-3">
      {/* Label */}
      <div className="w-8 text-right">
        <span className="text-xs font-mono text-sf-cyan">{label}</span>
      </div>

      {/* Slider track */}
      <div className="flex-1 h-2 bg-sf-surface rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-sf-cyan/50 to-sf-cyan rounded-full"
          style={{
            animation: `slide-value 4s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }}
        />
      </div>

      {/* Description */}
      <div className="w-24 hidden md:block">
        <span className="text-[12px] text-t3 truncate">
          {description}
        </span>
      </div>
    </div>
  );
};

export default DrakeMockup;
