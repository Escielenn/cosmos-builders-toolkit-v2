/**
 * Account data: download everything on file, or delete the account.
 *
 * The Privacy Policy promises both. Export calls export_account_data(), one
 * server-side JSON document covering every table keyed to the user (the
 * per-world archive on the dashboard covers worlds only). Delete calls the
 * delete-account edge function, which stops Stripe billing first and refuses
 * to continue if it cannot, then removes files and the account.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { mapError } from "@/lib/ship-voice";

const CONFIRMATION = "DELETE";

const AccountDataSettings = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exporting, setExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.rpc("export_account_data");
      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stellarforge-account-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "ACCOUNT ARCHIVE DOWNLOADED.", description: "Every record on file, in one JSON document." });
    } catch (err) {
      toast({ title: "EXPORT FAILED.", description: mapError(err), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (typed !== CONFIRMATION) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirm: CONFIRMATION },
      });
      if (error) {
        // A non-2xx carries the function's own reason in the response body,
        // e.g. "Billing could not be stopped. Account not deleted."
        const ctx = (error as { context?: Response }).context;
        const reason = ctx && typeof ctx.json === "function"
          ? await ctx.json().then((b: { error?: string }) => b?.error).catch(() => undefined)
          : undefined;
        throw new Error(reason || error.message);
      }
      if (!data?.deleted) throw new Error(data?.error || "Account not deleted");

      setDialogOpen(false);
      await signOut().catch(() => undefined);
      toast({ title: "ACCOUNT DELETED.", description: "All records and billing terminated." });
      navigate("/");
    } catch (err) {
      toast({
        title: "DELETION HALTED. ACCOUNT INTACT.",
        description: mapError(err),
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-sf-primary-text" aria-hidden="true" />
        <h3 className="font-heading text-lg font-medium">Your Data</h3>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-t2 sf-measure">
          Download every record on file: profile, subscription, every world you own in full,
          your writing, simulations, and settings. One JSON document.
        </p>
        <Button variant="outline" className="w-full gap-2" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader variant="inline" size="sm" /> : <Download className="w-4 h-4" aria-hidden="true" />}
          Download all my data
        </Button>
      </div>

      <div className="space-y-2 border-t border-sf-line-hairline pt-6">
        <p className="text-sm text-t2 sf-measure">
          Deleting your account cancels any subscription immediately, then permanently removes your
          worlds, writing and uploaded images. Anything you wrote inside someone else's world stays
          with that world. This cannot be undone. Download your data first.
        </p>
        <Button
          variant="outline"
          className="w-full gap-2 border-sf-crimson text-sf-crimson-text hover:border-sf-crimson hover:text-sf-crimson-text"
          onClick={() => {
            setTyped("");
            setDialogOpen(true);
          }}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          Delete account
        </Button>
      </div>

      <AlertDialog open={dialogOpen} onOpenChange={(open) => !deleting && setDialogOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account</AlertDialogTitle>
            <AlertDialogDescription className="text-t2">
              Billing stops now and every world you own is erased. There is no recovery.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Type {CONFIRMATION} to confirm</Label>
            <Input
              id="delete-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={deleting}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDelete}
              disabled={typed !== CONFIRMATION || deleting}
            >
              {deleting ? <Loader variant="inline" size="sm" /> : <Trash2 className="w-4 h-4" aria-hidden="true" />}
              Delete permanently
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountDataSettings;
