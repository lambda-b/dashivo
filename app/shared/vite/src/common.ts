import type { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { analysisAssets } from "@dashlet/shared-vite/plugins/analysis-assets";

export const createDashboardViteConfiguration = (
  clientRoot: string,
  dashboardPath: string,
  pyodideRuntimePath: string,
): UserConfig => ({
  root: clientRoot,
  resolve: {
    tsconfigPaths: true,
    alias: {
      "#dashboard/dashboard.json": dashboardPath,
      "virtual:dashlet/pyodide-runtime": pyodideRuntimePath,
    },
  },
  plugins: [react(), tailwindcss(), analysisAssets(dashboardPath)],
  worker: {
    format: "iife",
    rollupOptions: {
      output: { banner: "globalThis.importScripts = undefined;", codeSplitting: false },
    },
  },
});
