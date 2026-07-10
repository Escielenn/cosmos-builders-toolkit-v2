import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        glass: "hsl(var(--glass))",
        // StellarForge accent spectrum (use ONE per component as focal point)
        sf: {
          void: "hsl(var(--sf-void))",
          surface: "hsl(var(--sf-surface))",
          "surface-elevated": "hsl(var(--sf-surface-elevated))",
          cyan: "hsl(var(--sf-cyan))",
          magenta: "hsl(var(--sf-magenta))",
          violet: "hsl(var(--sf-violet))",
          amber: "hsl(var(--sf-amber))",
          "amber-warm": "hsl(var(--sf-accent-amber))",
          emerald: "hsl(var(--sf-emerald))",
          crimson: "hsl(var(--sf-crimson))",
          azure: "hsl(var(--sf-azure))",
          teal: "hsl(var(--sf-teal))",
          "teal-bright": "hsl(var(--sf-teal-bright))",
          stellar: "hsl(var(--sf-stellar))",
          border: "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.14)",
        },
        // Text tiers (April 2026 handoff — use alongside .text-tier-* classes)
        t1: "#FAFAFA",
        t2: "#C8C8C8",
        t3: "rgba(255, 255, 255, 0.45)",
        t4: "rgba(255, 255, 255, 0.28)",
        t5: "rgba(255, 255, 255, 0.15)",
        // Scrollbar swatches
        "sb-track": "#0A0E17",
        "sb-thumb": "#2E3548",
        "sb-thumb-hover": "#3D4658",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "4px",
        sm: "3px",
        xs: "2px",
        "sf-tag": "2px", // reserved for <Tag /> only
      },
      fontSize: {
        // April 2026 handoff scale — use sf-* for all new display type
        "sf-hero":    ["96px", { lineHeight: "0.98", letterSpacing: "0.03em", fontWeight: "300" }],
        "sf-h1":      ["56px", { lineHeight: "1",    letterSpacing: "0.04em", fontWeight: "300" }],
        "sf-h2":      ["36px", { lineHeight: "1.15", letterSpacing: "0.03em", fontWeight: "300" }],
        "sf-h3":      ["24px", { lineHeight: "1.25", letterSpacing: "0.02em", fontWeight: "400" }],
        "sf-body":    ["15px", { lineHeight: "1.55" }],
        "sf-small":   ["13px", { lineHeight: "1.55" }],
        "sf-mono":    ["11px", { lineHeight: "1.4", letterSpacing: "0.18em" }],
        "sf-eyebrow": ["11px", { lineHeight: "1.2", letterSpacing: "0.2em",  fontWeight: "500" }],
      },
      spacing: {
        "sf-1":  "4px",
        "sf-2":  "8px",
        "sf-3":  "12px",
        "sf-4":  "16px",
        "sf-5":  "20px",
        "sf-6":  "24px",
        "sf-8":  "32px",
        "sf-10": "40px",
        "sf-12": "48px",
        "sf-16": "64px",
        "sf-20": "80px",
        "sf-24": "120px",
      },
      transitionDuration: {
        fast:    "120ms",
        base:    "180ms",
        slow:    "280ms",
        ambient: "2400ms",
      },
      transitionTimingFunction: {
        "sf-out":   "cubic-bezier(0.2, 0, 0, 1)",
        "sf-inout": "cubic-bezier(0.4, 0, 0.2, 1)",
        "sf-snap":  "cubic-bezier(0.6, 0, 0.1, 1)",
      },
      boxShadow: {
        "sf-glow-teal":    "0 0 24px rgba(61,255,205,0.30)",
        "sf-glow-amber":   "0 0 20px rgba(255,184,0,0.25)",
        "sf-glow-crimson": "0 0 20px rgba(255,51,102,0.25)",
        "sf-inset-teal":   "inset 0 0 20px rgba(61,255,205,0.08)",
      },
      backdropBlur: {
        "sf-panel": "16px",
        "sf-side":  "20px",
      },
      fontFamily: {
        // StellarForge Design System v2.1 fonts (Inter is forbidden)
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["MD Nichrome", "Jura", "system-ui", "sans-serif"],
        heading: ["Jura", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        serif: ["Lora", "Georgia", "serif"], // writer register only (Studio/editor)
      },
      letterSpacing: {
        // StellarForge typography spacing
        "sf-title": "0.08em", // Tool page titles (Nichrome)
        "sf-wide": "0.2em",   // Standard uppercase headlines
        "sf-ultra": "0.4em",  // Hero/display text
      },
      fontWeight: {
        // StellarForge uses extremes: ultralight (300) vs medium (500)
        "sf-light": "300",
        "sf-normal": "400",
        "sf-medium": "500",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "sf-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%":      { opacity: "1" },
        },
        "sf-scan": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "sf-pulse": "sf-pulse 2.4s ease-in-out infinite",
        "sf-scan":  "sf-scan 6s linear infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
