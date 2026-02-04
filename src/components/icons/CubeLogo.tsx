interface CubeLogoProps {
  size?: number;
  className?: string;
}

const CubeLogo = ({ size = 24, className = "" }: CubeLogoProps) => {
  // Generate unique IDs to avoid conflicts when multiple logos render
  const id = Math.random().toString(36).substr(2, 9);
  const gradientId = `swooshGradient-${id}`;
  const filterId = `glow-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00F0F9" />
          <stop offset="50%" stopColor="#0AC5E1" />
          <stop offset="100%" stopColor="#056673" />
        </linearGradient>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Black background */}
      <rect x="0" y="0" width="64" height="64" fill="#000000" rx="8" />

      {/* Cyan swoosh arc with gradient and glow */}
      <path
        d="M 56 8 Q 40 12, 24 28 Q 12 44, 16 56"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${filterId})`}
      />

      {/* Bright highlight on the arc */}
      <path
        d="M 54 10 Q 42 14, 30 26"
        stroke="#00F0F9"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
};

export default CubeLogo;
