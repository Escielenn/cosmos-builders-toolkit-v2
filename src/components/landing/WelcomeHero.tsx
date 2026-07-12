import { Rocket, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { heroReveal, staggerContainer, fadeUpItem } from "@/lib/animations";
import { BracketPanel } from "@/components/ui/bracket-panel";
import { ParallaxStrips } from "@/components/ambient/ParallaxStrips";

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
          <div className="inline-flex items-center gap-3.5 font-mono uppercase text-sf-teal/80 text-[11px] tracking-[3px] mb-7">
            <span aria-hidden className="block w-12 h-px bg-sf-teal/60" />
            <span>// open early access</span>
          </div>
        </motion.div>

        {/* Hero H1 — MD Nichrome brand anchor + Lora-italic warmth accent (Studio meld) */}
        <motion.h1
          className="font-display font-light text-sf-hero leading-[0.98] text-t1 mb-7 max-w-[12ch]"
          variants={heroReveal}
        >
          Build worlds{" "}
          <em className="font-serif italic text-sf-teal">that feel real.</em>
        </motion.h1>

        {/* Subhead — warmer, with a Lora-italic lead-in */}
        <motion.p
          className="font-sans text-[19px] text-t2 max-w-[780px] mb-12 leading-[1.6]"
          variants={fadeUpItem}
        >
          <span className="font-serif italic text-t1">Change one thing, and everything shifts.</span>{" "}
          Set your planet's gravity and watch it ripple through biology, psychology,
          mythology, and culture. Every tool builds on the last, so your worlds hold
          together with real internal consistency.
        </motion.p>

        {/* CTA buttons */}
        <motion.div className="flex flex-wrap gap-4 mb-12" variants={fadeUpItem}>
          <Button variant="sf-primary" size="sf-lg" className="gap-2" asChild>
            <Link to="/auth">
              <Rocket className="w-5 h-5" />
              BEGIN
            </Link>
          </Button>
          <Button variant="sf-ghost" size="sf-lg" className="gap-2" asChild>
            <Link to="/features">
              <Sparkles className="w-5 h-5" />
              VIEW MANIFEST
            </Link>
          </Button>
        </motion.div>

        <motion.p
          className="font-mono text-[11px] tracking-[0.18em] uppercase text-t4"
          variants={fadeUpItem}
        >
          3 tools free forever · 27 more with Pro
        </motion.p>

        {/* Early-access disclaimer, warmer voice */}
        <motion.p
          className="mt-6 font-sans text-sm text-t3 max-w-[640px] leading-[1.6]"
          variants={fadeUpItem}
        >
          Still under construction. Surfaces may shift. Your feedback shapes what we ship.
        </motion.p>

        {/* Signature tagline — Lora serif, the Studio voice */}
        <motion.p
          className="mt-10 font-serif text-[17px] italic text-sf-stellar/70"
          variants={fadeUpItem}
        >
          These worlds exist in you. Waiting to be found.
        </motion.p>
      </motion.section>
    </BracketPanel>
  );
};

export default WelcomeHero;
