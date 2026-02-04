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
        <filter id={filterId} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Black background */}
      <rect x="0" y="0" width="64" height="64" fill="#000000" rx="8" />

      {/* White arc swoosh from upper right curving down */}
      <path
        d="M 58 6 Q 42 12, 28 28 Q 18 42, 22 54"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        filter={`url(#${filterId})`}
      />
    </svg>
  );
};

export default CubeLogo;
