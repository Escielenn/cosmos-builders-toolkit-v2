import { Link } from "react-router-dom";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/button";

const SharedPageHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-sf-line-hairline bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Wordmark size="sm" to="/" />
        <Button size="sm" asChild>
          <Link to="/">Create your own</Link>
        </Button>
      </div>
    </header>
  );
};

export default SharedPageHeader;
