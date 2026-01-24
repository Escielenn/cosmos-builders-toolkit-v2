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
import { Crown, Check, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
      const result = await createCheckoutSession.mutateAsync(priceType);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
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
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Crown className="w-5 h-5 text-amber-500" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>
            {toolName
              ? `"${toolName}" is a Pro tool. Upgrade to access all worldbuilding tools.`
              : "Unlock all worldbuilding tools with a Pro subscription."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Monthly Plan */}
          <div className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">Monthly</h3>
                <p className="text-2xl font-bold">$12.50<span className="text-sm font-normal text-muted-foreground">/month</span></p>
              </div>
              <Button
                size="sm"
                onClick={() => handleUpgrade('monthly')}
                disabled={loading !== null}
              >
                {loading === 'monthly' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Subscribe'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Billed monthly, cancel anytime</p>
          </div>

          {/* Yearly Plan */}
          <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 relative">
            <div className="absolute -top-3 left-4">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded">
                Save 34%
              </span>
            </div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">Yearly</h3>
                <p className="text-2xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/year</span></p>
              </div>
              <Button
                size="sm"
                onClick={() => handleUpgrade('yearly')}
                disabled={loading !== null}
              >
                {loading === 'yearly' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Subscribe'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Billed annually (~$8.25/month)</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">All Pro features include:</p>
          <ul className="space-y-1">
            {[
              "All 8+ worldbuilding tools",
              "Unlimited worlds & worksheets",
              "Cloud sync across devices",
              "Export to PDF & JSON",
              "Priority support",
              "Future tools & features",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-muted-foreground">
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
