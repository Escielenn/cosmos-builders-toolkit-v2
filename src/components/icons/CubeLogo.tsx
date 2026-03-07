interface CubeLogoProps {
  size?: number;
  className?: string;
}

const CubeLogo = ({ size = 24, className = "" }: CubeLogoProps) => {
  return (
    <img
      src="/android-chrome-192x192.png"
      alt="StellarForge"
      width={size}
      height={size}
      className={className}
    />
  );
};

export default CubeLogo;
