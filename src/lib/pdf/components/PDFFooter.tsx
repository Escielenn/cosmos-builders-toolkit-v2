import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

interface PDFFooterProps {
  pageNumber?: number;
  totalPages?: number;
}

const PDFFooter = ({ pageNumber, totalPages }: PDFFooterProps) => {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>© 2026 Jason D. Batt, Ph.D. • stellarforge.tools</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  );
};

export default PDFFooter;
