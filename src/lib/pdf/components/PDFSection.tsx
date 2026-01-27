import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { ReactNode } from "react";

interface PDFSectionProps {
  title: string;
  children: ReactNode;
}

const PDFSection = ({ title, children }: PDFSectionProps) => {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

export default PDFSection;
