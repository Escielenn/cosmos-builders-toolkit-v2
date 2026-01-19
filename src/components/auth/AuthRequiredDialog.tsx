import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthRequiredDialog = ({ open, onOpenChange }: AuthRequiredDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Sign in to Create Worlds
          </DialogTitle>
          <DialogDescription>
            Create an account to save and manage your worlds across devices.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button className="w-full gap-2" size="lg">
            <UserPlus className="w-4 h-4" />
            Sign Up
          </Button>
          <Button variant="outline" className="w-full gap-2" size="lg">
            <LogIn className="w-4 h-4" />
            Log In
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredDialog;
