import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/glass-panel";
import { scrollRevealStagger, fadeUpItem, scrollReveal, viewportOnce } from "@/lib/animations";

const PRINCIPLES = [
  {
    n: "01",
    label: "THE CASCADE",
    body:
      "Define gravity once. Biology, psychology, mythology, and culture rearrange themselves around it. Every upstream choice carries a downstream cost.",
  },
  {
    n: "02",
    label: "CROSS-TOOL INTEGRATION",
    body:
      "Your spacecraft already knows what your atmosphere is made of. Your species already knows what your moon does to their seasons. No duplicate entry.",
  },
  {
    n: "03",
    label: "YOUR WORLDS, EXPORTED",
    body: "PDF, Notion, JSON, world bible. Read-only share links. They leave clean.",
  },
] as const;

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
        <div className="inline-flex items-center gap-3.5 font-mono uppercase text-sf-teal/80 text-[12px] tracking-[3px] mb-10">
          <span aria-hidden className="block w-12 h-px bg-sf-teal" />
          <span>// why stellarforge</span>
        </div>

        <motion.ol
          className="space-y-0"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scrollRevealStagger}
        >
          {PRINCIPLES.map((p, i) => (
            <motion.li
              key={p.n}
              className="grid grid-cols-[auto_1fr] gap-x-6 md:gap-x-10 py-8 first:pt-0"
              variants={fadeUpItem}
            >
              <span className="font-mono text-[12px] tracking-[0.18em] text-sf-amber-warm pt-1">
                {p.n}
              </span>
              <div className="space-y-3">
                <h3 className="font-serif italic text-xl text-t1">
                  {p.label}
                </h3>
                <p className="font-sans text-t2 leading-[1.55] max-w-[60ch]">
                  {p.body}
                </p>
              </div>
              {i < PRINCIPLES.length - 1 && (
                <span
                  aria-hidden
                  className="col-span-2 h-px mt-8 bg-gradient-to-r from-transparent via-sf-teal-bright/25 to-transparent"
                />
              )}
            </motion.li>
          ))}
        </motion.ol>
      </GlassPanel>
    </motion.section>
  );
};

export default ValueProposition;
