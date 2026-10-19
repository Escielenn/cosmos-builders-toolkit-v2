import { Compass } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { FieldManualContent } from "@/components/onboarding/FieldManualContent";
import { GuideNav } from "@/components/layout/GuideNav";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { useMetaTags } from "@/hooks/use-meta-tags";

const FieldManual = () => {
  useMetaTags({ title: "Field Manual" });
  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />

      <main className="relative">
        <PageContainer variant="standalone">
          <PageHeader
            size="page"
            back={{ label: "Back to Guide", to: "/guide" }}
            eyebrow="Guide · Field manual"
            icon={<Compass className="h-6 w-6 text-sf-primary-text" aria-hidden />}
            title="Field manual"
            lede="Platform navigation, sharing, keyboard shortcuts and the operational systems behind StellarForge."
          >
            <GuideNav />
          </PageHeader>

          <GlassPanel className="p-6 md:p-10">
            <FieldManualContent scale="page" />
          </GlassPanel>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default FieldManual;
