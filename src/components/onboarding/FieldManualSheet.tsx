import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FieldManualContent } from "./FieldManualContent";

interface FieldManualSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FieldManualSheet = ({ open, onOpenChange }: FieldManualSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="sm:max-w-md w-[90vw] bg-sf-surface border-l border-sf-line overflow-y-auto sf-sb p-0"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-0">
          <div className="font-mono text-[12px] uppercase tracking-wide text-sf-primary-text mb-1">
            // Field Manual
          </div>
          <SheetTitle className="font-heading text-sm uppercase tracking-wide text-t2 font-light">
            Operational Reference
          </SheetTitle>
          <p className="font-mono text-[12px] uppercase tracking-wide text-t4 mt-0.5">
            StellarForge Systems
          </p>
        </SheetHeader>

        {/* Content */}
        <div className="px-5 pb-8">
          <FieldManualContent />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FieldManualSheet;
