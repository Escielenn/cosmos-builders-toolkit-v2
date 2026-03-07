import { motion } from "framer-motion";
import { scrollReveal, viewportOnce, easing } from "@/lib/animations";
import type { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const ScrollReveal = ({ children, delay = 0, className }: ScrollRevealProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={viewportOnce}
    variants={{
      hidden: scrollReveal.hidden,
      visible: {
        ...scrollReveal.visible,
        transition: {
          duration: 0.5,
          delay,
          ease: easing.outExpo as unknown as number[],
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);
