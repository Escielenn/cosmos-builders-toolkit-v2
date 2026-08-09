import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Clock } from "lucide-react";
import ContactFormTabs from "@/components/contact/ContactFormTabs";
import { useSearchParams } from "react-router-dom";
import { PageBursts } from "@/components/ui/data-burst";
import { CONTACT_BURSTS } from "@/lib/data-bursts";

type TabValue = "contact" | "support" | "feature" | "bug" | "beta";

const validTabs: TabValue[] = ["contact", "support", "feature", "bug", "beta"];

const Contact = () => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab: TabValue = validTabs.includes(tabParam as TabValue)
    ? (tabParam as TabValue)
    : "contact";

  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16">
        <PageBursts bursts={CONTACT_BURSTS} />
        {/* Hero */}
        <section className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Mail className="w-3 h-3 mr-1" />
            COMMUNICATIONS
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-light mb-4 tracking-sf-wide">
            COMMUNICATIONS CHANNEL
          </h1>
          <p className="text-lg text-t3 max-w-2xl mx-auto">
            Report anomalies, request features, or make contact.
          </p>
        </section>

        {/* Contact Form */}
        <section className="max-w-2xl mx-auto mb-16">
          <GlassPanel className="p-6 sm:p-8">
            <ContactFormTabs defaultTab={defaultTab} />
          </GlassPanel>
        </section>

        {/* Alternative Contact Methods */}
        <section className="max-w-2xl mx-auto">
          <GlassPanel className="p-8">
            <h3 className="font-heading text-xl font-medium mb-6 text-center">
              Other Ways to Reach Us
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4">
                <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium mb-1">Email</h4>
                <p className="text-sm text-t3">
                  support@stellarforge.tools
                </p>
              </div>
              <div className="text-center p-4">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium mb-1">Response Time</h4>
                <p className="text-sm text-t3">
                  Usually within 24-48 hours
                </p>
              </div>
            </div>
          </GlassPanel>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
