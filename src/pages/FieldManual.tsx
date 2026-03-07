import { Compass } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { FieldManualContent } from "@/components/onboarding/FieldManualContent";
import { GuideNav } from "@/components/layout/GuideNav";

const FieldManual = () => {
  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <GuideNav />

        <header className="mb-8">
          <div className="font-mono text-[9px] uppercase tracking-[3px] text-primary/40 mb-2">
            // Field Manual
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Compass className="w-5 h-5 text-primary/60" />
            <h1 className="font-display text-2xl md:text-3xl font-light uppercase tracking-sf-wide">
              Operational Reference
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">
            StellarForge Systems
          </p>
        </header>

        <GlassPanel className="p-6 md:p-10">
          <FieldManualContent />
        </GlassPanel>
      </main>

      <Footer />
    </div>
  );
};

export default FieldManual;
