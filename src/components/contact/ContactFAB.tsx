import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ContactDialog from "./ContactDialog";

const ContactFAB = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sf-comm-button shadow-lg"
      >
        <MessageCircle className="w-4 h-4" />
        <span>OPEN CHANNEL</span>
      </button>
      <ContactDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default ContactFAB;
