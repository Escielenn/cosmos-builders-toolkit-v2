import { Rocket, Sparkles, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { heroReveal, staggerContainer, fadeUpItem } from "@/lib/animations";
import { BracketPanel } from "@/components/ui/bracket-panel";
import { ParallaxStrips } from "@/components/ambient/ParallaxStrips";
import { FREE_TOOL_COUNT, PRO_TOOL_COUNT } from "@/lib/tools-config";

/**
 * Marketing hero. Leads with the Prime Law (decide what is true about the
 * universe, then write it; the world pushes back on the page) and shows the
 * Studio doing exactly that: a scene beside its canon rail.
 */
const WelcomeHero = () => {
  return (
    <BracketPanel className="relative mb-8 py-16 md:py-24 px-6 md:px-12 overflow-hidden">
      {/* April 2026 handoff, ambient parallax telemetry behind hero */}
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <ParallaxStrips height={520} />
      </div>
      <motion.section
        className="relative z-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Mono eyebrow (telemetry soul, kept but quieter) */}
        <motion.div variants={fadeUpItem}>
          <div className="inline-flex items-center gap-3.5 font-mono uppercase text-sf-primary-text text-xs tracking-wide mb-7">
            <span aria-hidden className="block w-12 h-px bg-sf-primary" />
            <span>// open early access</span>
          </div>
        </motion.div>

        {/* Hero H1, MD Nichrome brand anchor + Lora-italic warmth accent (Studio meld) */}
        <motion.h1
          className="font-display font-light text-sf-hero leading-[0.98] text-t1 mb-10 max-w-[16ch]"
          variants={heroReveal}
        >
          Decide what is true.{" "}
          <em className="font-serif italic text-sf-primary-text">Then write it.</em>
        </motion.h1>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div>
            {/* Subhead, with a Lora-italic lead-in */}
            <motion.p
              className="font-sans text-[19px] text-t2 max-w-[640px] mb-10 leading-[1.6]"
              variants={fadeUpItem}
            >
              <span className="font-serif italic text-t1">The world pushes back on the page.</span>{" "}
              StellarForge is a science fiction writing studio built on the
              decisions you make about your universe. Set a planet's gravity, a
              species' senses, a culture's gods, and every scene you write knows
              them. Claims in your prose are captured, contradictions are
              flagged, and when a fact changes, the chapters it touches say so.
            </motion.p>

            {/* CTA buttons */}
            <motion.div className="flex flex-wrap gap-4 mb-10" variants={fadeUpItem}>
              <Button variant="sf-primary" size="sf-lg" className="gap-2" asChild>
                <Link to="/auth">
                  <Rocket className="w-5 h-5" />
                  Start writing
                </Link>
              </Button>
              <Button variant="sf-ghost" size="sf-lg" className="gap-2" asChild>
                <Link to="/features">
                  <Sparkles className="w-5 h-5" />
                  See the instruments
                </Link>
              </Button>
            </motion.div>

            <motion.p
              className="font-mono text-xs tracking-wide uppercase text-t4"
              variants={fadeUpItem}
            >
              Studio, Codex and Chronicle free · {FREE_TOOL_COUNT} instruments free · {PRO_TOOL_COUNT} more with Pro
            </motion.p>
          </div>

          <motion.div variants={fadeUpItem}>
            <StudioGlimpse />
          </motion.div>
        </div>

        {/* Early-access disclaimer, warmer voice */}
        <motion.p
          className="mt-10 font-sans text-sm text-t3 max-w-[640px] leading-[1.6]"
          variants={fadeUpItem}
        >
          We're still building StellarForge. Tools and surfaces will keep getting
          upgraded. Tell us what's working and what isn't. Your feedback genuinely
          shapes what we build next.
        </motion.p>

        {/* Signature tagline, Lora serif, the Studio voice */}
        <motion.p
          className="mt-10 font-serif text-[17px] italic text-sf-stellar-text"
          variants={fadeUpItem}
        >
          These worlds exist in you. Waiting to be found.
        </motion.p>
      </motion.section>
    </BracketPanel>
  );
};

/**
 * A still of the Studio: one scene and the canon rail beside it. Static
 * markup, not a screenshot, so it follows the user's theme and stays crisp.
 * The scene is the North Star's: a Verrid POV cannot see a red sunset.
 */
function StudioGlimpse() {
  return (
    <figure className="border border-sf-line bg-sf-surface" aria-label="The Studio: a scene beside its canon rail">
      {/* Window bar */}
      <div className="flex items-center justify-between gap-3 border-b border-sf-line-hairline px-4 py-2.5">
        <span className="font-mono text-sf-mono uppercase text-t4">Studio · Ch. 14 · Scene 2</span>
        <span className="font-mono text-sf-mono uppercase text-t4">1,284 words</span>
      </div>

      <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,200px)]">
        {/* The page */}
        <div className="px-5 py-5 sm:border-r sm:border-sf-line-hairline">
          <p className="font-serif text-[16px] leading-[1.7] text-t2">
            Ilsevar stood at the rim while the sun went down behind the spires,{" "}
            <span className="text-t1 underline decoration-sf-amber decoration-2 underline-offset-4">
              watching the sky bleed red
            </span>
            . Somewhere below, the mourners began the song, all{" "}
            <span className="text-t1 underline decoration-sf-primary decoration-dotted decoration-2 underline-offset-4">
              seven tones of it
            </span>
            .
          </p>
        </div>

        {/* The canon rail */}
        <div className="border-t border-sf-line-hairline sm:border-t-0 px-4 py-4 space-y-4">
          <div>
            <p className="font-mono text-sf-mono uppercase text-t4 mb-1">POV · Verrid</p>
            <p className="text-[13px] leading-snug text-t2">
              No trichromatic vision. Hears infrasound.
            </p>
          </div>
          <div className="border-l-2 border-sf-amber pl-3">
            <p className="flex items-center gap-1.5 font-mono text-sf-mono uppercase text-sf-amber-text mb-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden />
              Contradiction
            </p>
            <p className="text-[13px] leading-snug text-t2">"bleed red" vs. Sensorium canon</p>
          </div>
          <div className="border-l-2 border-sf-primary pl-3">
            <p className="font-mono text-sf-mono uppercase text-sf-primary-text mb-1">
              Claim detected. Not on file.
            </p>
            <p className="text-[13px] leading-snug text-t2">Mourning song: 7 tones</p>
            <p className="mt-1.5 font-mono text-sf-mono uppercase text-t3">Adopt as canon?</p>
          </div>
        </div>
      </div>

      <figcaption className="border-t border-sf-line-hairline px-4 py-2.5 font-mono text-sf-mono uppercase text-t4">
        Gravity 1.8 g · Epoch 2340 CE · 2 scenes canon-changed
      </figcaption>
    </figure>
  );
}

export default WelcomeHero;
