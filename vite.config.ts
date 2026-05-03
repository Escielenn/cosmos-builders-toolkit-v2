import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import mdx from "@mdx-js/rollup";
import path from "path";
import * as fs from "node:fs";
import { visualizer } from "rollup-plugin-visualizer";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// Pull APP_VERSION out of src/config/version.ts at build time so the
// Sentry release name matches the runtime SDK config in src/lib/sentry.ts.
// Both stamp `stellarforge@<APP_VERSION>` so uploaded source maps attach
// to the same release the SDK reports errors against.
const versionSource = fs.readFileSync("./src/config/version.ts", "utf8");
const versionMatch = versionSource.match(/APP_VERSION\s*=\s*"([^"]+)"/);
const APP_VERSION = versionMatch?.[1] ?? "unknown";
const SENTRY_RELEASE = `stellarforge@${APP_VERSION}`;

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
    // Sentry source-maps upload. Must be last in the plugins array per
    // Sentry's docs so it sees the final bundle output. Disabled when
    // SENTRY_AUTH_TOKEN is unset (local builds, contributor clones, or
    // any environment that didn't get the token wired) — the plugin
    // logs a warning and skips upload rather than failing the build.
    sentryVitePlugin({
      org: "dreamside-studios",
      project: "javascript-react-r3",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: SENTRY_RELEASE },
      sourcemaps: {
        assets: "./dist/**",
        // Delete .map files from the local build after upload so they
        // aren't served from the public bundle. Sentry has them now;
        // browsers don't need them.
        filesToDeleteAfterUpload: "./dist/**/*.map",
      },
      // Don't break the build if the token's missing or upload fails.
      // The runtime SDK still works without source-maps, just with
      // minified stack traces.
      errorHandler: (err) => {
        console.warn("[sentry-vite-plugin] " + err.message);
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Generate .map files for sentryVitePlugin to upload. The plugin
    // deletes them post-upload via filesToDeleteAfterUpload so they
    // don't ship in the public bundle.
    sourcemap: true,
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
