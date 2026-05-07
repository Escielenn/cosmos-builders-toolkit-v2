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

// Source maps are generated only when we have a Sentry auth token to upload
// them with. Without the token, the plugin can't delete .map files post-upload
// (deletion runs after a successful upload), so they'd ship in ./dist/ and be
// publicly served. Better to skip generation entirely than to risk leaking
// pre-bundle source via map files referenced by `//# sourceMappingURL=`.
const SENTRY_UPLOAD_ENABLED = !!process.env.SENTRY_AUTH_TOKEN;

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
    // Sentry's docs so it sees the final bundle output. Only registered
    // when SENTRY_AUTH_TOKEN is present; without it, the plugin can't
    // upload OR delete the .map files, so we skip both the plugin and
    // sourcemap generation (see build.sourcemap below).
    SENTRY_UPLOAD_ENABLED &&
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
        // Fail the build if upload errors when the token IS set —
        // misconfiguration is worth catching at CI time rather than
        // silently shipping minified stack traces to Sentry. (When the
        // token is absent, the plugin isn't registered at all, so this
        // handler doesn't fire for the contributor-clone case.)
        errorHandler: (err) => {
          throw new Error(
            "[sentry-vite-plugin] Source-map upload failed; failing build to avoid shipping unuploaded maps. " +
              err.message,
          );
        },
      }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // "hidden" emits .map files for the Sentry plugin to consume and upload,
    // but omits the trailing `//# sourceMappingURL=` comment from the bundle
    // so attackers can't trivially discover the map URLs even if a map file
    // ever survives a failed deletion. When SENTRY_UPLOAD_ENABLED is false,
    // disable map generation entirely.
    sourcemap: SENTRY_UPLOAD_ENABLED ? "hidden" : false,
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
