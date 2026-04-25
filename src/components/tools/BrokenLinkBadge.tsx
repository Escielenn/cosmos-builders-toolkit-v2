import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BrokenLinkBadgeProps {
  label: string;
  onRemoveLink: () => void;
}

const BrokenLinkBadge = ({ label, onRemoveLink }: BrokenLinkBadgeProps) => {
  return (
    <div className="flex items-center gap-2 p-3 rounded-none border border-destructive/50 bg-destructive/10">
      <AlertTriangle className="w-4 h-4 text-sf-crimson flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-sf-crimson">
          "{label}" link broken
        </span>
        <p className="text-xs text-t3 mt-0.5">
          The linked worksheet has been deleted
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemoveLink}
        className="h-7 px-2 text-sf-crimson hover:text-sf-crimson hover:bg-destructive/20"
      >
        <X className="w-3 h-3 mr-1" />
        Remove
      </Button>
    </div>
  );
};

export default BrokenLinkBadge;
