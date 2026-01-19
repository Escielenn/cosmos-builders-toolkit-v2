import { useState, useEffect } from "react";

const BACKGROUND_OPTIONS = [
  {
    id: "default",
    name: "Default Starfield",
    url: "", // Uses CSS starfield
  },
  {
    id: "nebula",
    name: "Nebula",
    url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80",
  },
  {
    id: "earth",
    name: "Earth from Space",
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80",
  },
  {
    id: "stars",
    name: "Star Field",
    url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1920&q=80",
  },
  {
    id: "milkyway",
    name: "Milky Way",
    url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    url: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1920&q=80",
  },
  {
    id: "aurora",
    name: "Aurora",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80",
  },
  {
    id: "cosmos",
    name: "Deep Space",
    url: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1920&q=80",
  },
];

const STORAGE_KEY = "cosmos-builder-background";

export const useBackground = () => {
  const [backgroundId, setBackgroundId] = useState<string>("default");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setBackgroundId(stored);
    }
  }, []);

  useEffect(() => {
    const selected = BACKGROUND_OPTIONS.find((bg) => bg.id === backgroundId);
    const root = document.documentElement;

    if (selected && selected.url) {
      root.style.setProperty("--custom-background", `url(${selected.url})`);
      document.body.classList.add("custom-background");
      document.body.classList.remove("starfield");
    } else {
      root.style.removeProperty("--custom-background");
      document.body.classList.remove("custom-background");
      document.body.classList.add("starfield");
    }
  }, [backgroundId]);

  const setBackground = (id: string) => {
    setBackgroundId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  return {
    backgroundId,
    setBackground,
    options: BACKGROUND_OPTIONS,
  };
};

export { BACKGROUND_OPTIONS };
