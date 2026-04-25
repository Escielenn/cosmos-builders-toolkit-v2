import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const handleSignUp = () => {
    onOpenChange(false);
    navigate("/auth");
  };

  const handleLogIn = () => {
    onOpenChange(false);
    navigate("/auth?tab=login");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            AUTHENTICATION REQUIRED
          </DialogTitle>
          <DialogDescription>
            Establish credentials to access the archive.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-4">
          <Button className="w-full gap-2" size="lg" onClick={handleSignUp}>
            <UserPlus className="w-4 h-4" />
            CREATE ACCOUNT
          </Button>
          <Button variant="outline" className="w-full gap-2" size="lg" onClick={handleLogIn}>
            <LogIn className="w-4 h-4" />
            AUTHENTICATE
          </Button>
        </div>
        <p className="text-xs text-t3 text-center mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredDialog;
