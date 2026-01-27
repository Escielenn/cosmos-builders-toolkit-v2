import { View, Text, Image } from "@react-pdf/renderer";
import { styles, colors } from "../styles";

interface PDFHeaderProps {
  toolName: string;
  worldName?: string;
  date?: string;
}

const PDFHeader = ({ toolName, worldName, date }: PDFHeaderProps) => {
  const formattedDate = date || new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={styles.header}>
      <View style={styles.headerLogo}>
        <View
          style={{
            width: 24,
            height: 24,
            backgroundColor: colors.primary,
            borderRadius: 4,
          }}
        />
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
