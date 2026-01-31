import Header from "@/components/layout/Header";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Clock } from "lucide-react";
import ContactFormTabs from "@/components/contact/ContactFormTabs";
import { useSearchParams } from "react-router-dom";

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

      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <section className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Mail className="w-3 h-3 mr-1" />
            Contact Us
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a question, feedback, or need support? We're here to help.
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
            <h3 className="font-display text-xl font-semibold mb-6 text-center">
              Other Ways to Reach Us
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4">
                <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium mb-1">Email</h4>
                <p className="text-sm text-muted-foreground">
                  support@stellarforge.io
                </p>
              </div>
              <div className="text-center p-4">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="font-medium mb-1">Response Time</h4>
                <p className="text-sm text-muted-foreground">
                  Usually within 24-48 hours
                </p>
              </div>
            </div>
          </GlassPanel>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 StellarForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
