interface CubeLogoProps {
  size?: number;
  className?: string;
}

const CubeLogo = ({ size = 24, className = "" }: CubeLogoProps) => {
  // Generate unique filter ID to avoid conflicts when multiple logos render
  const filterId = `glow-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
    >
      <defs>
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

      {/* White swoosh arc with subtle glow */}
      <path
        d="M 56 4 Q 32 8, 12 32 Q 8 40, 10 48"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${filterId})`}
        opacity="0.95"
      />

      {/* Subtle highlight on the arc */}
      <path
        d="M 54 6 Q 34 10, 16 30"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
};

export default CubeLogo;
