const velocities = [
  { label: "SURFACE ROTATION", value: "~0.36 km/s" },
  { label: "SOLAR ORBIT", value: "29.78 km/s" },
  { label: "GALACTIC TRANSIT", value: "~230 km/s" },
  { label: "LOCAL GROUP DRIFT", value: "~300 km/s" },
  { label: "CMB RELATIVE", value: "~627 km/s" },
];

const CosmicVelocityTicker = () => {
  return (
    <div className="hidden md:block" aria-hidden="true">
      <div className="flex flex-col gap-0.5">
        {velocities.map((v) => (
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

export default CosmicVelocityTicker;
