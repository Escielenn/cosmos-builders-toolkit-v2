import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContactFormTabs from "./ContactFormTabs";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "contact" | "support";
}

const ContactDialog = ({
  open,
  onOpenChange,
  defaultTab,
}: ContactDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Contact Us</DialogTitle>
          <DialogDescription>
            Get in touch or submit a support ticket.
          </DialogDescription>
        </DialogHeader>
        <ContactFormTabs
          defaultTab={defaultTab}
          onSuccess={() => setTimeout(() => onOpenChange(false), 2000)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog;
