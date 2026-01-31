import { FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

interface BetaBannerProps {
  position?: "top" | "bottom";
}

const BetaBanner = ({ position = "top" }: BetaBannerProps) => {
  return (
    <div
      className={`bg-primary/10 border-primary/20 text-primary py-2 px-4 text-center text-sm ${
        position === "top" ? "border-b" : "border-t"
      }`}
    >
      <div className="container mx-auto flex items-center justify-center gap-2">
        <FlaskConical className="w-4 h-4" />
        <span>
          <strong>StellarForge</strong> is currently in beta.{" "}
          <Link
            to="/contact?tab=beta"
            className="underline hover:text-primary/80 transition-colors"
          >
            We'd love your feedback!
          </Link>
        </span>
      </div>
    </div>
  );
};

export default BetaBanner;
