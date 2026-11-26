import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ShowcaseHero from "@/components/showcase/ShowcaseHero";
import { HighlightsSection, OwnershipSection, ProSection } from "@/components/showcase/FeatureSections";
import { CascadeSteps } from "@/components/landing/CascadeSteps";
import { MarketingSection, SectionHeading } from "@/components/landing/marketing-ui";
import StudioSection from "@/components/landing/StudioSection";
import InstrumentConstellation from "@/components/landing/InstrumentConstellation";
import { FinalCTA } from "@/components/landing/LandingClosing";
import { useMetaTags } from "@/hooks/use-meta-tags";

/**
 * Features (1.6, finding 4): rebuilt around the cascade in the landing's
 * voice. Hero → the cascade in depth → the Studio → the instruments by
 * layer → what the connections buy you → Pro → ownership → begin.
 */
const Features = () => {
  useMetaTags({ title: "Features" });
  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />

      <main className="relative z-10 mx-auto w-full max-w-[1200px] overflow-x-clip px-4 pt-16 pb-8 sm:px-6">
        <ShowcaseHero />

        <MarketingSection id="cascade" labelledBy="cascade-title" className="pt-8 md:pt-12">
          <SectionHeading
            id="cascade-title"
            label="The cascade"
            title="Physics to culture, then to the page"
            lede="Every instrument writes to one canon graph. A decision made upstream reaches every layer below it, and finally the scenes that depend on it."
          />
          <CascadeSteps detailed />
        </MarketingSection>

        <StudioSection />
        <InstrumentConstellation />
        <HighlightsSection />
        <ProSection />
        <OwnershipSection />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
};

export default Features;
