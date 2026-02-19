import { VELOCITY_DATA, type TelemetryDatum } from "@/lib/cosmic-telemetry";

interface CosmicTelemetryProps {
  data?: TelemetryDatum[];
  variant?: "vertical" | "horizontal";
  align?: "left" | "center" | "right";
  className?: string;
}

const CosmicTelemetry = ({
  data = VELOCITY_DATA,
  variant = "vertical",
  align = "left",
  className = "",
}: CosmicTelemetryProps) => {
  const alignClass = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

  if (variant === "horizontal") {
    return (
      <div className={`hidden md:block ${className}`} aria-hidden="true">
        <div className={`flex items-baseline gap-6 flex-wrap ${alignClass}`}>
          {data.map((v) => (
            <div key={v.label} className="flex items-baseline gap-1.5">
              <span
                className="font-heading uppercase text-white/[0.10]"
                style={{ fontSize: "6.5px", letterSpacing: "2px" }}
              >
                {v.label}
              </span>
              <span
                className="font-mono"
                style={{ fontSize: "7px", letterSpacing: "0.5px", color: "rgba(255, 179, 71, 0.30)" }}
              >
                {v.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`hidden md:block ${className}`} aria-hidden="true">
      <div className="flex flex-col gap-0.5">
        {data.map((v) => (
          <div key={v.label} className="flex items-baseline gap-2">
            <span
              className="font-heading uppercase text-white/[0.12]"
              style={{ fontSize: "6.5px", letterSpacing: "2px" }}
            >
              {v.label}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: "7px", letterSpacing: "0.5px", color: "rgba(255, 179, 71, 0.35)" }}
            >
              {v.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Default export for backward compatibility with Footer
const CosmicVelocityTicker = () => <CosmicTelemetry />;
export default CosmicVelocityTicker;
export { CosmicTelemetry };
