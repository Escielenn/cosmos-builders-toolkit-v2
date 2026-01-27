import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

interface PDFResultBoxProps {
  value: string | number;
  label: string;
  description?: string;
}

const PDFResultBox = ({ value, label, description }: PDFResultBoxProps) => {
  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultValue}>{value}</Text>
      <Text style={styles.resultLabel}>{label}</Text>
      {description && (
        <Text style={styles.resultDescription}>{description}</Text>
      )}
    </View>
  );
};

export default PDFResultBox;
