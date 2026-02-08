import { Link } from "react-router-dom";
import CubeLogo from "@/components/icons/CubeLogo";
import { Button } from "@/components/ui/button";

const SharedPageHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <CubeLogo size={28} />
          <span className="font-display font-semibold text-lg">StellarForge</span>
        </Link>
        <Button size="sm" asChild>
          <Link to="/">Create your own</Link>
        </Button>
      </div>
    </header>
  );
};

export default SharedPageHeader;
