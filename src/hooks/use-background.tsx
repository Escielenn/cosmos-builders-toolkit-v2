import { useState, useEffect } from "react";

interface BackgroundOption {
  id: string;
  name: string;
  url?: string;
  type?: "image" | "gradient" | "color";
  value?: string;
  category: "default" | "space" | "gradient" | "color";
}

const BACKGROUND_OPTIONS: BackgroundOption[] = [
  // Default
  {
    id: "default",
    name: "Default Starfield",
    url: "",
    category: "default",
  },
  // Space Images
  {
    id: "nebula",
    name: "Nebula",
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80",
    category: "space",
  },
  {
    id: "earth",
    name: "Earth from Space",
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80",
    category: "space",
  },
  {
    id: "stars",
    name: "Star Field",
    url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1920&q=80",
    category: "space",
  },
  {
    id: "milkyway",
    name: "Milky Way",
    url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80",
    category: "space",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    url: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1920&q=80",
    category: "space",
  },
  {
    id: "aurora",
    name: "Aurora",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80",
    category: "space",
  },
  {
    id: "cosmos",
    name: "Deep Space",
    url: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1920&q=80",
    category: "space",
  },
  {
    id: "overview",
    name: "Overview",
    url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=1920&q=80",
    category: "space",
  },
  {
    id: "cosmic-dust",
    name: "Cosmic Dust",
    url: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80",
    category: "space",
  },
  {
    id: "blue-nebula",
    name: "Blue Nebula",
    url: "https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1920&q=80",
    category: "space",
  },
  // New Space Images
  {
    id: "space-station",
    name: "Space Station",
    url: "https://source.unsplash.com/rDaxHYjJC1o/1920x1080",
    category: "space",
  },
  {
    id: "distant-planet",
    name: "Distant Planet",
    url: "https://source.unsplash.com/nc1zsYGkLFA/1920x1080",
    category: "space",
  },
  {
    id: "earthrise",
    name: "Earthrise",
    url: "https://source.unsplash.com/xFO2Xt33xgI/1920x1080",
    category: "space",
  },
  {
    id: "exoplanet",
    name: "Exoplanet",
    url: "https://source.unsplash.com/WRSmfn96xNs/1920x1080",
    category: "space",
  },
  {
    id: "orbital-view",
    name: "Orbital View",
    url: "https://source.unsplash.com/yZygONrUBe8/1920x1080",
    category: "space",
  },
  {
    id: "dark-galaxy",
    name: "Dark Galaxy",
    url: "https://source.unsplash.com/0o_GEzyargo/1920x1080",
    category: "space",
  },
  {
    id: "starry-night",
    name: "Starry Night",
    url: "https://source.unsplash.com/1OtUkD_8svc/1920x1080",
    category: "space",
  },
  {
    id: "aurora-sky",
    name: "Aurora Sky",
    url: "https://source.unsplash.com/LhDWW8PhPoE/1920x1080",
    category: "space",
  },
  {
    id: "saturn",
    name: "Saturn",
    url: "https://source.unsplash.com/qxIObOAjoOc/1920x1080",
    category: "space",
  },
  {
    id: "red-nebula",
    name: "Red Nebula",
    url: "https://source.unsplash.com/-hI5dX2ObAs/1920x1080",
    category: "space",
  },
  {
    id: "lunar-eclipse",
    name: "Lunar Eclipse",
    url: "https://source.unsplash.com/F-pSZO_jeE8/1920x1080",
    category: "space",
  },
  {
    id: "blue-earth",
    name: "Blue Earth",
    url: "https://source.unsplash.com/Jn2EaLLYZfY/1920x1080",
    category: "space",
  },
  {
    id: "geometric-dark",
    name: "Geometric Dark",
    url: "https://source.unsplash.com/oyXis2kALVg/1920x1080",
    category: "space",
  },
  // Gradients
  {
    id: "gradient-void",
    name: "Void",
    type: "color",
    value: "hsl(240 7% 4%)",
    category: "gradient",
  },
  {
    id: "gradient-cosmic",
    name: "Cosmic",
    type: "gradient",
    value: "linear-gradient(135deg, hsl(240 7% 4%) 0%, hsl(263 74% 15%) 50%, hsl(190 100% 15%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-aurora",
    name: "Aurora",
    type: "gradient",
    value: "linear-gradient(180deg, hsl(240 7% 4%) 0%, hsl(153 100% 12%) 50%, hsl(190 100% 15%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-crimson",
    name: "Crimson",
    type: "gradient",
    value: "linear-gradient(135deg, hsl(240 7% 4%) 0%, hsl(347 100% 12%) 100%)",
    category: "gradient",
  },
  // Solid Colors
  {
    id: "color-void",
    name: "Void",
    type: "color",
    value: "hsl(240 7% 4%)",
    category: "color",
  },
  {
    id: "color-midnight",
    name: "Midnight Blue",
    type: "color",
    value: "hsl(220 50% 8%)",
    category: "color",
  },
  {
    id: "color-cosmic",
    name: "Cosmic Purple",
    type: "color",
    value: "hsl(270 40% 10%)",
    category: "color",
  },
  {
    id: "color-abyss",
    name: "Abyss",
    type: "color",
    value: "hsl(200 30% 6%)",
    category: "color",
  },
  {
    id: "color-charcoal",
    name: "Charcoal",
    type: "color",
    value: "hsl(0 0% 8%)",
    category: "color",
  },
  {
    id: "color-nebula",
    name: "Nebula Red",
    type: "color",
    value: "hsl(350 40% 10%)",
    category: "color",
  },
];

