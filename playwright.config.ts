import { defineConfig, devices } from "@playwright/test";

// Smoke suite (e2e/). Serves the built app with `vite preview`; build it
// first with `npm run build:e2e` (fake Supabase URL from .env.e2e, which
// e2e/fixtures.ts intercepts). In CI the browser comes from
// `npx playwright install --with-deps chromium`; locally the sandbox ships
// one at /opt/pw-browsers/chromium (override with PW_CHROMIUM_PATH).
const PORT = 4317;
const CI = !!process.env.CI;
const executablePath = CI ? undefined : (process.env.PW_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium");

export default defineConfig({
  testDir: "e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    serviceWorkers: "block",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
