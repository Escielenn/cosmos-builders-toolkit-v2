import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { MessageSquare, Clock } from "lucide-react";
import ContactFormTabs from "@/components/contact/ContactFormTabs";
import { useSearchParams } from "react-router-dom";
import { PageBursts } from "@/components/ui/data-burst";
import { CONTACT_BURSTS } from "@/lib/data-bursts";
import { useMetaTags } from "@/hooks/use-meta-tags";

type TabValue = "contact" | "support" | "feature" | "bug" | "beta";

const validTabs: TabValue[] = ["contact", "support", "feature", "bug", "beta"];

const Contact = () => {
  useMetaTags({ title: "Contact" });
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab: TabValue = validTabs.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : "contact";

  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />

      <main className="relative">
        <PageContainer variant="standalone">
        <PageBursts bursts={CONTACT_BURSTS} />
        <PageHeader
          size="page"
          eyebrow="Communications"
          title="Contact"
          lede="Report anomalies, request features, or make contact."
        />

        {/* Contact Form */}
        <section className="max-w-2xl mb-16">
          <GlassPanel className="p-6 sm:p-8">
            <ContactFormTabs defaultTab={defaultTab} />
          </GlassPanel>
        </section>

        {/* Alternative Contact Methods */}
        <section className="max-w-2xl">
          <GlassPanel className="p-8">
            <h2 className="font-display text-sf-h3 font-light text-t1 mb-6">
              Other ways to reach us
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4">
                <MessageSquare className="w-8 h-8 text-sf-primary-text mx-auto mb-2" />
                <h4 className="font-medium mb-1">Email</h4>
                <p className="text-sm text-t2">
                  support@stellarforge.tools
                </p>
              </div>
              <div className="text-center p-4">
                <Clock className="w-8 h-8 text-sf-primary-text mx-auto mb-2" />
                <h4 className="font-medium mb-1">Response Time</h4>
                <p className="text-sm text-t2">
                  Usually within 24-48 hours
                </p>
              </div>
            </div>
          </GlassPanel>
        </section>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
