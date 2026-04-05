import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import mdx from "@mdx-js/rollup";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    { enforce: "pre", ...mdx() },
    react(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI components (Radix)
          "vendor-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          // PDF generation (heavy)
          "vendor-pdf": ["@react-pdf/renderer"],
          // Word document generation
          "vendor-docx": ["docx", "file-saver"],
          // D3 for visualizations
          "vendor-d3": ["d3-force"],
          // Three.js (Solaris simulator only)
          "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
          // html2canvas (visual export only)
          "vendor-html2canvas": ["html2canvas"],
          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"],
          // React Query
          "vendor-query": ["@tanstack/react-query"],
          // Framer Motion (landing page animations)
          "vendor-motion": ["framer-motion"],
          // Sanity CMS (Learn pages only)
          "vendor-sanity": ["@sanity/client", "@sanity/image-url"],
        },
      },
    },
  },
});
