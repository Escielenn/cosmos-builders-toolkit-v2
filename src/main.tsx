import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // Initialize i18next before app renders
import { initSentry } from "./lib/sentry";
import { initTheme } from "./hooks/use-theme";

// Run Sentry init before App renders so errors during initial mount
// are captured. No-op when VITE_SENTRY_DSN is unset.
initSentry();

// Theme attribute + mode class before first render (no-flash.js already set
// the attribute pre-paint; this keeps the .dark/.light class in step).
initTheme();

createRoot(document.getElementById("root")!).render(<App />);
