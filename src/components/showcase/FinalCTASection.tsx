import { Rocket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";

const FinalCTASection = () => {
  return (
    <section className="py-16 md:py-24">
      <GlassPanel glow lightArc className="p-8 md:p-12 text-center">
        {/* Decorative stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `cascade-glow ${2 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <h2 className="font-display font-light text-3xl md:text-4xl lg:text-5xl uppercase tracking-sf-wide mb-6 relative">
          ALL INSTRUMENTS
          <br />
          <span className="gradient-text">ON STANDBY.</span>
        </h2>

        <p className="text-lg text-t3 max-w-2xl mx-auto mb-10 relative">
          Join thousands of science fiction writers creating worlds with
          scientific rigor and narrative depth.
        </p>

        <div className="flex flex-wrap gap-4 justify-center relative">
          <Button size="lg" className="gap-2 text-base px-8" asChild>
            <Link to="/auth">
              <Rocket className="w-5 h-5" />
              Start Building Free
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2 text-base px-8"
            asChild
          >
            <Link to="/learn">
              Explore the Docs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap gap-6 justify-center text-sm text-t3 relative">
          <span>✓ 3 tools free forever</span>
          <span>✓ No credit card required</span>
          <span>✓ Export your work anytime</span>
        </div>
      </GlassPanel>
    </section>
  );
};

export default FinalCTASection;
