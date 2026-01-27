import { Rocket, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const WelcomeHero = () => {
  return (
    <section className="text-center mb-16 py-8">
      <Badge className="mb-6" variant="secondary">
        <Sparkles className="w-3 h-3 mr-1" />
        Science Fiction Worldbuilding Tools
      </Badge>

      <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
        Build Science Fiction Worlds
        <br />
        <span className="gradient-text">That Feel Real</span>
      </h1>

      <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
        Define your planet's gravity, and watch how it shapes architecture, biology,
        psychology, and mythology. Every tool builds on the last—creating worlds
        with internal consistency and depth.
      </p>

      <div className="flex flex-wrap gap-4 justify-center mb-12">
        <Button size="lg" className="gap-2 text-base px-8" asChild>
          <Link to="/auth?tab=signup">
            <Rocket className="w-5 h-5" />
            Start Free
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="gap-2 text-base px-8" asChild>
          <Link to="/learn">
            <BookOpen className="w-5 h-5" />
            Learn More
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        3 tools free forever • 5 more with Pro
      </p>
    </section>
  );
};

export default WelcomeHero;
