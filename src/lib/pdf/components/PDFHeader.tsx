import { View, Text, Svg, Path, Defs, G, Filter } from "@react-pdf/renderer";
import { styles } from "../styles";

interface PDFHeaderProps {
  toolName: string;
  worldName?: string;
  date?: string;
}

// Inline SVG cube logo for PDF (react-pdf Svg component)
const CubeLogoSvg = ({ size = 24 }: { size?: number }) => (
  <Svg viewBox="0 0 64 64" style={{ width: size, height: size }}>
    {/* 3D Cube - dark faces */}
    {/* Top face */}
    <Path d="M 32 8 L 56 20 L 32 32 L 8 20 Z" fill="#1a1a1a" />
    {/* Left face */}
    <Path d="M 8 20 L 32 32 L 32 56 L 8 44 Z" fill="#0d0d0d" />
    {/* Right face */}
    <Path d="M 32 32 L 56 20 L 56 44 L 32 56 Z" fill="#141414" />
    {/* Cyan swoosh arc */}
    <Path
      d="M 50 16 Q 32 22, 18 36 Q 14 44, 16 50"
      stroke="#00E5E5"
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

const PDFHeader = ({ toolName, worldName, date }: PDFHeaderProps) => {
  const formattedDate = date || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={styles.header}>
      <View style={styles.headerLogo}>
        <CubeLogoSvg size={24} />
        <View>
          <Text style={styles.headerTitle}>STELLARFORGE</Text>
          <Text style={styles.headerSubtitle}>{toolName}</Text>
        </View>
      </View>
      <View style={styles.headerMeta}>
        {worldName && (
          <Text style={styles.headerMetaText}>World: {worldName}</Text>
        )}
        <Text style={styles.headerMetaText}>Generated: {formattedDate}</Text>
      </View>
    </View>
  );
};

export default PDFHeader;
