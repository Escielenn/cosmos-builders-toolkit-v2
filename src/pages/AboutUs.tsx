import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Link } from "react-router-dom";
import { ArrowLeft, Compass, Layers, User, Sparkles } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background sf-atmosphere">
      <Header />

      <main className="relative container mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-light tracking-sf-title text-tier-1 mb-4">
            ABOUT STELLARFORGE
          </h1>
          <p className="text-lg text-tier-2 max-w-2xl mx-auto leading-relaxed">
            A science fiction worldbuilding platform for writers who demand
            scientific credibility alongside creative imagination.
          </p>
        </section>

        {/* The Story */}
        <section className="max-w-3xl mx-auto mb-16">
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-[#15C17B]/[0.06] border border-[#15C17B]/[0.15]">
                <Compass className="w-4 h-4 text-[#15C17B]" />
              </div>
              <h2 className="font-heading text-xl font-light uppercase tracking-[2px] text-tier-1">
                The Story
              </h2>
            </div>
            <div className="space-y-4 text-tier-2 leading-relaxed">
              <p>
                StellarForge began as a curriculum for a science fiction writing
                workshop. The core insight was simple: most worldbuilding tools
                treat their subject as a creative free-for-all, generating
                planets and species from random tables with no internal logic.
                The result is worlds that feel arbitrary rather than inevitable.
              </p>
              <p>
                We took a different approach. Real worlds are shaped by causality.
                Change the mass of a star and you change the habitable zone.
                Change the habitable zone and you change the atmosphere. Change
                the atmosphere and you change what can live there. Change biology
                and you change psychology, mythology, culture, language.
              </p>
              <p>
                This is the Environmental Cascade principle that runs through
                every tool on the platform: Physics leads to Environment,
                Environment shapes Biology, Biology drives Psychology, Psychology
                gives rise to Mythology, and Mythology crystallizes into Culture.
                Change something upstream and everything downstream shifts in
                ways that are surprising yet scientifically grounded.
              </p>
            </div>
          </GlassPanel>
        </section>

        {/* Environmental Cascade */}
        <section className="max-w-3xl mx-auto mb-16">
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-[#5B8DEF]/[0.06] border border-[#5B8DEF]/[0.15]">
                <Layers className="w-4 h-4 text-[#5B8DEF]" />
              </div>
              <h2 className="font-heading text-xl font-light uppercase tracking-[2px] text-tier-1">
                The Cascade
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 py-4">
              {[
                { label: "Physics", color: "#FFB800" },
                { label: "Environment", color: "#4D9FFF" },
                { label: "Biology", color: "#00FF88" },
                { label: "Psychology", color: "#9B5DE5" },
                { label: "Mythology", color: "#5B8DEF" },
                { label: "Culture", color: "#15C17B" },
              ].map((step, i) => (
                <span key={step.label} className="flex items-center gap-2">
                  <span
                    className="font-mono text-sm tracking-wide"
                    style={{ color: step.color }}
                  >
                    {step.label}
                  </span>
                  {i < 5 && (
                    <span className="text-tier-5 text-xs select-none">
                      &rarr;
                    </span>
                  )}
                </span>
              ))}
            </div>
            <p className="text-tier-2 leading-relaxed mt-4">
              Each layer builds on what came before. Each output becomes input
              for what follows. The result is worlds with genuine internal
              consistency, the kind of lived-in coherence that separates
              memorable science fiction from forgettable rubber-suit aliens.
            </p>
          </GlassPanel>
        </section>

        {/* Founder */}
        <section className="max-w-3xl mx-auto mb-16">
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-[#9B5DE5]/[0.06] border border-[#9B5DE5]/[0.15]">
                <User className="w-4 h-4 text-[#9B5DE5]" />
              </div>
              <h2 className="font-heading text-xl font-light uppercase tracking-[2px] text-tier-1">
                The Founder
              </h2>
            </div>
            <div className="space-y-4 text-tier-2 leading-relaxed">
              <p>
                <span className="text-tier-1 font-medium">
                  Jason D. Batt, Ph.D.
                </span>{" "}
                is a writer, educator, and researcher whose work sits at the
                intersection of science, narrative, and technology. He built
                StellarForge to solve a problem he encountered teaching science
                fiction workshops: beginning writers wanted rigorous,
                science-based tools for worldbuilding, not random generators or
                vague creative prompts.
              </p>
              <p>
                The platform grew from that workshop curriculum into a full suite
                of calculators, simulators, and structured worksheets, each one
                designed to help writers think through the consequences of their
                creative choices.
              </p>
            </div>
          </GlassPanel>
        </section>

        {/* Mission / Tagline */}
        <section className="max-w-3xl mx-auto mb-16 text-center">
          <GlassPanel className="p-8 sm:p-12" glow>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-[#15C17B]" />
            </div>
            <p className="font-display text-2xl md:text-3xl font-light tracking-sf-title text-tier-1 mb-4">
              These worlds exist in you.
            </p>
            <p className="font-display text-2xl md:text-3xl font-light tracking-sf-title text-tier-1 mb-8">
              Waiting to be found.
            </p>
            <p className="text-tier-3 text-sm leading-relaxed max-w-lg mx-auto">
              StellarForge is built for writers who believe that the best science
              fiction begins with a question, not a formula. Our tools help you
              explore the consequences of that question, rigorously and
              imaginatively.
            </p>
          </GlassPanel>
        </section>

        {/* Back link */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-tier-3 hover:text-[#15C17B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-heading text-xs uppercase tracking-[1.5px]">
              Return Home
            </span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
