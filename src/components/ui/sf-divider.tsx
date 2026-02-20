import { cn } from "@/lib/utils";

interface SFDividerProps {
  /** Optional data burst label shown centered on the line */
  label?: string;
  className?: string;
}

const SFDivider = ({ label, className }: SFDividerProps) => (
  <div className={cn("sf-divider", className)} role="separator" aria-hidden="true">
    {label && <span className="sf-divider-data">{label}</span>}
  </div>
);

export default SFDivider;
