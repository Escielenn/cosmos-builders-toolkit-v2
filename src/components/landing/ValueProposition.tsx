import { Layers, Share2, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { scrollRevealStagger, fadeUpItem, scrollReveal, viewportOnce } from "@/lib/animations";

const ValueProposition = () => {
  return (
    <motion.section
      className="mb-16"
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={scrollReveal}
    >
      <GlassPanel glow lightArc className="p-8 md:p-12">
        <h2 className="font-heading font-light text-2xl uppercase tracking-sf-wide text-center mb-10">
          Why StellarForge?
        </h2>
        <motion.div
          className="grid md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scrollRevealStagger}
        >
          <motion.div className="text-center md:text-left" variants={fadeUpItem}>
            <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-heading font-light text-lg mb-2 uppercase tracking-wider">
              Systematic Worldbuilding
            </h3>
            <p className="text-sm text-muted-foreground">
              Every choice cascades logically. Define gravity, and watch how it
              shapes biology, architecture, psychology, and mythology.
            </p>
          </motion.div>
          <motion.div className="text-center md:text-left" variants={fadeUpItem}>
            <div className="w-12 h-12 rounded-none bg-accent/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
              <Share2 className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-heading font-light text-lg mb-2 uppercase tracking-wider">
              Cross-Tool Integration
            </h3>
            <p className="text-sm text-muted-foreground">
              Data flows between tools. Your spacecraft references your planet's
              atmosphere automatically—no duplicate entry.
            </p>
          </motion.div>
          <motion.div className="text-center md:text-left" variants={fadeUpItem}>
            <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center mb-4 mx-auto md:mx-0">
              <FileDown className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-heading font-light text-lg mb-2 uppercase tracking-wider">
              Export Everything
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate beautiful PDFs, print-friendly views, and JSON exports.
              Share your worlds with collaborators via read-only links.
            </p>
          </motion.div>
        </motion.div>
      </GlassPanel>
    </motion.section>
  );
};

export default ValueProposition;
