import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n"; // Initialize i18next before app renders

createRoot(document.getElementById("root")!).render(<App />);
