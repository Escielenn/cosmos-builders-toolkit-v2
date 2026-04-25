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
      {/* April 2026 handoff — ambient parallax telemetry behind hero */}
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <ParallaxStrips height={520} />
      </div>
      <motion.section
        className="relative z-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Mono eyebrow with teal hairline rule (sg-hero-mono pattern) */}
        <motion.div variants={fadeUpItem}>
          <div className="inline-flex items-center gap-3.5 font-mono uppercase text-sf-teal text-[12px] tracking-[3px] mb-7">
            <span aria-hidden className="block w-12 h-px bg-sf-teal" />
            <span>// SCIENCE FICTION WORLDBUILDING</span>
          </div>
        </motion.div>

        {/* Hero H1 — text-sf-hero (96px), display, sentence case */}
        <motion.h1
          className="font-display font-light text-sf-hero leading-[0.98] text-t1 mb-7 max-w-[12ch]"
          variants={heroReveal}
        >
          Build worlds <em className="not-italic text-sf-teal">that feel real.</em>
        </motion.h1>

        {/* Subhead — sf-body t2 19px max-w 780 */}
        <motion.p
          className="font-sans text-[19px] text-t2 max-w-[780px] mb-12 leading-[1.55]"
          variants={fadeUpItem}
        >
          Define your planet's gravity, and watch how it shapes biology, psychology,
          mythology, and culture. Every tool builds on the last — creating worlds
          with internal consistency and depth.
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
          3 TOOLS FREE FOREVER · 27 MORE WITH PRO CLEARANCE
        </motion.p>

        <motion.p
          className="mt-10 font-sans text-sm italic text-sf-stellar/60 tracking-wide"
          variants={fadeUpItem}
        >
          These worlds exist in you. Waiting to be found.
        </motion.p>
      </motion.section>
    </BracketPanel>
  );
};

export default WelcomeHero;
