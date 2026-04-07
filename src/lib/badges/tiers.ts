import type { BadgeTier } from "./definitions";

export interface TierStyle {
  bg: string;
  border: string;
  text: string;
  glow?: string;
  animation?: string;
  earnMessage: string;
}

export const TIER_STYLES: Record<BadgeTier, TierStyle> = {
  nascent: {
    bg: "bg-primary/[0.03]",
    border: "border-primary/[0.08]",
    text: "text-primary/60",
    earnMessage: "Your first step into the cascade.",
  },
  forming: {
    bg: "bg-primary/[0.06]",
    border: "border-primary/[0.15]",
    text: "text-primary",
    earnMessage: "The framework takes shape.",
  },
  stellar: {
    bg: "bg-primary/[0.06]",
    border: "border-primary/[0.15]",
    text: "text-primary",
    glow: "shadow-[0_0_12px_hsl(157_100%_62%/0.15)]",
    earnMessage: "You see the system now -not just the parts.",
  },
  legendary: {
    bg: "bg-amber-500/[0.06]",
    border: "border-amber-500/[0.2]",
    text: "text-amber-400",
    glow: "shadow-[0_0_16px_hsl(43_100%_50%/0.2)]",
    animation: "animate-pulse",
    earnMessage: "A mark few will ever carry.",
  },
};

export const TIER_LABELS: Record<BadgeTier, string> = {
  nascent: "Nascent",
  forming: "Forming",
  stellar: "Stellar",
  legendary: "Legendary",
};
