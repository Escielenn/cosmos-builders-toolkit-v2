import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import ContactDialog from "./ContactDialog";

const SIMULATOR_ROUTES = ["/rogue", "/tools/tidelock", "/tools/exosky"];

const ContactFAB = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isSimulator = SIMULATOR_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`sf-comm-button fixed z-40 shadow-lg ${
          isSimulator ? "bottom-20 right-6" : "bottom-6 left-6"
        }`}
      >
        <MessageCircle className="w-4 h-4" />
        <span>OPEN CHANNEL</span>
      </button>
      <ContactDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default ContactFAB;
