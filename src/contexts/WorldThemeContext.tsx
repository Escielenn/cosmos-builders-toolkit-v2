import { createContext, useContext, useMemo } from "react";
import type { WorldTheme } from "@/hooks/use-world";

interface WorldThemeValues {
  accentColor: string;
  accentColorRGB: string;
  coverImageUrl: string | null;
  icon: string | null;
  isPro: boolean;
}

const DEFAULT_ACCENT = "#3DFFCD";
const DEFAULT_RGB = "61, 255, 205";

const defaultTheme: WorldThemeValues = {
  accentColor: DEFAULT_ACCENT,
  accentColorRGB: DEFAULT_RGB,
  coverImageUrl: null,
  icon: null,
  isPro: false,
};

const WorldThemeContext = createContext<WorldThemeValues>(defaultTheme);

function hexToRGB(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return DEFAULT_RGB;
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "157 100% 62%";
  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function WorldThemeProvider({
  theme,
  isPro,
  children,
}: {
  theme: WorldTheme | undefined;
  isPro: boolean;
  children: React.ReactNode;
}) {
  const values = useMemo<WorldThemeValues>(() => {
    if (!isPro || !theme) return { ...defaultTheme, isPro };

    const accentColor = theme.accent_color || DEFAULT_ACCENT;
    const accentColorRGB = hexToRGB(accentColor);

    return {
      accentColor,
      accentColorRGB,
      coverImageUrl: theme.cover_image_url || null,
      icon: theme.icon || null,
      isPro,
    };
  }, [theme, isPro]);

  const hasCustomAccent = values.accentColor !== DEFAULT_ACCENT;

  return (
    <WorldThemeContext.Provider value={values}>
      {hasCustomAccent && (
        <style>{`
          .sf-world-layout {
            --sf-world-accent: ${values.accentColor};
            --sf-world-accent-rgb: ${values.accentColorRGB};
            --primary: ${hexToHSL(values.accentColor)};
            --accent: ${hexToHSL(values.accentColor)};
            --ring: ${hexToHSL(values.accentColor)};
          }
        `}</style>
      )}
      {children}
    </WorldThemeContext.Provider>
  );
}

export function useWorldTheme() {
  return useContext(WorldThemeContext);
}
