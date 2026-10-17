import { Compass } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { FieldManualContent } from "@/components/onboarding/FieldManualContent";
import { GuideNav } from "@/components/layout/GuideNav";
import { useMetaTags } from "@/hooks/use-meta-tags";

const FieldManual = () => {
  useMetaTags({ title: "Field Manual" });
  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <GuideNav />

        <header className="mb-8">
          <div className="font-mono text-xs uppercase tracking-wide text-sf-primary-text mb-2">
            // Field Manual
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Compass className="w-5 h-5 text-sf-primary-text" />
            <h1 className="font-display text-sf-h1 tracking-title text-t1 uppercase">
              Operational Reference
            </h1>
          </div>
          <p className="text-sm text-t3 font-mono uppercase tracking-wider">
            StellarForge Systems
          </p>
        </header>

        <GlassPanel className="p-6 md:p-10">
          <FieldManualContent scale="page" />
        </GlassPanel>
      </main>

      <Footer />
    </div>
  );
};

export default FieldManual;
