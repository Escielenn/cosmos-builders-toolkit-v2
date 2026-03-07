import LegalPageLayout from "@/components/layout/LegalPageLayout";
import { FileText } from "lucide-react";
import { TERMS_CONTENT } from "@/lib/legal/terms-content";
import { TERMS_BURSTS } from "@/lib/data-bursts";

const Terms = () => {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The agreement between you and StellarForge."
      lastUpdated="February 18, 2026"
      badgeIcon={<FileText className="w-3 h-3 mr-1" />}
      badgeText="Terms"
      content={TERMS_CONTENT}
      bursts={TERMS_BURSTS}
    />
  );
};

export default Terms;
