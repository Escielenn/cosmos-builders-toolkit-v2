import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // Initialize i18next before app renders
import { initSentry } from "./lib/sentry";

// Run Sentry init before App renders so errors during initial mount
// are captured. No-op when VITE_SENTRY_DSN is unset.
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
