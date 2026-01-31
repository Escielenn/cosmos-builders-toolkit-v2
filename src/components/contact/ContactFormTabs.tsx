import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, LifeBuoy, Lightbulb, Bug, Sparkles } from "lucide-react";
import GeneralContactForm from "./GeneralContactForm";
import SupportTicketForm from "./SupportTicketForm";
import SimpleSubmissionForm from "./SimpleSubmissionForm";

type TabValue = "contact" | "support" | "feature" | "bug" | "beta";

interface ContactFormTabsProps {
  defaultTab?: TabValue;
  onSuccess?: () => void;
}

const ContactFormTabs = ({
  defaultTab = "contact",
  onSuccess,
}: ContactFormTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabValue>(defaultTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as TabValue)}
    >
      <TabsList className="grid w-full grid-cols-5 mb-6">
        <TabsTrigger value="contact" className="gap-1 text-xs px-2">
          <MessageSquare className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Contact</span>
        </TabsTrigger>
        <TabsTrigger value="support" className="gap-1 text-xs px-2">
          <LifeBuoy className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Support</span>
        </TabsTrigger>
        <TabsTrigger value="feature" className="gap-1 text-xs px-2">
          <Lightbulb className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Feature</span>
        </TabsTrigger>
        <TabsTrigger value="bug" className="gap-1 text-xs px-2">
          <Bug className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bug</span>
        </TabsTrigger>
        <TabsTrigger value="beta" className="gap-1 text-xs px-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Beta</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="contact">
        <GeneralContactForm onSuccess={onSuccess} />
      </TabsContent>

      <TabsContent value="support">
        <SupportTicketForm onSuccess={onSuccess} />
      </TabsContent>

      <TabsContent value="feature">
        <SimpleSubmissionForm type="feature" onSuccess={onSuccess} />
      </TabsContent>

      <TabsContent value="bug">
        <SimpleSubmissionForm type="bug" onSuccess={onSuccess} />
      </TabsContent>

      <TabsContent value="beta">
        <SimpleSubmissionForm type="beta" onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
};

export default ContactFormTabs;
