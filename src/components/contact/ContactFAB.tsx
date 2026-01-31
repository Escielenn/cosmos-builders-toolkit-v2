import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import ContactDialog from "./ContactDialog";

const ContactFAB = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="sr-only">Contact Support</span>
      </Button>
      <ContactDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default ContactFAB;
