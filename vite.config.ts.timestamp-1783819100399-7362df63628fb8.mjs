// vite.config.ts
import { defineConfig } from "file:///C:/Users/NCG/Dropbox/Repositories/cosmos-builders-toolkit-v2/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/NCG/Dropbox/Repositories/cosmos-builders-toolkit-v2/node_modules/@vitejs/plugin-react-swc/index.js";
import mdx from "file:///C:/Users/NCG/Dropbox/Repositories/cosmos-builders-toolkit-v2/node_modules/@mdx-js/rollup/index.js";
import path from "path";
import * as fs from "node:fs";
import { visualizer } from "file:///C:/Users/NCG/Dropbox/Repositories/cosmos-builders-toolkit-v2/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { sentryVitePlugin } from "file:///C:/Users/NCG/Dropbox/Repositories/cosmos-builders-toolkit-v2/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\NCG\\Dropbox\\Repositories\\cosmos-builders-toolkit-v2";
var versionSource = fs.readFileSync("./src/config/version.ts", "utf8");
var versionMatch = versionSource.match(/APP_VERSION\s*=\s*"([^"]+)"/);
var APP_VERSION = versionMatch?.[1] ?? "unknown";
var SENTRY_RELEASE = `stellarforge@${APP_VERSION}`;
var SENTRY_UPLOAD_ENABLED = !!process.env.SENTRY_AUTH_TOKEN;
var vite_config_default = defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  plugins: [
    { enforce: "pre", ...mdx() },
    react(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true
    }),
    // Sentry source-maps upload. Must be last in the plugins array per
    // Sentry's docs so it sees the final bundle output. Only registered
    // when SENTRY_AUTH_TOKEN is present; without it, the plugin can't
    // upload OR delete the .map files, so we skip both the plugin and
    // sourcemap generation (see build.sourcemap below).
    SENTRY_UPLOAD_ENABLED && sentryVitePlugin({
      org: "dreamside-studios",
      project: "javascript-react-r3",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: SENTRY_RELEASE },
      sourcemaps: {
        assets: "./dist/**",
        // Delete .map files from the local build after upload so they
        // aren't served from the public bundle. Sentry has them now;
        // browsers don't need them.
        filesToDeleteAfterUpload: "./dist/**/*.map"
      },
      // Fail the build if upload errors when the token IS set —
      // misconfiguration is worth catching at CI time rather than
      // silently shipping minified stack traces to Sentry. (When the
      // token is absent, the plugin isn't registered at all, so this
      // handler doesn't fire for the contributor-clone case.)
      errorHandler: (err) => {
        throw new Error(
          "[sentry-vite-plugin] Source-map upload failed; failing build to avoid shipping unuploaded maps. " + err.message
        );
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
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
            "@radix-ui/react-tooltip"
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
          "vendor-sanity": ["@sanity/client", "@sanity/image-url"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxOQ0dcXFxcRHJvcGJveFxcXFxSZXBvc2l0b3JpZXNcXFxcY29zbW9zLWJ1aWxkZXJzLXRvb2xraXQtdjJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXE5DR1xcXFxEcm9wYm94XFxcXFJlcG9zaXRvcmllc1xcXFxjb3Ntb3MtYnVpbGRlcnMtdG9vbGtpdC12MlxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvTkNHL0Ryb3Bib3gvUmVwb3NpdG9yaWVzL2Nvc21vcy1idWlsZGVycy10b29sa2l0LXYyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IG1keCBmcm9tIFwiQG1keC1qcy9yb2xsdXBcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0ICogYXMgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcclxuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjtcclxuaW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gXCJAc2VudHJ5L3ZpdGUtcGx1Z2luXCI7XHJcblxyXG4vLyBQdWxsIEFQUF9WRVJTSU9OIG91dCBvZiBzcmMvY29uZmlnL3ZlcnNpb24udHMgYXQgYnVpbGQgdGltZSBzbyB0aGVcclxuLy8gU2VudHJ5IHJlbGVhc2UgbmFtZSBtYXRjaGVzIHRoZSBydW50aW1lIFNESyBjb25maWcgaW4gc3JjL2xpYi9zZW50cnkudHMuXHJcbi8vIEJvdGggc3RhbXAgYHN0ZWxsYXJmb3JnZUA8QVBQX1ZFUlNJT04+YCBzbyB1cGxvYWRlZCBzb3VyY2UgbWFwcyBhdHRhY2hcclxuLy8gdG8gdGhlIHNhbWUgcmVsZWFzZSB0aGUgU0RLIHJlcG9ydHMgZXJyb3JzIGFnYWluc3QuXHJcbmNvbnN0IHZlcnNpb25Tb3VyY2UgPSBmcy5yZWFkRmlsZVN5bmMoXCIuL3NyYy9jb25maWcvdmVyc2lvbi50c1wiLCBcInV0ZjhcIik7XHJcbmNvbnN0IHZlcnNpb25NYXRjaCA9IHZlcnNpb25Tb3VyY2UubWF0Y2goL0FQUF9WRVJTSU9OXFxzKj1cXHMqXCIoW15cIl0rKVwiLyk7XHJcbmNvbnN0IEFQUF9WRVJTSU9OID0gdmVyc2lvbk1hdGNoPy5bMV0gPz8gXCJ1bmtub3duXCI7XHJcbmNvbnN0IFNFTlRSWV9SRUxFQVNFID0gYHN0ZWxsYXJmb3JnZUAke0FQUF9WRVJTSU9OfWA7XHJcblxyXG4vLyBTb3VyY2UgbWFwcyBhcmUgZ2VuZXJhdGVkIG9ubHkgd2hlbiB3ZSBoYXZlIGEgU2VudHJ5IGF1dGggdG9rZW4gdG8gdXBsb2FkXHJcbi8vIHRoZW0gd2l0aC4gV2l0aG91dCB0aGUgdG9rZW4sIHRoZSBwbHVnaW4gY2FuJ3QgZGVsZXRlIC5tYXAgZmlsZXMgcG9zdC11cGxvYWRcclxuLy8gKGRlbGV0aW9uIHJ1bnMgYWZ0ZXIgYSBzdWNjZXNzZnVsIHVwbG9hZCksIHNvIHRoZXknZCBzaGlwIGluIC4vZGlzdC8gYW5kIGJlXHJcbi8vIHB1YmxpY2x5IHNlcnZlZC4gQmV0dGVyIHRvIHNraXAgZ2VuZXJhdGlvbiBlbnRpcmVseSB0aGFuIHRvIHJpc2sgbGVha2luZ1xyXG4vLyBwcmUtYnVuZGxlIHNvdXJjZSB2aWEgbWFwIGZpbGVzIHJlZmVyZW5jZWQgYnkgYC8vIyBzb3VyY2VNYXBwaW5nVVJMPWAuXHJcbmNvbnN0IFNFTlRSWV9VUExPQURfRU5BQkxFRCA9ICEhcHJvY2Vzcy5lbnYuU0VOVFJZX0FVVEhfVE9LRU47XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIGhtcjoge1xyXG4gICAgICBvdmVybGF5OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICB7IGVuZm9yY2U6IFwicHJlXCIsIC4uLm1keCgpIH0sXHJcbiAgICByZWFjdCgpLFxyXG4gICAgdmlzdWFsaXplcih7XHJcbiAgICAgIGZpbGVuYW1lOiBcImRpc3Qvc3RhdHMuaHRtbFwiLFxyXG4gICAgICBvcGVuOiBmYWxzZSxcclxuICAgICAgZ3ppcFNpemU6IHRydWUsXHJcbiAgICB9KSxcclxuICAgIC8vIFNlbnRyeSBzb3VyY2UtbWFwcyB1cGxvYWQuIE11c3QgYmUgbGFzdCBpbiB0aGUgcGx1Z2lucyBhcnJheSBwZXJcclxuICAgIC8vIFNlbnRyeSdzIGRvY3Mgc28gaXQgc2VlcyB0aGUgZmluYWwgYnVuZGxlIG91dHB1dC4gT25seSByZWdpc3RlcmVkXHJcbiAgICAvLyB3aGVuIFNFTlRSWV9BVVRIX1RPS0VOIGlzIHByZXNlbnQ7IHdpdGhvdXQgaXQsIHRoZSBwbHVnaW4gY2FuJ3RcclxuICAgIC8vIHVwbG9hZCBPUiBkZWxldGUgdGhlIC5tYXAgZmlsZXMsIHNvIHdlIHNraXAgYm90aCB0aGUgcGx1Z2luIGFuZFxyXG4gICAgLy8gc291cmNlbWFwIGdlbmVyYXRpb24gKHNlZSBidWlsZC5zb3VyY2VtYXAgYmVsb3cpLlxyXG4gICAgU0VOVFJZX1VQTE9BRF9FTkFCTEVEICYmXHJcbiAgICAgIHNlbnRyeVZpdGVQbHVnaW4oe1xyXG4gICAgICAgIG9yZzogXCJkcmVhbXNpZGUtc3R1ZGlvc1wiLFxyXG4gICAgICAgIHByb2plY3Q6IFwiamF2YXNjcmlwdC1yZWFjdC1yM1wiLFxyXG4gICAgICAgIGF1dGhUb2tlbjogcHJvY2Vzcy5lbnYuU0VOVFJZX0FVVEhfVE9LRU4sXHJcbiAgICAgICAgcmVsZWFzZTogeyBuYW1lOiBTRU5UUllfUkVMRUFTRSB9LFxyXG4gICAgICAgIHNvdXJjZW1hcHM6IHtcclxuICAgICAgICAgIGFzc2V0czogXCIuL2Rpc3QvKipcIixcclxuICAgICAgICAgIC8vIERlbGV0ZSAubWFwIGZpbGVzIGZyb20gdGhlIGxvY2FsIGJ1aWxkIGFmdGVyIHVwbG9hZCBzbyB0aGV5XHJcbiAgICAgICAgICAvLyBhcmVuJ3Qgc2VydmVkIGZyb20gdGhlIHB1YmxpYyBidW5kbGUuIFNlbnRyeSBoYXMgdGhlbSBub3c7XHJcbiAgICAgICAgICAvLyBicm93c2VycyBkb24ndCBuZWVkIHRoZW0uXHJcbiAgICAgICAgICBmaWxlc1RvRGVsZXRlQWZ0ZXJVcGxvYWQ6IFwiLi9kaXN0LyoqLyoubWFwXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBGYWlsIHRoZSBidWlsZCBpZiB1cGxvYWQgZXJyb3JzIHdoZW4gdGhlIHRva2VuIElTIHNldCBcdTIwMTRcclxuICAgICAgICAvLyBtaXNjb25maWd1cmF0aW9uIGlzIHdvcnRoIGNhdGNoaW5nIGF0IENJIHRpbWUgcmF0aGVyIHRoYW5cclxuICAgICAgICAvLyBzaWxlbnRseSBzaGlwcGluZyBtaW5pZmllZCBzdGFjayB0cmFjZXMgdG8gU2VudHJ5LiAoV2hlbiB0aGVcclxuICAgICAgICAvLyB0b2tlbiBpcyBhYnNlbnQsIHRoZSBwbHVnaW4gaXNuJ3QgcmVnaXN0ZXJlZCBhdCBhbGwsIHNvIHRoaXNcclxuICAgICAgICAvLyBoYW5kbGVyIGRvZXNuJ3QgZmlyZSBmb3IgdGhlIGNvbnRyaWJ1dG9yLWNsb25lIGNhc2UuKVxyXG4gICAgICAgIGVycm9ySGFuZGxlcjogKGVycikgPT4ge1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICAgICBcIltzZW50cnktdml0ZS1wbHVnaW5dIFNvdXJjZS1tYXAgdXBsb2FkIGZhaWxlZDsgZmFpbGluZyBidWlsZCB0byBhdm9pZCBzaGlwcGluZyB1bnVwbG9hZGVkIG1hcHMuIFwiICtcclxuICAgICAgICAgICAgICBlcnIubWVzc2FnZSxcclxuICAgICAgICAgICk7XHJcbiAgICAgICAgfSxcclxuICAgICAgfSksXHJcbiAgXSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gXCJoaWRkZW5cIiBlbWl0cyAubWFwIGZpbGVzIGZvciB0aGUgU2VudHJ5IHBsdWdpbiB0byBjb25zdW1lIGFuZCB1cGxvYWQsXHJcbiAgICAvLyBidXQgb21pdHMgdGhlIHRyYWlsaW5nIGAvLyMgc291cmNlTWFwcGluZ1VSTD1gIGNvbW1lbnQgZnJvbSB0aGUgYnVuZGxlXHJcbiAgICAvLyBzbyBhdHRhY2tlcnMgY2FuJ3QgdHJpdmlhbGx5IGRpc2NvdmVyIHRoZSBtYXAgVVJMcyBldmVuIGlmIGEgbWFwIGZpbGVcclxuICAgIC8vIGV2ZXIgc3Vydml2ZXMgYSBmYWlsZWQgZGVsZXRpb24uIFdoZW4gU0VOVFJZX1VQTE9BRF9FTkFCTEVEIGlzIGZhbHNlLFxyXG4gICAgLy8gZGlzYWJsZSBtYXAgZ2VuZXJhdGlvbiBlbnRpcmVseS5cclxuICAgIHNvdXJjZW1hcDogU0VOVFJZX1VQTE9BRF9FTkFCTEVEID8gXCJoaWRkZW5cIiA6IGZhbHNlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIC8vIFJlYWN0IGNvcmVcclxuICAgICAgICAgIFwidmVuZG9yLXJlYWN0XCI6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3Qtcm91dGVyLWRvbVwiXSxcclxuICAgICAgICAgIC8vIFVJIGNvbXBvbmVudHMgKFJhZGl4KVxyXG4gICAgICAgICAgXCJ2ZW5kb3ItdWlcIjogW1xyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1hY2NvcmRpb25cIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtYWxlcnQtZGlhbG9nXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNoZWNrYm94XCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNvbGxhcHNpYmxlXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRpYWxvZ1wiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51XCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWxhYmVsXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXBvcG92ZXJcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtcmFkaW8tZ3JvdXBcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0XCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXNlcGFyYXRvclwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zbGlkZXJcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2xvdFwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zd2l0Y2hcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b2FzdFwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b29sdGlwXCIsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgLy8gUERGIGdlbmVyYXRpb24gKGhlYXZ5KVxyXG4gICAgICAgICAgXCJ2ZW5kb3ItcGRmXCI6IFtcIkByZWFjdC1wZGYvcmVuZGVyZXJcIl0sXHJcbiAgICAgICAgICAvLyBXb3JkIGRvY3VtZW50IGdlbmVyYXRpb25cclxuICAgICAgICAgIFwidmVuZG9yLWRvY3hcIjogW1wiZG9jeFwiLCBcImZpbGUtc2F2ZXJcIl0sXHJcbiAgICAgICAgICAvLyBEMyBmb3IgdmlzdWFsaXphdGlvbnNcclxuICAgICAgICAgIFwidmVuZG9yLWQzXCI6IFtcImQzLWZvcmNlXCJdLFxyXG4gICAgICAgICAgLy8gVGhyZWUuanMgKFNvbGFyaXMgc2ltdWxhdG9yIG9ubHkpXHJcbiAgICAgICAgICBcInZlbmRvci10aHJlZVwiOiBbXCJ0aHJlZVwiLCBcIkByZWFjdC10aHJlZS9maWJlclwiLCBcIkByZWFjdC10aHJlZS9kcmVpXCJdLFxyXG4gICAgICAgICAgLy8gaHRtbDJjYW52YXMgKHZpc3VhbCBleHBvcnQgb25seSlcclxuICAgICAgICAgIFwidmVuZG9yLWh0bWwyY2FudmFzXCI6IFtcImh0bWwyY2FudmFzXCJdLFxyXG4gICAgICAgICAgLy8gU3VwYWJhc2VcclxuICAgICAgICAgIFwidmVuZG9yLXN1cGFiYXNlXCI6IFtcIkBzdXBhYmFzZS9zdXBhYmFzZS1qc1wiXSxcclxuICAgICAgICAgIC8vIFJlYWN0IFF1ZXJ5XHJcbiAgICAgICAgICBcInZlbmRvci1xdWVyeVwiOiBbXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIl0sXHJcbiAgICAgICAgICAvLyBGcmFtZXIgTW90aW9uIChsYW5kaW5nIHBhZ2UgYW5pbWF0aW9ucylcclxuICAgICAgICAgIFwidmVuZG9yLW1vdGlvblwiOiBbXCJmcmFtZXItbW90aW9uXCJdLFxyXG4gICAgICAgICAgLy8gU2FuaXR5IENNUyAoTGVhcm4gcGFnZXMgb25seSlcclxuICAgICAgICAgIFwidmVuZG9yLXNhbml0eVwiOiBbXCJAc2FuaXR5L2NsaWVudFwiLCBcIkBzYW5pdHkvaW1hZ2UtdXJsXCJdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0p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