const STORAGE_KEY = "cosmos-builder-background";
const CUSTOM_BG_STORAGE_KEY = "cosmos-builder-custom-background";

// Preload images for faster switching
const preloadImages = () => {
  BACKGROUND_OPTIONS.forEach((option) => {
    if (option.url) {
      const img = new Image();
      img.src = option.url;
    }
  });
};

export const useBackground = () => {
  const [backgroundId, setBackgroundId] = useState<string>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [customBackground, setCustomBackgroundState] = useState<string | null>(null);

  // Preload all background images on mount
  useEffect(() => {
    preloadImages();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const customBg = localStorage.getItem(CUSTOM_BG_STORAGE_KEY);
    if (customBg) {
      setCustomBackgroundState(customBg);
    }
    if (stored) {
      setBackgroundId(stored);
    }
  }, []);

  useEffect(() => {
    const selected = BACKGROUND_OPTIONS.find((bg) => bg.id === backgroundId);
    const root = document.documentElement;

    // Remove all background classes first
    document.body.classList.remove("custom-background", "starfield", "gradient-background");
    root.style.removeProperty("--custom-background");
    root.style.removeProperty("--gradient-background");

    if (backgroundId === "custom" && customBackground) {
      // Custom uploaded image
      root.style.setProperty("--custom-background", `url(${customBackground})`);
      document.body.classList.add("custom-background");
    } else if (selected?.type === "gradient" || selected?.type === "color") {
      // Gradient or solid color
      root.style.setProperty("--gradient-background", selected.value || "");
      document.body.classList.add("gradient-background");
    } else if (selected?.url) {
      // Unsplash image
      root.style.setProperty("--custom-background", `url(${selected.url})`);
      document.body.classList.add("custom-background");
    } else {
      // Default starfield
      document.body.classList.add("starfield");
    }
  }, [backgroundId, customBackground]);

  const setBackground = (id: string) => {
    const selected = BACKGROUND_OPTIONS.find((bg) => bg.id === id);

    // If selecting an image, show loading state briefly
    if (selected?.url) {
      setIsLoading(true);
      const img = new Image();
      img.onload = () => {
        setBackgroundId(id);
        localStorage.setItem(STORAGE_KEY, id);
        setIsLoading(false);
      };
      img.onerror = () => {
        // Still set the background even if preload fails
        setBackgroundId(id);
        localStorage.setItem(STORAGE_KEY, id);
        setIsLoading(false);
      };
      img.src = selected.url;
    } else {
      setBackgroundId(id);
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  const setCustomBackground = (dataUrl: string) => {
    setCustomBackgroundState(dataUrl);
    localStorage.setItem(CUSTOM_BG_STORAGE_KEY, dataUrl);
    setBackgroundId("custom");
    localStorage.setItem(STORAGE_KEY, "custom");
  };

  const clearCustomBackground = () => {
    setCustomBackgroundState(null);
    localStorage.removeItem(CUSTOM_BG_STORAGE_KEY);
    if (backgroundId === "custom") {
      setBackgroundId("default");
      localStorage.setItem(STORAGE_KEY, "default");
    }
  };

  return {
    backgroundId,
    setBackground,
    options: BACKGROUND_OPTIONS,
    isLoading,
    customBackground,
    setCustomBackground,
    clearCustomBackground,
  };
};

export { BACKGROUND_OPTIONS };
