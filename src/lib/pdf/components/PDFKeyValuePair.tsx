import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

interface PDFKeyValuePairProps {
  label: string;
  value: string | number;
  unit?: string;
}

const PDFKeyValuePair = ({ label, value, unit }: PDFKeyValuePairProps) => {
  return (
    <View style={styles.keyValueRow}>
      <Text style={styles.keyValueLabel}>{label}</Text>
      <Text style={styles.keyValueValue}>
        {value}
        {unit ? ` ${unit}` : ""}
      </Text>
    </View>
  );
};

export default PDFKeyValuePair;
