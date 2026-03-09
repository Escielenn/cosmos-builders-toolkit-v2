import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface BackgroundOption {
  id: string;
  name: string;
  url?: string;
  type?: "image" | "gradient" | "color" | "video";
  value?: string;
  category: "default" | "space" | "gradient" | "color" | "video";
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
  // ESA Hubble Space Telescope Images (Public Domain)
  {
    id: "orion-nebula",
    name: "Orion Nebula",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic0601a.jpg",
    category: "space",
  },
  {
    id: "crab-nebula",
    name: "Crab Nebula",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic0515a.jpg",
    category: "space",
  },
  {
    id: "pillars-of-creation",
    name: "Pillars of Creation",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic1501a.jpg",
    category: "space",
  },
  {
    id: "bubble-nebula",
    name: "Bubble Nebula",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic1608a.jpg",
    category: "space",
  },
  {
    id: "mystic-mountain",
    name: "Mystic Mountain",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic1007a.jpg",
    category: "space",
  },
  {
    id: "butterfly-nebula",
    name: "Butterfly Nebula",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic0910h.jpg",
    category: "space",
  },
  {
    id: "whirlpool-galaxy",
    name: "Whirlpool Galaxy",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic0506a.jpg",
    category: "space",
  },
  {
    id: "andromeda",
    name: "Andromeda Galaxy",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic1502a.jpg",
    category: "space",
  },
  {
    id: "starburst-m82",
    name: "Starburst Galaxy M82",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic0604a.jpg",
    category: "space",
  },
  {
    id: "ring-nebula",
    name: "Ring Nebula",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic1310a.jpg",
    category: "space",
  },
  {
    id: "lagoon-nebula",
    name: "Lagoon Nebula",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic1808a.jpg",
    category: "space",
  },
  {
    id: "tarantula-nebula",
    name: "Tarantula Nebula",
    url: "https://cdn.esahubble.org/archives/images/wallpaper4/heic1105a.jpg",
    category: "space",
  },
  // Videos
  {
    id: "video-starfield",
    name: "Starfield",
    type: "video",
    url: "/video/bkgvideos/starfield.mov",
    category: "video",
  },
  {
    id: "video-nebula-1",
    name: "Nebula I",
    type: "video",
    url: "/video/bkgvideos/nebula%201.mp4",
    category: "video",
  },
  {
    id: "video-nebula-2",
    name: "Nebula II",
    type: "video",
    url: "/video/bkgvideos/nebula%202.mov",
    category: "video",
  },
  {
    id: "video-cosmos-1",
    name: "Cosmos I",
    type: "video",
    url: "/video/bkgvideos/BKg%201.mov",
    category: "video",
  },
  {
    id: "video-cosmos-2",
    name: "Cosmos II",
    type: "video",
    url: "/video/bkgvideos/bkg%202.mov",
    category: "video",
  },
  {
    id: "video-starships",
    name: "Starships",
    type: "video",
    url: "/video/bkgvideos/Starships.mov",
    category: "video",
  },
  {
    id: "video-kepler",
    name: "Kepler",
    type: "video",
    url: "/video/bkgvideos/kepler%201r.mov",
    category: "video",
  },
  {
    id: "video-venus",
    name: "Venus",
    type: "video",
    url: "/video/bkgvideos/venus.mp4",
    category: "video",
  },
  {
    id: "video-space-station",
    name: "Space Station",
    type: "video",
    url: "/video/bkgvideos/space%20station.mp4",
    category: "video",
  },
  {
    id: "video-futuristic",
    name: "Futuristic",
    type: "video",
    url: "/video/bkgvideos/futuristic.mov",
    category: "video",
  },
  {
    id: "video-tech",
    name: "Tech",
    type: "video",
    url: "/video/bkgvideos/tech%202.mov",
    category: "video",
  },
  {
    id: "video-1",
    name: "Drift I",
    type: "video",
    url: "/video/bkgvideos/video%201.mov",
    category: "video",
  },
  {
    id: "video-2",
    name: "Drift II",
    type: "video",
    url: "/video/bkgvideos/video%202.mp4",
    category: "video",
  },
  {
    id: "video-3",
    name: "Drift III",
    type: "video",
    url: "/video/bkgvideos/video%203.mp4",
    category: "video",
  },
  {
    id: "video-4",
    name: "Drift IV",
    type: "video",
    url: "/video/bkgvideos/video%204.mp4",
    category: "video",
  },
  // Gradients
  {
    id: "gradient-void",
    name: "Void",
    type: "color",
    value: "hsl(222 30% 5%)",
    category: "gradient",
  },
  {
    id: "gradient-cosmic",
    name: "Cosmic",
    type: "gradient",
    value: "linear-gradient(135deg, hsl(222 30% 5%) 0%, hsl(263 74% 15%) 50%, hsl(190 100% 15%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-aurora",
    name: "Aurora",
    type: "gradient",
    value: "linear-gradient(180deg, hsl(222 30% 5%) 0%, hsl(153 100% 12%) 50%, hsl(190 100% 15%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-crimson",
    name: "Crimson",
    type: "gradient",
    value: "linear-gradient(135deg, hsl(222 30% 5%) 0%, hsl(347 100% 12%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-teal-drift",
    name: "Teal Drift",
    type: "gradient",
    value: "linear-gradient(160deg, hsl(222 30% 5%) 0%, hsl(157 80% 12%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-supernova",
    name: "Supernova",
    type: "gradient",
    value: "linear-gradient(135deg, hsl(222 30% 5%) 0%, hsl(30 80% 12%) 50%, hsl(347 60% 10%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-event-horizon",
    name: "Event Horizon",
    type: "gradient",
    value: "radial-gradient(ellipse at center, hsl(222 35% 3%) 0%, hsl(263 60% 10%) 60%, hsl(222 30% 5%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-nebula-glow",
    name: "Nebula Glow",
    type: "gradient",
    value: "linear-gradient(150deg, hsl(222 30% 5%) 0%, hsl(153 70% 10%) 40%, hsl(263 50% 12%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-red-giant",
    name: "Red Giant",
    type: "gradient",
    value: "linear-gradient(180deg, hsl(222 30% 5%) 0%, hsl(15 70% 10%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-pulsar",
    name: "Pulsar",
    type: "gradient",
    value: "linear-gradient(180deg, hsl(222 30% 5%) 0%, hsl(190 80% 10%) 50%, hsl(222 30% 5%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-deep-field",
    name: "Deep Field",
    type: "gradient",
    value: "linear-gradient(180deg, hsl(222 30% 5%) 0%, hsl(220 60% 10%) 50%, hsl(222 30% 5%) 100%)",
    category: "gradient",
  },
  {
    id: "gradient-binary",
    name: "Binary",
    type: "gradient",
    value: "linear-gradient(135deg, hsl(222 30% 5%) 0%, hsl(157 60% 10%) 50%, hsl(30 60% 10%) 100%)",
    category: "gradient",
  },
  // Solid Colors
  {
    id: "color-void",
    name: "Void",
    type: "color",
    value: "hsl(222 30% 5%)",
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
const SESSION_RANDOM_BG_KEY = "cosmos-builder-session-background";

// Get space images for random rotation
const getSpaceImages = () => BACKGROUND_OPTIONS.filter(bg => bg.category === "space" && bg.url);

// Get a random background ID from space images
const getRandomSpaceBackground = (): string => {
  const spaceImages = getSpaceImages();
  if (spaceImages.length === 0) return "default";
  const randomIndex = Math.floor(Math.random() * spaceImages.length);
  return spaceImages[randomIndex].id;
};

// Preload images for faster switching (skip videos)
const preloadImages = () => {
  BACKGROUND_OPTIONS.forEach((option) => {
    if (option.url && option.type !== "video") {
      const img = new window.Image();
      img.src = option.url;
    }
  });
};

// ── Context ────────────────────────────────────────────────────────

interface BackgroundContextValue {
  backgroundId: string;
  setBackground: (id: string) => void;
  options: BackgroundOption[];
  isLoading: boolean;
  customBackground: string | null;
  setCustomBackground: (dataUrl: string) => void;
  clearCustomBackground: () => void;
  hasUserPreference: boolean;
  resetToRandom: () => void;
  isVideoBackground: boolean;
  videoUrl: string | null;
  backgroundVisible: boolean;
  toggleBackgroundVisible: () => void;
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [backgroundId, setBackgroundId] = useState<string>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [customBackground, setCustomBackgroundState] = useState<string | null>(null);
  const [hasUserPreference, setHasUserPreference] = useState<boolean>(false);
  const [backgroundVisible, setBackgroundVisible] = useState<boolean>(() => {
    const stored = localStorage.getItem("sf-background-visible");
    return stored !== "false"; // default true
  });

  // Preload all background images on mount
  useEffect(() => {
    preloadImages();
  }, []);

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const customBg = localStorage.getItem(CUSTOM_BG_STORAGE_KEY);

    if (customBg) {
      setCustomBackgroundState(customBg);
    }

    if (stored) {
      setBackgroundId(stored);
      setHasUserPreference(true);
    } else {
      let sessionBg = sessionStorage.getItem(SESSION_RANDOM_BG_KEY);
      if (!sessionBg) {
        sessionBg = getRandomSpaceBackground();
        sessionStorage.setItem(SESSION_RANDOM_BG_KEY, sessionBg);
      }
      setBackgroundId(sessionBg);
      setHasUserPreference(false);
    }
  }, []);

  // Derive video state
  const selectedOption = BACKGROUND_OPTIONS.find((bg) => bg.id === backgroundId);
  const isVideoBackground = selectedOption?.type === "video";
  const videoUrl = isVideoBackground ? selectedOption?.url || null : null;

  // Apply body classes based on background selection
  useEffect(() => {
    const selected = BACKGROUND_OPTIONS.find((bg) => bg.id === backgroundId);
    const root = document.documentElement;

    // Remove ALL background classes and CSS variables first
    document.body.classList.remove("custom-background", "starfield", "gradient-background", "video-background");
    root.style.removeProperty("--custom-background");
    root.style.removeProperty("--gradient-background");

    // If background is hidden, leave body with no background class (plain dark)
    if (!backgroundVisible) return;

    if (selected?.type === "video") {
      // Video mode: solid black body, VideoBackground component handles the visual
      document.body.classList.add("video-background");
    } else if (backgroundId === "custom" && customBackground) {
      root.style.setProperty("--custom-background", `url(${customBackground})`);
      document.body.classList.add("custom-background");
    } else if (selected?.type === "gradient" || selected?.type === "color") {
      root.style.setProperty("--gradient-background", selected.value || "");
      document.body.classList.add("gradient-background");
    } else if (selected?.url) {
      root.style.setProperty("--custom-background", `url(${selected.url})`);
      document.body.classList.add("custom-background");
    } else {
      document.body.classList.add("starfield");
    }
  }, [backgroundId, customBackground, backgroundVisible]);

  const setBackground = (id: string) => {
    const selected = BACKGROUND_OPTIONS.find((bg) => bg.id === id);

    setHasUserPreference(true);

    // Videos: set immediately (no image preload needed)
    if (selected?.type === "video") {
      setBackgroundId(id);
      localStorage.setItem(STORAGE_KEY, id);
      return;
    }

    // Images: preload before switching for smooth transition
    if (selected?.url) {
      setIsLoading(true);
      const img = new window.Image();
      img.onload = () => {
        setBackgroundId(id);
        localStorage.setItem(STORAGE_KEY, id);
        setIsLoading(false);
      };
      img.onerror = () => {
        setBackgroundId(id);
        localStorage.setItem(STORAGE_KEY, id);
        setIsLoading(false);
      };
      img.src = selected.url;
    } else {
      // Gradients, colors, default
      setBackgroundId(id);
      localStorage.setItem(STORAGE_KEY, id);
    }
  };

  const setCustomBackground = (dataUrl: string) => {
    setCustomBackgroundState(dataUrl);
    localStorage.setItem(CUSTOM_BG_STORAGE_KEY, dataUrl);
    setBackgroundId("custom");
    localStorage.setItem(STORAGE_KEY, "custom");
    setHasUserPreference(true);
  };

  const clearCustomBackground = () => {
    setCustomBackgroundState(null);
    localStorage.removeItem(CUSTOM_BG_STORAGE_KEY);
    if (backgroundId === "custom") {
      setBackgroundId("default");
      localStorage.setItem(STORAGE_KEY, "default");
    }
  };

  const resetToRandom = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_RANDOM_BG_KEY);
    const newRandomBg = getRandomSpaceBackground();
    sessionStorage.setItem(SESSION_RANDOM_BG_KEY, newRandomBg);
    setBackgroundId(newRandomBg);
    setHasUserPreference(false);
  };

  const toggleBackgroundVisible = () => {
    setBackgroundVisible((prev) => {
      const next = !prev;
      localStorage.setItem("sf-background-visible", String(next));
      return next;
    });
  };

  const value: BackgroundContextValue = {
    backgroundId,
    setBackground,
    options: BACKGROUND_OPTIONS,
    isLoading,
    customBackground,
    setCustomBackground,
    clearCustomBackground,
    hasUserPreference,
    resetToRandom,
    isVideoBackground,
    videoUrl,
    backgroundVisible,
    toggleBackgroundVisible,
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = (): BackgroundContextValue => {
  const ctx = useContext(BackgroundContext);
  if (!ctx) {
    throw new Error("useBackground must be used within a BackgroundProvider");
  }
  return ctx;
};

export { BACKGROUND_OPTIONS };
