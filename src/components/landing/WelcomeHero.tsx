import { Rocket, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { heroReveal, staggerContainer, fadeUpItem, easing } from "@/lib/animations";
import { BracketPanel } from "@/components/ui/bracket-panel";

const WelcomeHero = () => {
  return (
    <BracketPanel className="mb-8 py-12 md:py-16">
      <motion.section
        className="text-center"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Badge with reveal animation */}
      <motion.div variants={fadeUpItem}>
        <Badge className="mb-8" variant="secondary">
          <Sparkles className="w-3 h-3 mr-1" />
          Science Fiction Worldbuilding Tools
        </Badge>
      </motion.div>

      {/* Main headline — blur-to-sharp reveal */}
      <motion.h1
        className="font-display font-light text-4xl md:text-5xl lg:text-7xl mb-6 leading-tight"
        variants={heroReveal}
      >
        <span className="uppercase tracking-sf-wide">Build Worlds</span>
        <br />
        <span className="gradient-text uppercase tracking-sf-wide">That Feel Real</span>
      </motion.h1>

      {/* Subhead */}
      <motion.p
        className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed"
        variants={fadeUpItem}
      >
        Define your planet's gravity, and watch how it shapes biology, psychology,
        mythology, and culture. Every tool builds on the last—creating worlds
        with internal consistency and depth.
      </motion.p>

      {/* CTA buttons */}
      <motion.div className="flex flex-wrap gap-4 justify-center mb-12" variants={fadeUpItem}>
        <Button size="lg" className="gap-2 text-base px-8" asChild>
          <Link to="/auth">
            <Rocket className="w-5 h-5" />
            BEGIN
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="gap-2 text-base px-8" asChild>
          <Link to="/features">
            <Sparkles className="w-5 h-5" />
            VIEW MANIFEST
          </Link>
        </Button>
      </motion.div>

      <motion.p
        className="text-sm text-muted-foreground"
        variants={fadeUpItem}
      >
        3 tools free forever • 27 (and counting) more with Pro Access
      </motion.p>

      <motion.p
        className="mt-8 text-sm italic text-[#5B8DEF]/60 tracking-wide"
        variants={fadeUpItem}
      >
        These worlds exist in you. Waiting to be found.
      </motion.p>
      </motion.section>
    </BracketPanel>
  );
};

export default WelcomeHero;
