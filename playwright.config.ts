import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./tests/results",
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  workers: 1,
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
