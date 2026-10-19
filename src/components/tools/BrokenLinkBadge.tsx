import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/layout/page-chrome";
import { Badge } from "@/components/ui/badge";

interface BrokenLinkBadgeProps {
  label: string;
  onRemoveLink: () => void;
}

const BrokenLinkBadge = ({ label, onRemoveLink }: BrokenLinkBadgeProps) => {
  return (
    <Notice tone="danger" compact icon={<AlertTriangle className="w-4 h-4" />}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sf-crimson-text">"{label}" link broken</p>
          <p className="mt-0.5">The linked worksheet has been deleted</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemoveLink}
          className="min-h-hit shrink-0 px-3 text-sf-crimson-text hover:text-sf-crimson-text hover:bg-destructive/20"
        >
          <X className="w-3 h-3 mr-1" />
          Remove
        </Button>
      </div>
    </Notice>
  );
};

export default BrokenLinkBadge;
