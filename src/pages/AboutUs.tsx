import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { GlassPanel } from "@/components/ui/glass-panel";
import { Compass, Layers, User, Sparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-chrome";
import { useMetaTags } from "@/hooks/use-meta-tags";

const AboutUs = () => {
  useMetaTags({
    title: "About StellarForge",
    description: "Why StellarForge exists, and the Environmental Cascade behind every tool.",
  });

  return (
    <div className="min-h-screen bg-sf-void sf-atmosphere">
      <Header />

      <main className="relative">
        <PageContainer variant="standalone">
        <PageHeader
          size="page"
          eyebrow="About"
          title="About StellarForge"
          lede="Worldbuilding instruments and a writing studio for science fiction writers who want their worlds to hold up."
        />

        {/* The Story */}
        <section className="max-w-3xl mb-16">
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-sf-primary/[0.06] border border-sf-primary">
                <Compass className="w-4 h-4 text-sf-primary-text" />
              </div>
              <h2 className="font-display text-sf-h3 font-light text-t1">
                The story
              </h2>
            </div>
            <div className="space-y-4 text-t2 leading-relaxed">
              <p>
                StellarForge began as a curriculum for a science fiction writing
                workshop. Most worldbuilding tools treat a world as a creative
                free-for-all, rolling planets and species from random tables
                with no internal logic. The worlds that come out of them feel
                arbitrary rather than inevitable.
              </p>
              <p>
                We took a different approach. Real worlds are shaped by causality.
                Change the mass of a star and you change the habitable zone.
                Change the habitable zone and you change the atmosphere. Change
                the atmosphere and you change what can live there. Change biology
                and you change psychology, mythology, culture, and language.
              </p>
              <p>
                This is the Environmental Cascade principle that runs through
                every tool on the platform: Physics leads to Environment,
                Environment shapes Biology, Biology drives Psychology, Psychology
                gives rise to Mythology, and Mythology crystallizes into Culture.
                Change something upstream and everything downstream shifts, often
                in ways you did not see coming, always for a reason you can trace.
              </p>
            </div>
          </GlassPanel>
        </section>

        {/* Environmental Cascade */}
        <section className="max-w-3xl mb-16">
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-sf-stellar/[0.06] border border-sf-stellar">
                <Layers className="w-4 h-4 text-sf-stellar-text" />
              </div>
              <h2 className="font-display text-sf-h3 font-light text-t1">
                The cascade
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 py-4">
              {[
                { label: "Physics", color: "var(--sf-amber-text)" },
                { label: "Environment", color: "var(--sf-azure-text)" },
                { label: "Biology", color: "var(--sf-emerald-text)" },
                { label: "Psychology", color: "var(--sf-magenta-text)" },
                { label: "Mythology", color: "var(--sf-stellar-text)" },
                { label: "Culture", color: "var(--sf-violet-text)" },
              ].map((step, i) => (
                <span key={step.label} className="flex items-center gap-2">
                  <span
                    className="font-mono text-sm tracking-wide"
                    style={{ color: step.color }}
                  >
                    {step.label}
                  </span>
                  {i < 5 && (
                    <span className="text-t4 text-xs select-none">
                      &rarr;
                    </span>
                  )}
                </span>
              ))}
            </div>
            <p className="text-t2 leading-relaxed mt-4">
              Each layer takes its inputs from the one before it. A world built
              this way holds together, and its aliens are shaped by where they
              evolved instead of being humans in rubber suits.
            </p>
          </GlassPanel>
        </section>

        {/* Founder */}
        <section className="max-w-3xl mb-16">
          <GlassPanel className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 flex items-center justify-center bg-sf-violet/[0.06] border border-sf-violet">
                <User className="w-4 h-4 text-sf-violet-text" />
              </div>
              <h2 className="font-display text-sf-h3 font-light text-t1">
                The founder
              </h2>
            </div>
            <div className="space-y-4 text-t2 leading-relaxed">
              <p>
                <span className="text-t1 font-medium">
                  Jason D. Batt, Ph.D.
                </span>{" "}
                is a writer, educator, and researcher who works across science,
                narrative, and technology. He built
                StellarForge to solve a problem he encountered teaching science
                fiction workshops: beginning writers wanted rigorous,
                science-based tools for worldbuilding, not random generators or
                vague creative prompts.
              </p>
              <p>
                That workshop curriculum grew into calculators, simulators,
                worksheets, and a writing studio, each built to help writers
                think through what their choices set in motion.
              </p>
            </div>
          </GlassPanel>
        </section>

        {/* Mission / Tagline */}
        <section className="max-w-3xl mb-16 text-center">
          <GlassPanel className="p-8 sm:p-12" glow>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-sf-primary-text" />
            </div>
            <p className="font-display text-2xl md:text-3xl font-light tracking-title text-t1 mb-4">
              These worlds exist in you.
            </p>
            <p className="font-display text-2xl md:text-3xl font-light tracking-title text-t1 mb-8">
              Waiting to be found.
            </p>
            <p className="text-t2 text-sm leading-relaxed max-w-lg mx-auto">
              The best science fiction begins with a question. StellarForge helps
              you follow it through physics, biology, and culture until you know
              what it means for the people in your story.
            </p>
          </GlassPanel>
        </section>

        </PageContainer>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
