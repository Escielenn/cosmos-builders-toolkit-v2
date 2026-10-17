import { useEffect, useState } from "react";

/**
 * Animated Evolutionary Biology mockup
 * Shows species silhouette, trait badges, and section progress
 */
const EvoBioMockup = () => {
  const [visibleTraits, setVisibleTraits] = useState<number[]>([]);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  // Staggered trait reveal
  useEffect(() => {
    const traits = [0, 1, 2, 3, 4];
    let current = 0;

    const traitInterval = setInterval(() => {
      if (current < traits.length) {
        setVisibleTraits((prev) => [...prev, traits[current]]);
        current++;
      }
    }, 400);

    // Section completion after traits
    const sectionTimer = setTimeout(() => {
      const sections = [0, 1, 2, 3, 4, 5];
      let sectionCurrent = 0;

      const sectionInterval = setInterval(() => {
        if (sectionCurrent < sections.length) {
          setCompletedSections((prev) => [...prev, sections[sectionCurrent]]);
          sectionCurrent++;
        } else {
          clearInterval(sectionInterval);
        }
      }, 300);

      return () => clearInterval(sectionInterval);
    }, 2000);

    // Reset and loop
    const resetTimer = setTimeout(() => {
      setVisibleTraits([]);
      setCompletedSections([]);
    }, 5000);

    return () => {
      clearInterval(traitInterval);
      clearTimeout(sectionTimer);
      clearTimeout(resetTimer);
    };
  }, [visibleTraits.length === 0]);

  const traits = [
    { label: "Bilateral", color: "sf-teal" },
    { label: "Exoskeleton", color: "sf-emerald" },
    { label: "Hexapod", color: "sf-violet" },
    { label: "Chemoreceptive", color: "sf-amber" },
    { label: "Eusocial", color: "sf-magenta" },
  ];

  const sections = [
    "Biochemistry",
    "Body Plan",
    "Sensory",
    "Reproduction",
    "Social",
    "Cognition",
  ];

  return (
    <div className="w-full h-full flex bg-sf-void/50 rounded-none p-4 md:p-6 gap-4">
      {/* Left: Species silhouette with traits */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Simple creature silhouette */}
        <div className="relative">
          {/* Body */}
          <div className="w-16 h-12 md:w-20 md:h-14 bg-gradient-to-br from-sf-primary/30 to-sf-violet/30 rounded-full border border-sf-primary" />

          {/* Head */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-sf-primary/40 to-sf-violet/40 rounded-full border border-sf-primary" />

          {/* Eyes */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-sf-emerald shadow-[0_0_8px_rgb(var(--sf-emerald-rgb)/0.5)]" />
            <div className="w-2 h-2 rounded-full bg-sf-emerald shadow-[0_0_8px_rgb(var(--sf-emerald-rgb)/0.5)]" />
          </div>

          {/* Legs - 6 for hexapod */}
          <div className="absolute -bottom-3 left-0 right-0 flex justify-between px-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-4 bg-sf-primary/40 rounded-full"
                style={{
                  transform: `rotate(${(i - 2.5) * 10}deg)`,
                }}
              />
            ))}
          </div>

          {/* Pulse effect */}
          <div
            className="absolute inset-0 -m-2 rounded-full border border-sf-primary"
            style={{ animation: "pulse-value 2s ease-in-out infinite" }}
          />
        </div>

        {/* Trait badges */}
        <div className="flex flex-wrap gap-1 mt-6 justify-center max-w-[140px]">
          {traits.map((trait, index) => (
            <span
              key={trait.label}
              className={`text-xs px-2 py-0.5 rounded-none border transition-all duration-slow ease-sf-out ${
                visibleTraits.includes(index) ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
              style={{
                backgroundColor: `rgb(var(--${trait.color}-rgb) / 0.06)`,
                borderColor: `var(--${trait.color})`,
                color: `var(--${trait.color}-text)`,
              }}
            >
              {trait.label}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Section checklist */}
      <div className="flex-1 flex flex-col">
        <div className="text-xs text-t3 uppercase tracking-wider mb-3">
          Design Progress
        </div>

        <div className="space-y-2 flex-1">
          {sections.map((section, index) => (
            <div key={section} className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-none border transition-all duration-slow flex items-center justify-center ${
                  completedSections.includes(index)
                    ? "bg-sf-emerald/20 border-sf-emerald"
                    : "border-sf-line"
                }`}
              >
                {completedSections.includes(index) && (
                  <svg
                    className="w-2 h-2 text-sf-emerald-text"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs transition-colors duration-slow ${
                  completedSections.includes(index)
                    ? "text-t1"
                    : "text-t3"
                }`}
              >
                {section}
              </span>
            </div>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-t3 mb-1">
            <span>Completion</span>
            <span>{Math.round((completedSections.length / 13) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-sf-surface rounded-none overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sf-primary to-sf-emerald transition-all duration-slow"
              style={{ width: `${(completedSections.length / 13) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvoBioMockup;
