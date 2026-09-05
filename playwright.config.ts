import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 120_000,
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3030",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    headless: true,
  },
});
