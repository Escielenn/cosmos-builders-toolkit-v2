import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, LifeBuoy } from "lucide-react";
import GeneralContactForm from "./GeneralContactForm";
import SupportTicketForm from "./SupportTicketForm";

interface ContactFormTabsProps {
  defaultTab?: "contact" | "support";
  onSuccess?: () => void;
}

const ContactFormTabs = ({
  defaultTab = "contact",
  onSuccess,
}: ContactFormTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "contact" | "support")}
    >
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="contact" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          General Contact
        </TabsTrigger>
        <TabsTrigger value="support" className="gap-2">
          <LifeBuoy className="w-4 h-4" />
          Support Ticket
        </TabsTrigger>
      </TabsList>

      <TabsContent value="contact">
        <GeneralContactForm onSuccess={onSuccess} />
      </TabsContent>

      <TabsContent value="support">
        <SupportTicketForm onSuccess={onSuccess} />
      </TabsContent>
    </Tabs>
  );
};

export default ContactFormTabs;
