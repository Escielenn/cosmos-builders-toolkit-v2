import { Rocket, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const WelcomeHero = () => {
  return (
    <section className="text-center mb-8 py-12 md:py-16">
      {/* Badge with reveal animation */}
      <Badge className="mb-8 sf-reveal sf-reveal-1" variant="secondary">
        <Sparkles className="w-3 h-3 mr-1" />
        Science Fiction Worldbuilding Tools
      </Badge>

      {/* Main headline - StellarForge: ultralight weight, uppercase, wide letter-spacing */}
      <h1 className="font-display font-light text-4xl md:text-5xl lg:text-7xl mb-6 leading-tight sf-reveal sf-reveal-2">
        <span className="uppercase tracking-sf-wide">Build Worlds</span>
        <br />
        <span className="gradient-text uppercase tracking-sf-wide">That Feel Real</span>
      </h1>

      {/* Subhead - body font, normal weight */}
      <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed sf-reveal sf-reveal-3">
        Define your planet's gravity, and watch how it shapes architecture, biology,
        psychology, and mythology. Every tool builds on the last—creating worlds
        with internal consistency and depth.
      </p>

      {/* CTA buttons with reveal */}
      <div className="flex flex-wrap gap-4 justify-center mb-12 sf-reveal sf-reveal-4">
        <Button size="lg" className="gap-2 text-base px-8" asChild>
          <Link to="/auth?tab=signup">
            <Rocket className="w-5 h-5" />
            Start Free
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="gap-2 text-base px-8" asChild>
          <Link to="/features">
            <Sparkles className="w-5 h-5" />
            See Features
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground sf-reveal sf-reveal-5">
        3 tools free forever • 5 more with Pro
      </p>
    </section>
  );
};

export default WelcomeHero;
