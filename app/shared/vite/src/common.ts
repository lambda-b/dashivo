import type { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { analysisAssets } from "@dashivo/shared-vite/common/plugins/analysis-assets";

export const createDashboardViteConfiguration = (
  clientRoot: string,
  dashboardPath: string,
  pyodideRuntimePath: string,
  dashboardRoot: string,
): UserConfig => ({
  root: clientRoot,
  resolve: {
    tsconfigPaths: true,
    alias: {
      "#dashboard/dashboard.json": dashboardPath,
      "virtual:dashivo/pyodide-runtime": pyodideRuntimePath,
    },
  },
  plugins: [react(), tailwindcss(), analysisAssets(dashboardPath, dashboardRoot)],
  worker: {
    format: "iife",
    rollupOptions: {
      output: { banner: "globalThis.importScripts = undefined;", codeSplitting: false },
    },
  },
});
