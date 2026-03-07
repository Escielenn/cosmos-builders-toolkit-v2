/**
 * StellarForge Animation Utilities
 * Reusable framer-motion variants, easing functions, and hooks.
 */

import type { Variants, Transition } from "framer-motion";

// ─── Easing curves ────────────────────────────────────────────────────────────

export const easing = {
  outExpo: [0.16, 1, 0.3, 1] as const,
  outBack: [0.34, 1.56, 0.64, 1] as const,
  spring: [0.5, 1.5, 0.5, 1] as const,
};

// ─── Durations ────────────────────────────────────────────────────────────────

export const duration = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  smooth: 0.3,
  dramatic: 0.5,
};

// ─── Staggered container + child ──────────────────────────────────────────────

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: easing.outExpo as unknown as number[] },
  },
};

// ─── Hero text reveal ─────────────────────────────────────────────────────────

export const heroReveal: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.97,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: easing.outExpo as unknown as number[] },
  },
};

// ─── Scroll reveal (for whileInView) ─────────────────────────────────────────

export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easing.outExpo as unknown as number[] },
  },
};

export const scrollRevealStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

// ─── Modal transitions ───────────────────────────────────────────────────────

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.fast },
  },
};

export const modalContent: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: easing.outExpo as unknown as number[] },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: duration.fast },
  },
};

// ─── Copy feedback ───────────────────────────────────────────────────────────

export const iconSwap: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5 },
};

// ─── Mobile menu ─────────────────────────────────────────────────────────────

export const mobileMenu: Variants = {
  closed: { x: "-100%", opacity: 0 },
  open: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

export const mobileMenuItem: Variants = {
  closed: { x: -20, opacity: 0 },
  open: {
    x: 0,
    opacity: 1,
  },
};

// ─── Spring transition preset ────────────────────────────────────────────────

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// ─── Viewport options ────────────────────────────────────────────────────────

export const viewportOnce = { once: true, margin: "-50px" as const };
