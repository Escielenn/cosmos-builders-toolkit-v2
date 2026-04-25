import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Check } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { safeRedirect } from "@/lib/url-validation";
import { FREE_TOOL_IDS, PRO_TOOL_IDS, PRICING } from "@/lib/tools-config";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolName?: string;
}

const UpgradeDialog = ({ open, onOpenChange, toolName }: UpgradeDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCheckoutSession } = useSubscription();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);

  const handleUpgrade = async (priceType: 'monthly' | 'yearly') => {
    if (!user) {
      onOpenChange(false);
      navigate("/auth?redirect=/pricing");
      return;
    }

    setLoading(priceType);
    try {
      const result = await createCheckoutSession.mutateAsync({ priceType, tier: 'pro' });
      if (result.url) {
        safeRedirect(result.url, "stripe");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "OPERATION FAILED.",
        description: "Failed to start checkout. Retry when ready.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl">
            <Zap className="w-5 h-5 text-sf-amber" />
            UPGRADE CLEARANCE
          </DialogTitle>
          <DialogDescription>
            {toolName
              ? `"${toolName}" requires Pro clearance. Upgrade to access the full instrument manifest.`
              : "Upgrade to Pro clearance for full instrument access."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Monthly Plan */}
          <div className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">Monthly</h3>
                <p className="text-2xl font-bold">${PRICING.pro.monthly.price}<span className="text-sm font-normal text-t3">/month</span></p>
              </div>
              <Button
                size="sm"
                onClick={() => handleUpgrade('monthly')}
                disabled={loading !== null}
              >
                {loading === 'monthly' ? (
                  <Loader variant="inline" size="sm" />
                ) : (
                  'Subscribe'
                )}
              </Button>
            </div>
            <p className="text-xs text-t3">Billed monthly, cancel anytime</p>
          </div>

          {/* Yearly Plan */}
          <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 relative">
            <div className="absolute -top-3 left-4">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded">
                Save 18%
              </span>
            </div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">Yearly</h3>
                <p className="text-2xl font-bold">${PRICING.pro.yearly.price}<span className="text-sm font-normal text-t3">/year</span></p>
              </div>
              <Button
                size="sm"
                onClick={() => handleUpgrade('yearly')}
                disabled={loading !== null}
              >
                {loading === 'yearly' ? (
                  <Loader variant="inline" size="sm" />
                ) : (
                  'Subscribe'
                )}
              </Button>
            </div>
            <p className="text-xs text-t3">Billed annually (~${PRICING.pro.yearly.monthlyEquivalent}/month)</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">Pro clearance includes:</p>
          <ul className="space-y-1">
            {[
              `All ${FREE_TOOL_IDS.length + PRO_TOOL_IDS.length} instruments`,
              "Unlimited worlds and worksheets",
              "Cloud sync across devices",
              "Export to PDF, DOCX, and JSON",
              "Priority support",
              "All future instruments and features",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-t3">
                <Check className="w-4 h-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeDialog;
