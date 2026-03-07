import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Compass } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import FieldManualSheet from "./FieldManualSheet";

const FieldManualFAB = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Hide on auth page or when not logged in
  if (!user || pathname === "/auth") return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sf-comm-button shadow-lg"
      >
        <Compass className="w-4 h-4" />
        <span>FIELD MANUAL</span>
      </button>
      <FieldManualSheet open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FieldManualFAB;
